"""Criteria management endpoints including Excel import/export."""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app import models, schemas
from app.database import get_db
from app.services.excel_service import get_excel_service

router = APIRouter(tags=["criteria"])


@router.post("/api/projects/{project_id}/criteria", response_model=schemas.Criterion, status_code=status.HTTP_201_CREATED)
def add_criterion(project_id: UUID, criterion: schemas.CriterionBase, db: Session = Depends(get_db)):
    """Add evaluation criterion to project"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db_criterion = models.Criterion(**criterion.model_dump(), project_id=project_id)
    db.add(db_criterion)
    db.commit()
    db.refresh(db_criterion)
    return db_criterion


@router.get("/api/projects/{project_id}/criteria", response_model=List[schemas.Criterion])
def list_criteria(project_id: UUID, db: Session = Depends(get_db)):
    """List all criteria for a project"""
    criteria = db.query(models.Criterion).filter(models.Criterion.project_id == project_id).all()
    return criteria


@router.put("/api/criteria/{criterion_id}", response_model=schemas.Criterion)
def update_criterion(criterion_id: UUID, criterion_update: schemas.CriterionBase, db: Session = Depends(get_db)):
    """Update a criterion"""
    db_criterion = db.query(models.Criterion).filter(models.Criterion.id == criterion_id).first()
    if not db_criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")

    for key, value in criterion_update.model_dump(exclude_unset=True).items():
        setattr(db_criterion, key, value)

    db.commit()
    db.refresh(db_criterion)
    return db_criterion


@router.delete("/api/criteria/{criterion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_criterion(criterion_id: UUID, db: Session = Depends(get_db)):
    """Delete a criterion"""
    db_criterion = db.query(models.Criterion).filter(models.Criterion.id == criterion_id).first()
    if not db_criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")

    db.delete(db_criterion)
    db.commit()
    return None


@router.post("/api/projects/{project_id}/criteria/upload")
async def upload_criteria_excel(project_id: UUID, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload criteria from Excel file"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        contents = await file.read()
        excel_service = get_excel_service()
        criteria_list = excel_service.parse_criteria_excel(contents)

        created_criteria = []
        for criterion_data in criteria_list:
            db_criterion = models.Criterion(**criterion_data, project_id=project_id)
            db.add(db_criterion)
            created_criteria.append(db_criterion)

        db.commit()

        return {
            "status": "success",
            "count": len(created_criteria),
            "message": f"Successfully imported {len(created_criteria)} criteria"
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process Excel file: {str(e)}")


@router.get("/api/projects/{project_id}/criteria/export")
def export_criteria_excel(project_id: UUID, db: Session = Depends(get_db)):
    """Export criteria to Excel file"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    criteria = db.query(models.Criterion).filter(models.Criterion.project_id == project_id).all()

    if not criteria:
        raise HTTPException(status_code=404, detail="No criteria found for this project")

    excel_service = get_excel_service()
    output = excel_service.export_criteria_excel(criteria, project.name)

    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': f'attachment; filename=criteria_{project.name.replace(" ", "_")}.xlsx'}
    )

