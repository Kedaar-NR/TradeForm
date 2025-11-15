"""Score management endpoints for component-criterion scoring."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app import models, schemas
from app.database import get_db

router = APIRouter(tags=["scores"])


@router.post("/api/scores", response_model=schemas.Score, status_code=status.HTTP_201_CREATED)
def create_score(score: schemas.ScoreCreate, db: Session = Depends(get_db)):
    """Create or update a score for a component-criterion pair"""
    db_score = models.Score(**score.model_dump())
    db.add(db_score)
    db.commit()
    db.refresh(db_score)
    return db_score


@router.get("/api/projects/{project_id}/scores", response_model=List[schemas.Score])
def get_project_scores(project_id: UUID, db: Session = Depends(get_db)):
    """Get all scores for a project"""
    scores = db.query(models.Score).join(models.Component).filter(
        models.Component.project_id == project_id
    ).all()
    return scores


@router.put("/api/scores/{score_id}", response_model=schemas.Score)
def update_score(score_id: UUID, score_update: schemas.ScoreUpdate, db: Session = Depends(get_db)):
    """Update a score (manual override)"""
    db_score = db.query(models.Score).filter(models.Score.id == score_id).first()
    if not db_score:
        raise HTTPException(status_code=404, detail="Score not found")

    for key, value in score_update.model_dump(exclude_unset=True).items():
        setattr(db_score, key, value)

    db.commit()
    db.refresh(db_score)
    return db_score

