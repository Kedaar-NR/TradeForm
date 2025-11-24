"""Project group management endpoints for CRUD operations."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload
from typing import List
from uuid import UUID

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/api/project-groups", tags=["project-groups"])


@router.post("", response_model=schemas.ProjectGroup, status_code=status.HTTP_201_CREATED)
def create_project_group(project_group: schemas.ProjectGroupCreate, db: Session = Depends(get_db)):
    """Create a new project group"""
    try:
        # Get first user or create a default one if none exists
        user = db.query(models.User).first()
        if not user:
            from app.auth import get_password_hash
            user = models.User(
                email="default@tradeform.com",
                name="Default User",
                password_hash=get_password_hash("default")
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        db_project_group = models.ProjectGroup(
            name=project_group.name,
            description=project_group.description,
            icon=project_group.icon,
            color=project_group.color,
            created_by=user.id
        )

        db.add(db_project_group)
        db.commit()
        db.refresh(db_project_group)
        return db_project_group
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create project group: {str(e)}")


@router.get("", response_model=List[schemas.ProjectGroup])
def list_project_groups(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all project groups"""
    project_groups = db.query(models.ProjectGroup).offset(skip).limit(limit).all()
    return project_groups


@router.get("/{project_group_id}", response_model=schemas.ProjectGroupWithProjects)
def get_project_group(project_group_id: UUID, db: Session = Depends(get_db)):
    """Get project group details with all projects (trade studies) inside"""
    project_group = (
        db.query(models.ProjectGroup)
        .options(selectinload(models.ProjectGroup.projects))
        .filter(models.ProjectGroup.id == project_group_id)
        .first()
    )
    if not project_group:
        raise HTTPException(status_code=404, detail="Project group not found")

    # Ensure projects are loaded and sorted even if relationship isn't preloaded
    if project_group.projects is None or len(project_group.projects) == 0:
        project_group.projects = (
            db.query(models.Project)
            .filter(models.Project.project_group_id == project_group_id)
            .order_by(models.Project.updated_at.desc())
            .all()
        )
    else:
        project_group.projects.sort(key=lambda p: p.updated_at or p.created_at, reverse=True)

    return project_group


@router.put("/{project_group_id}", response_model=schemas.ProjectGroup)
def update_project_group(
    project_group_id: UUID,
    project_group_update: schemas.ProjectGroupUpdate,
    db: Session = Depends(get_db)
):
    """Update project group details"""
    db_project_group = db.query(models.ProjectGroup).filter(models.ProjectGroup.id == project_group_id).first()
    if not db_project_group:
        raise HTTPException(status_code=404, detail="Project group not found")

    for key, value in project_group_update.model_dump(exclude_unset=True).items():
        setattr(db_project_group, key, value)

    db.commit()
    db.refresh(db_project_group)
    return db_project_group


@router.delete("/{project_group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_group(project_group_id: UUID, db: Session = Depends(get_db)):
    """Delete a project group. Projects inside will become ungrouped (project_group_id set to null)."""
    db_project_group = db.query(models.ProjectGroup).filter(models.ProjectGroup.id == project_group_id).first()
    if not db_project_group:
        raise HTTPException(status_code=404, detail="Project group not found")

    try:
        # Unlink all projects from this group
        db.query(models.Project).filter(models.Project.project_group_id == project_group_id).update(
            {"project_group_id": None},
            synchronize_session=False
        )

        db.delete(db_project_group)
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete project group: {exc}") from exc

    return None
