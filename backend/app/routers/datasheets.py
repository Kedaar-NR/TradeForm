"""Datasheet management endpoints for PDF upload, parsing, and querying."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from uuid import UUID
from pathlib import Path
from typing import Optional, Tuple, List
from urllib.parse import urljoin
import shutil
import httpx
import re

from app import models, schemas
from app.database import get_db
from app.datasheets import parser
from app.ai import datasheet_client
from app.utils.file_helpers import is_pdf_content

router = APIRouter(tags=["datasheets"])


MAX_DATASHEET_SIZE = 50 * 1024 * 1024  # 50MB
DATASHEETS_DIR = Path("datasheets")
DATASHEETS_DIR.mkdir(exist_ok=True)
PDF_LINK_PATTERN = re.compile(r'href=["\']([^"\']+\.pdf(?:\?[^"\']*)?)["\']', re.IGNORECASE)


def _extract_pdf_link_from_html(html: str, base_url: str) -> Optional[str]:
    """Find the first PDF link in an HTML document and return an absolute URL."""
    match = PDF_LINK_PATTERN.search(html or "")
    if not match:
        return None
    pdf_href = match.group(1).strip()
    return urljoin(base_url, pdf_href)


async def _download_pdf_from_url(url: str) -> Tuple[bytes, str]:
    """
    Download PDF bytes from a URL. If the URL points to an HTML page, attempt to
    locate the first PDF link on the page and download that instead.
    Returns the file bytes and the resolved URL used for the PDF download.
    """
    common_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/pdf,application/octet-stream,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    # Faster timeout: 15 seconds for connection, 30 seconds total
    timeout = httpx.Timeout(15.0, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout, headers=common_headers, follow_redirects=True) as client:
        response = await client.get(url, follow_redirects=True)
        file_bytes = response.content
        content_type = response.headers.get("content-type", "").lower()
        resolved_url = str(response.url)

        if "pdf" in content_type or is_pdf_content(file_bytes):
            return file_bytes, resolved_url

        # Attempt to extract PDF link from HTML detail pages
        decoded_preview = file_bytes[:2000].decode("utf-8", errors="ignore")
        if "html" in content_type or "<html" in decoded_preview.lower():
            html_text = file_bytes.decode("utf-8", errors="ignore")
            pdf_link = _extract_pdf_link_from_html(html_text, resolved_url)
            if pdf_link:
                pdf_response = await client.get(pdf_link, follow_redirects=True)
                pdf_bytes = pdf_response.content
                pdf_content_type = pdf_response.headers.get("content-type", "").lower()
                if "pdf" in pdf_content_type or is_pdf_content(pdf_bytes):
                    return pdf_bytes, str(pdf_response.url)

    raise HTTPException(
        status_code=400,
        detail="The provided URL did not return a PDF file or a PDF link. Please supply a direct datasheet link."
    )


def _save_and_parse_datasheet(
    component: models.Component,
    file_bytes: bytes,
    filename: str,
    db: Session
):
    file_path = DATASHEETS_DIR / f"{component.id}.pdf"

    with open(file_path, "wb") as buffer:
        buffer.write(file_bytes)

    existing_doc = db.query(models.DatasheetDocument).filter(
        models.DatasheetDocument.component_id == component.id
    ).first()

    if existing_doc:
        db.query(models.DatasheetPage).filter(
            models.DatasheetPage.datasheet_id == existing_doc.id
        ).delete()

        existing_doc.original_filename = filename
        existing_doc.file_path = str(file_path)
        existing_doc.parse_status = "pending"
        existing_doc.parse_error = None
        existing_doc.num_pages = None
        existing_doc.suggested_questions = None
        db.commit()
        datasheet_doc = existing_doc
    else:
        datasheet_doc = models.DatasheetDocument(
            component_id=component.id,
            original_filename=filename,
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
    
    file_bytes = await file.read()
    if not is_pdf_content(file_bytes):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not recognized as a valid PDF. Please upload a PDF datasheet."
        )
    if len(file_bytes) > MAX_DATASHEET_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_DATASHEET_SIZE // (1024*1024)}MB."
        )
    
    try:
        return _save_and_parse_datasheet(component, file_bytes, file.filename, db)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload datasheet: {str(e)}"
        )


@router.post("/api/components/{component_id}/datasheet/from-url")
async def upload_datasheet_from_url(
    component_id: UUID,
    request: schemas.DatasheetFromUrlRequest,
    db: Session = Depends(get_db)
):
    """Download a datasheet from a URL and parse it."""
    component = db.query(models.Component).filter(models.Component.id == component_id).first()
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")

    if not request.url or not request.url.lower().startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Valid datasheet URL is required")

    try:
        file_bytes, resolved_url = await _download_pdf_from_url(request.url)

        if len(file_bytes) > MAX_DATASHEET_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size is {MAX_DATASHEET_SIZE // (1024*1024)}MB."
            )

        filename = resolved_url.split("/")[-1].split("?")[0].split("#")[0] or "datasheet.pdf"
        if not filename.lower().endswith(".pdf"):
            filename += ".pdf"

        return _save_and_parse_datasheet(component, file_bytes, filename, db)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download datasheet: {str(e)}"
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
    
    pages: List[models.DatasheetPage] = []
    if datasheet_doc:
        pages = db.query(models.DatasheetPage).filter(
            models.DatasheetPage.datasheet_id == datasheet_doc.id
        ).order_by(models.DatasheetPage.page_number.asc()).all()

    datasheet_chunks = []
    for page in pages[:8]:
        text = (page.raw_text or "").strip()
        if not text:
            continue
        datasheet_chunks.append({
            "page_number": page.page_number,
            "section_title": page.section_title,
            "text": text[:2000],
        })

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
        "datasheet_chunks": datasheet_chunks,
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
