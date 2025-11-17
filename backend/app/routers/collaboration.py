"""Team collaboration endpoints for versions, shares, comments, and changes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import json

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(tags=["collaboration"])


@router.post("/api/projects/{project_id}/versions", response_model=schemas.ProjectVersion, status_code=status.HTTP_201_CREATED)
def create_version(project_id: UUID, version: schemas.ProjectVersionCreate, db: Session = Depends(get_db)):
    """Create a new version snapshot of the project"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    existing_versions = db.query(models.ProjectVersion).filter(
        models.ProjectVersion.project_id == project_id
    ).count()
    
    components = db.query(models.Component).filter(models.Component.project_id == project_id).all()
    criteria = db.query(models.Criterion).filter(models.Criterion.project_id == project_id).all()
    
    snapshot = {
        "components": [{"id": str(c.id), "manufacturer": c.manufacturer, "part_number": c.part_number} for c in components],
        "criteria": [{"id": str(c.id), "name": c.name, "weight": c.weight} for c in criteria],
    }
    
    db_version = models.ProjectVersion(
        project_id=project_id,
        version_number=existing_versions + 1,
        snapshot_data=json.dumps(snapshot),
        description=version.description,
        created_by=None
    )
    db.add(db_version)
    db.commit()
    db.refresh(db_version)
    return db_version


@router.get("/api/projects/{project_id}/versions", response_model=List[schemas.ProjectVersion])
def list_versions(project_id: UUID, db: Session = Depends(get_db)):
    """List all versions for a project"""
    versions = db.query(models.ProjectVersion).filter(
        models.ProjectVersion.project_id == project_id
    ).order_by(models.ProjectVersion.version_number.desc()).all()
    return versions


@router.get("/api/projects/{project_id}/versions/{version_id}", response_model=schemas.ProjectVersion)
def get_version(project_id: UUID, version_id: UUID, db: Session = Depends(get_db)):
    """Get a specific version"""
    version = db.query(models.ProjectVersion).filter(
        models.ProjectVersion.id == version_id,
        models.ProjectVersion.project_id == project_id
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return version


@router.post("/api/projects/{project_id}/shares", response_model=schemas.ProjectShare, status_code=status.HTTP_201_CREATED)
def share_project(
    project_id: UUID,
    share: schemas.ProjectShareCreate,
    db: Session = Depends(get_db),
    # TODO: TEMPORARILY BYPASSED FOR DEVELOPMENT - Re-enable when fixing auth
    # current_user: models.User = Depends(auth.get_current_user_required)
):
    """Share a project with another user"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    existing = db.query(models.ProjectShare).filter(
        models.ProjectShare.project_id == project_id,
        models.ProjectShare.shared_with_user_id == share.shared_with_user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Project already shared with this user")
    
    db_share = models.ProjectShare(
        project_id=project_id,
        shared_with_user_id=share.shared_with_user_id,
        shared_by_user_id=None,  # TODO: TEMPORARILY None - use current_user.id when auth is fixed
        permission=share.permission
    )
    db.add(db_share)
    db.commit()
    db.refresh(db_share)
    return db_share


@router.get("/api/projects/{project_id}/shares", response_model=List[schemas.ProjectShare])
def list_shares(project_id: UUID, db: Session = Depends(get_db)):
    """List all shares for a project"""
    shares = db.query(models.ProjectShare).filter(
        models.ProjectShare.project_id == project_id
    ).all()
    return shares


@router.post("/api/projects/{project_id}/comments", response_model=schemas.ProjectComment, status_code=status.HTTP_201_CREATED)
def add_comment(
    project_id: UUID,
    comment: schemas.ProjectCommentCreate,
    db: Session = Depends(get_db),
    # TODO: TEMPORARILY BYPASSED FOR DEVELOPMENT - Re-enable when fixing auth
    # current_user: models.User = Depends(auth.get_current_user_required)
):
    """Add a comment to a project"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_comment = models.ProjectComment(
        project_id=project_id,
        user_id=None,  # TODO: TEMPORARILY None - use current_user.id when auth is fixed
        content=comment.content,
        component_id=comment.component_id,
        criterion_id=comment.criterion_id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment


@router.get("/api/projects/{project_id}/comments", response_model=List[schemas.ProjectComment])
def list_comments(project_id: UUID, db: Session = Depends(get_db)):
    """List all comments for a project"""
    comments = db.query(models.ProjectComment).filter(
        models.ProjectComment.project_id == project_id
    ).order_by(models.ProjectComment.created_at.desc()).all()
    return comments


@router.get("/api/projects/{project_id}/changes", response_model=List[schemas.ProjectChange])
def list_changes(project_id: UUID, db: Session = Depends(get_db)):
    """List all changes for a project"""
    changes = db.query(models.ProjectChange).filter(
        models.ProjectChange.project_id == project_id
    ).order_by(models.ProjectChange.created_at.desc()).limit(50).all()
    return changes

