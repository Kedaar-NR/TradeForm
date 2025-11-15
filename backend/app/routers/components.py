"""Component management endpoints including Excel import/export and AI discovery."""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app import models, schemas
from app.database import get_db
from app.services.excel_service import get_excel_service

router = APIRouter(tags=["components"])


@router.post("/api/projects/{project_id}/components", response_model=schemas.Component, status_code=status.HTTP_201_CREATED)
def add_component(project_id: UUID, component: schemas.ComponentCreateInput, db: Session = Depends(get_db)):
    """Manually add a component to project"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db_component = models.Component(
        **component.model_dump(),
        project_id=project_id
    )
    db.add(db_component)
    db.commit()
    db.refresh(db_component)
    return db_component


@router.get("/api/projects/{project_id}/components", response_model=List[schemas.Component])
def list_components(project_id: UUID, db: Session = Depends(get_db)):
    """List all components for a project"""
    components = db.query(models.Component).filter(models.Component.project_id == project_id).all()
    return components


@router.put("/api/components/{component_id}", response_model=schemas.Component)
def update_component(component_id: UUID, component_update: schemas.ComponentUpdate, db: Session = Depends(get_db)):
    """Update a component"""
    db_component = db.query(models.Component).filter(models.Component.id == component_id).first()
    if not db_component:
        raise HTTPException(status_code=404, detail="Component not found")

    for key, value in component_update.model_dump(exclude_unset=True).items():
        setattr(db_component, key, value)

    db.commit()
    db.refresh(db_component)
    return db_component


@router.delete("/api/components/{component_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_component(component_id: UUID, db: Session = Depends(get_db)):
    """Delete a component"""
    db_component = db.query(models.Component).filter(models.Component.id == component_id).first()
    if not db_component:
        raise HTTPException(status_code=404, detail="Component not found")

    db.delete(db_component)
    db.commit()
    return None


@router.post("/api/projects/{project_id}/components/upload")
async def upload_components_excel(project_id: UUID, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload components from Excel file"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        contents = await file.read()
        excel_service = get_excel_service()
        components_list = excel_service.parse_components_excel(contents)

        created_components = []
        for component_data in components_list:
            db_component = models.Component(
                manufacturer=component_data['manufacturer'],
                part_number=component_data['part_number'],
                description=component_data.get('description'),
                datasheet_url=component_data.get('datasheet_url'),
                availability=models.ComponentAvailability(component_data['availability']),
                project_id=project_id,
                source=models.ComponentSource.MANUALLY_ADDED
            )
            db.add(db_component)
            created_components.append(db_component)

        db.commit()

        return {
            "status": "success",
            "count": len(created_components),
            "message": f"Successfully imported {len(created_components)} components"
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process Excel file: {str(e)}")


@router.get("/api/projects/{project_id}/components/export")
def export_components_excel(project_id: UUID, db: Session = Depends(get_db)):
    """Export components to Excel file"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    components = db.query(models.Component).filter(models.Component.project_id == project_id).all()

    if not components:
        raise HTTPException(status_code=404, detail="No components found for this project")

    excel_service = get_excel_service()
    output = excel_service.export_components_excel(components, project.name)

    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': f'attachment; filename=components_{project.name.replace(" ", "_")}.xlsx'}
    )

