"""Project management endpoints for CRUD operations."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app import models, schemas
from app.database import get_db
from app.services.change_logger import log_project_change

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.post("", response_model=schemas.Project, status_code=status.HTTP_201_CREATED)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    """Create a new trade study project"""
    try:
        project_data = project.model_dump(exclude={"status"})
        
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
        
        db_project = models.Project(
            name=project_data["name"],
            component_type=project_data["component_type"],
            description=project_data.get("description"),
            created_by=user.id
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
            },
        )
        db.commit()
        db.refresh(db_project)
        return db_project
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")


@router.get("", response_model=List[schemas.Project])
def list_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all trade study projects"""
    projects = db.query(models.Project).offset(skip).limit(limit).all()
    return projects


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
    """Delete a project"""
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    project_summary = {
        "name": db_project.name,
        "component_type": db_project.component_type,
    }
    db.delete(db_project)
    log_project_change(
        db,
        project_id=project_id,
        change_type="project_deleted",
        description=f"Deleted project '{project_summary['name']}'",
        entity_type="project",
        entity_id=project_id,
        old_value=project_summary,
    )
    db.commit()
    return None
