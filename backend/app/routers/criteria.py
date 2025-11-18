"""Criteria management endpoints including Excel import/export."""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app import models, schemas
from app.database import get_db
from app.services.excel_service import get_excel_service
from app.services.change_logger import log_project_change
from app.services.change_logger import log_project_change

router = APIRouter(tags=["criteria"])


def _criterion_snapshot(criterion: models.Criterion) -> dict:
    return {
        "name": criterion.name,
        "description": criterion.description or "",
        "weight": criterion.weight,
        "unit": criterion.unit or "",
        "higher_is_better": criterion.higher_is_better,
        "minimum_requirement": criterion.minimum_requirement,
        "maximum_requirement": criterion.maximum_requirement,
    }


@router.post("/api/projects/{project_id}/criteria", response_model=schemas.Criterion, status_code=status.HTTP_201_CREATED)
def add_criterion(project_id: UUID, criterion: schemas.CriterionBase, db: Session = Depends(get_db)):
    """Add evaluation criterion to project"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db_criterion = models.Criterion(**criterion.model_dump(), project_id=project_id)
    db.add(db_criterion)
    db.flush()
    log_project_change(
        db,
        project_id=project_id,
        change_type="criterion_added",
        description=f"Added criterion {db_criterion.name}",
        entity_type="criterion",
        entity_id=db_criterion.id,
        new_value=_criterion_snapshot(db_criterion),
    )
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

    old_data = _criterion_snapshot(db_criterion)
    for key, value in criterion_update.model_dump(exclude_unset=True).items():
        setattr(db_criterion, key, value)

    db.flush()
    log_project_change(
        db,
        project_id=db_criterion.project_id,
        change_type="criterion_updated",
        description=f"Updated criterion {db_criterion.name}",
        entity_type="criterion",
        entity_id=db_criterion.id,
        old_value=old_data,
        new_value=_criterion_snapshot(db_criterion),
    )

    db.commit()
    db.refresh(db_criterion)
    return db_criterion


@router.delete("/api/criteria/{criterion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_criterion(criterion_id: UUID, db: Session = Depends(get_db)):
    """Delete a criterion"""
    db_criterion = db.query(models.Criterion).filter(models.Criterion.id == criterion_id).first()
    if not db_criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")

    snapshot = _criterion_snapshot(db_criterion)
    db.delete(db_criterion)
    log_project_change(
        db,
        project_id=db_criterion.project_id,
        change_type="criterion_deleted",
        description=f"Deleted criterion {snapshot['name']}",
        entity_type="criterion",
        entity_id=criterion_id,
        old_value=snapshot,
    )
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
            db.flush()
            log_project_change(
                db,
                project_id=project_id,
                change_type="criterion_imported",
                description=f"Imported criterion {db_criterion.name}",
                entity_type="criterion",
                entity_id=db_criterion.id,
                new_value=_criterion_snapshot(db_criterion),
            )
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

    excel_service = get_excel_service()
    output = excel_service.export_criteria_excel(criteria, project.name)
    log_project_change(
        db,
        project_id=project_id,
        change_type="criteria_exported",
        description=f"Exported {len(criteria)} criteria to Excel",
        entity_type="criteria",
        new_value={"count": len(criteria)},
    )

    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': f'attachment; filename=criteria_{project.name.replace(" ", "_")}.xlsx'}
    )
