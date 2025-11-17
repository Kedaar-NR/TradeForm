"""Datasheet management endpoints for PDF upload, parsing, and querying."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from uuid import UUID
from pathlib import Path
import shutil

from app import models, schemas
from app.database import get_db
from app.datasheets import parser
from app.ai import datasheet_client

router = APIRouter(tags=["datasheets"])


@router.post("/api/components/{component_id}/datasheet")
async def upload_datasheet(
    component_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and parse a datasheet PDF for a component"""
    component = db.query(models.Component).filter(models.Component.id == component_id).first()
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported. Please upload a PDF datasheet."
        )
    
    # Check file size (limit to 50MB)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    max_size = 50 * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {max_size // (1024*1024)}MB."
        )
    
    try:
        datasheets_dir = Path("datasheets")
        datasheets_dir.mkdir(exist_ok=True)
        
        file_path = datasheets_dir / f"{component_id}.pdf"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Check if datasheet document already exists
        existing_doc = db.query(models.DatasheetDocument).filter(
            models.DatasheetDocument.component_id == component_id
        ).first()
        
        if existing_doc:
            db.query(models.DatasheetPage).filter(
                models.DatasheetPage.datasheet_id == existing_doc.id
            ).delete()
            
            existing_doc.original_filename = file.filename
            existing_doc.file_path = str(file_path)
            existing_doc.parse_status = "pending"
            existing_doc.parse_error = None
            existing_doc.num_pages = None
            existing_doc.suggested_questions = None  # Clear cached suggestions on re-upload
            db.commit()
            datasheet_doc = existing_doc
        else:
            datasheet_doc = models.DatasheetDocument(
                component_id=component_id,
                original_filename=file.filename,
                file_path=str(file_path),
                parse_status="pending"
            )
            db.add(datasheet_doc)
            db.commit()
            db.refresh(datasheet_doc)
        
        try:
            parsed_pages = parser.parse_pdf_to_pages(str(file_path))
            
            for parsed_page in parsed_pages:
                db_page = models.DatasheetPage(
                    datasheet_id=datasheet_doc.id,
                    page_number=parsed_page.page_number,
                    raw_text=parsed_page.raw_text,
                    section_title=parsed_page.section_title
                )
                db.add(db_page)
            
            datasheet_doc.parse_status = "success"
            datasheet_doc.num_pages = len(parsed_pages)
            component.datasheet_file_path = str(file_path)
            
            db.commit()
            db.refresh(datasheet_doc)
            
            return {
                "status": "success",
                "message": "Datasheet uploaded and parsed successfully",
                "datasheet": {
                    "num_pages": datasheet_doc.num_pages,
                    "parsed_at": datasheet_doc.parsed_at,
                    "parse_status": datasheet_doc.parse_status
                }
            }
            
        except Exception as parse_error:
            datasheet_doc.parse_status = "failed"
            datasheet_doc.parse_error = str(parse_error)
            db.commit()
            
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse PDF: {str(parse_error)}"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload datasheet: {str(e)}"
        )


@router.get("/api/components/{component_id}/datasheet/status", response_model=schemas.DatasheetStatus)
def get_datasheet_status(component_id: UUID, db: Session = Depends(get_db)):
    """Get datasheet status for a component"""
    component = db.query(models.Component).filter(models.Component.id == component_id).first()
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    
    datasheet_doc = db.query(models.DatasheetDocument).filter(
        models.DatasheetDocument.component_id == component_id
    ).first()
    
    if not datasheet_doc:
        return schemas.DatasheetStatus(
            has_datasheet=False,
            parsed=False
        )
    
    return schemas.DatasheetStatus(
        has_datasheet=True,
        parsed=(str(datasheet_doc.parse_status) == "success"),
        num_pages=int(datasheet_doc.num_pages) if datasheet_doc.num_pages else None,
        parsed_at=datasheet_doc.parsed_at,
        parse_status=str(datasheet_doc.parse_status),
        parse_error=str(datasheet_doc.parse_error) if datasheet_doc.parse_error else None,
        original_filename=str(datasheet_doc.original_filename) if datasheet_doc.original_filename else None
    )


@router.post("/api/components/{component_id}/datasheet/query", response_model=schemas.DatasheetQueryAnswer)
async def query_datasheet(
    component_id: UUID,
    request: schemas.DatasheetQueryRequest,
    db: Session = Depends(get_db)
):
    """Ask a question about a component's datasheet using AI"""
    component = db.query(models.Component).filter(models.Component.id == component_id).first()
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    
    datasheet_doc = db.query(models.DatasheetDocument).filter(
        models.DatasheetDocument.component_id == component_id
    ).first()
    
    if not datasheet_doc:
        raise HTTPException(
            status_code=400,
            detail="No datasheet uploaded for this component. Please upload a datasheet first."
        )
    
    if str(datasheet_doc.parse_status) != "success":
        raise HTTPException(
            status_code=400,
            detail=f"Datasheet parsing failed or incomplete. Status: {datasheet_doc.parse_status}"
        )
    
    pages = db.query(models.DatasheetPage).filter(
        models.DatasheetPage.datasheet_id == datasheet_doc.id
    ).order_by(models.DatasheetPage.page_number).all()
    
    if not pages:
        raise HTTPException(status_code=400, detail="No datasheet content available")
    
    project = db.query(models.Project).filter(models.Project.id == component.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    criteria = db.query(models.Criterion).filter(
        models.Criterion.project_id == component.project_id
    ).all()
    
    primary_criterion = None
    if request.criterion_id:
        primary_criterion = db.query(models.Criterion).filter(
            models.Criterion.id == request.criterion_id
        ).first()
    
    relevant_chunks = parser.retrieve_relevant_chunks(request.question, pages, max_chunks=8)
    
    context = {
        "project": {
            "name": project.name if project.name is not None else "",
            "component_type": project.component_type if project.component_type is not None else "",
            "description": project.description if project.description is not None else ""
        },
        "component": {
            "manufacturer": component.manufacturer,
            "part_number": component.part_number,
            "description": component.description
        },
        "criteria": [
            {
                "name": c.name,
                "description": c.description,
                "unit": c.unit,
                "higher_is_better": c.higher_is_better,
                "weight": c.weight
            }
            for c in criteria
        ],
        "datasheet_chunks": relevant_chunks,
        "primary_criterion": {
            "name": primary_criterion.name,
            "description": primary_criterion.description,
            "unit": primary_criterion.unit,
            "higher_is_better": primary_criterion.higher_is_better
        } if primary_criterion else None
    }
    
    try:
        ai_response = datasheet_client.ask_datasheet_ai(
            context=context,
            question=request.question,
            mode="qa"
        )
        
        citations = [
            schemas.DatasheetCitation(
                page_number=cite["page_number"],
                snippet=cite["snippet"]
            )
            for cite in ai_response.get("citations", [])
        ]
        
        return schemas.DatasheetQueryAnswer(
            answer=ai_response.get("answer", ""),
            citations=citations,
            confidence=ai_response.get("confidence")
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process question: {str(e)}"
        )


@router.get("/api/components/{component_id}/datasheet/suggestions", response_model=schemas.DatasheetSuggestionsResponse)
def get_datasheet_suggestions(component_id: UUID, db: Session = Depends(get_db)):
    """Get AI-suggested questions for a component's datasheet"""
    component = db.query(models.Component).filter(models.Component.id == component_id).first()
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    
    # Check for cached suggestions in datasheet document
    datasheet_doc = db.query(models.DatasheetDocument).filter(
        models.DatasheetDocument.component_id == component_id
    ).first()
    
    if datasheet_doc and datasheet_doc.suggested_questions:
        # Return cached suggestions if available
        try:
            import json
            cached_suggestions = json.loads(datasheet_doc.suggested_questions)
            if cached_suggestions and isinstance(cached_suggestions, list):
                return schemas.DatasheetSuggestionsResponse(
                    suggestions=cached_suggestions
                )
        except (json.JSONDecodeError, TypeError):
            # If parsing fails, regenerate suggestions
            pass
    
    project = db.query(models.Project).filter(models.Project.id == component.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    criteria = db.query(models.Criterion).filter(
        models.Criterion.project_id == component.project_id
    ).all()
    
    context = {
        "project": {
            "name": project.name if project.name is not None else "",
            "component_type": project.component_type if project.component_type is not None else "",
            "description": project.description if project.description is not None else ""
        },
        "component": {
            "manufacturer": component.manufacturer,
            "part_number": component.part_number,
            "description": component.description
        },
        "criteria": [
            {
                "name": c.name,
                "description": c.description,
                "unit": c.unit,
                "higher_is_better": c.higher_is_better,
                "weight": c.weight
            }
            for c in criteria
        ]
    }
    
    try:
        ai_response = datasheet_client.ask_datasheet_ai(
            context=context,
            question="",
            mode="suggestions"
        )
        
        suggestions = ai_response.get("suggestions", [])
        
        # Cache the suggestions in the database
        if datasheet_doc and suggestions:
            import json
            datasheet_doc.suggested_questions = json.dumps(suggestions)
            db.commit()
        
        return schemas.DatasheetSuggestionsResponse(
            suggestions=suggestions
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate suggestions: {str(e)}"
        )

