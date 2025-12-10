"""Project management endpoints for CRUD operations."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError, ProgrammingError
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app import models, schemas, auth
from app.database import get_db, run_sql_migrations, ensure_project_group_schema
from app.services.change_logger import log_project_change

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post("", response_model=schemas.Project, status_code=status.HTTP_201_CREATED)
def create_project(
    project: schemas.ProjectCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user_required)
):
    """Create a new trade study project"""
    # Retry once if the database is missing the project_group_id column (migration not applied yet)
    for attempt in range(2):
        try:
            # Persist project with group and status so it shows up under the correct template
            status_value = models.ProjectStatus(project.status.value) if project.status else models.ProjectStatus.DRAFT
            db_project = models.Project(
                name=project.name,
                component_type=project.component_type,
                description=project.description,
                status=status_value,
                project_group_id=project.project_group_id,
                created_by=current_user.id,
            )
            
            db.add(db_project)
            db.flush()
            log_project_change(
                db,
                project_id=db_project.id,
                change_type="project_created",
                description=f"Created project '{db_project.name}'",
                entity_type="project",
                entity_id=db_project.id,
                new_value={
                    "name": db_project.name,
                    "component_type": db_project.component_type,
                    "status": db_project.status.value if db_project.status else None,
                    "project_group_id": str(db_project.project_group_id) if db_project.project_group_id else None,
                },
            )
            db.commit()
            db.refresh(db_project)
            return db_project
        except ProgrammingError as exc:
            db.rollback()
            msg = str(exc).lower()
            if attempt == 0 and "project_group_id" in msg:
                try:
                    run_sql_migrations()
                    ensure_project_group_schema()
                    continue
                except Exception as migrate_exc:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Database migration failed while creating project: {migrate_exc}"
                    ) from migrate_exc
            raise HTTPException(status_code=500, detail=f"Failed to create project: {str(exc)}") from exc
        except Exception as exc:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to create project: {str(exc)}") from exc


@router.get("", response_model=List[schemas.Project])
def list_projects(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user_required)
):
    """List all trade study projects for the current user, sorted by most recently updated"""
    # Retry once if the database is missing the project_group_id column (migration not applied yet)
    for attempt in range(2):
        try:
            projects = db.query(models.Project).filter(
                models.Project.created_by == current_user.id
            ).order_by(models.Project.updated_at.desc()).offset(skip).limit(limit).all()
            return projects
        except ProgrammingError as exc:
            db.rollback()
            msg = str(exc).lower()
            if attempt == 0 and "project_group_id" in msg:
                try:
                    run_sql_migrations()
                    ensure_project_group_schema()
                    continue
                except Exception as migrate_exc:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Database migration failed while listing projects: {migrate_exc}"
                    ) from migrate_exc
            raise HTTPException(status_code=500, detail=f"Failed to list projects: {str(exc)}") from exc
        except ValueError as e:
            # Handle invalid UUID values in the database
            # This can happen if there are legacy records with malformed UUIDs
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error querying projects due to invalid UUID: {e}")
            logger.warning("This usually indicates corrupted data. Please check your database for invalid UUID values.")
            raise HTTPException(
                status_code=500,
                detail=f"Database contains invalid UUID values. Please check and clean your database. Error: {str(e)}"
            )


@router.get("/{project_id}", response_model=schemas.ProjectWithDetails)
def get_project(project_id: UUID, db: Session = Depends(get_db)):
    """Get project details with criteria and components"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=schemas.Project)
def update_project(project_id: UUID, project_update: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    """Update project details"""
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    old_data = {
        "name": db_project.name,
        "component_type": db_project.component_type,
        "description": db_project.description,
        "status": db_project.status.value if db_project.status else None,
    }

    for key, value in project_update.model_dump(exclude_unset=True).items():
        setattr(db_project, key, value)

    db.flush()
    new_data = {
        "name": db_project.name,
        "component_type": db_project.component_type,
        "description": db_project.description,
        "status": db_project.status.value if db_project.status else None,
    }
    log_project_change(
        db,
        project_id=project_id,
        change_type="project_updated",
        description=f"Updated project '{db_project.name}'",
        entity_type="project",
        entity_id=db_project.id,
        old_value=old_data,
        new_value=new_data,
    )

    db.commit()
    db.refresh(db_project)
    return db_project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: UUID, db: Session = Depends(get_db)):
    """Delete a project."""
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        # Clean up dependent rows that don't have ORM cascades yet to avoid FK violations.
        db.query(models.ProjectChange).filter(models.ProjectChange.project_id == project_id).delete(synchronize_session=False)
        db.query(models.ProjectComment).filter(models.ProjectComment.project_id == project_id).delete(synchronize_session=False)
        db.query(models.ProjectShare).filter(models.ProjectShare.project_id == project_id).delete(synchronize_session=False)
        db.query(models.ProjectVersion).filter(models.ProjectVersion.project_id == project_id).delete(synchronize_session=False)

        db.delete(db_project)
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {exc}") from exc

    return None
