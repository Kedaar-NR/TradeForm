"""AI-powered endpoints for optimization, discovery, scoring, chat, and PDF proxy."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID
import io
import asyncio
import textwrap
import re
from typing import Tuple, Optional, List, Dict
from datetime import datetime

try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.colors import HexColor
    from reportlab.lib.enums import TA_LEFT
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        HRFlowable,
        ListFlowable,
        ListItem,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
    )
    REPORTLAB_AVAILABLE = True
except ImportError:
    canvas = None  # type: ignore
    letter = None  # type: ignore
    HexColor = None  # type: ignore
    TA_LEFT = None  # type: ignore
    ParagraphStyle = None  # type: ignore
    getSampleStyleSheet = None  # type: ignore
    inch = None  # type: ignore
    HRFlowable = None  # type: ignore
    ListFlowable = None  # type: ignore
    ListItem = None  # type: ignore
    Paragraph = None  # type: ignore
    SimpleDocTemplate = None  # type: ignore
    Spacer = None  # type: ignore
    REPORTLAB_AVAILABLE = False

from app import models, schemas
from app.database import get_db
from app.services.ai_service import get_ai_service
from app.services.scoring_service import get_scoring_service
from app.services.change_logger import log_project_change
from app.utils.file_helpers import is_pdf_content

router = APIRouter(tags=["ai"])


@router.post("/api/projects/{project_id}/discover")
def discover_components(
    project_id: UUID,
    request: schemas.DiscoverComponentsRequest = schemas.DiscoverComponentsRequest(),
    db: Session = Depends(get_db)
):
    """Trigger AI component discovery using Anthropic Claude"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    criteria = db.query(models.Criterion).filter(models.Criterion.project_id == project_id).all()
    criteria_names = [c.name for c in criteria] if criteria else None
    
    try:
        ai_service = get_ai_service()
        components_data = ai_service.discover_components(
            project_name=project.name,
            component_type=project.component_type,
            description=project.description,
            criteria_names=criteria_names,
            location_preference=request.location_preference,
            number_of_components=request.number_of_components
        )
        
        discovered_components = []
        for comp_data in components_data:
            if not isinstance(comp_data, dict) or "manufacturer" not in comp_data or "part_number" not in comp_data:
                continue
                
            existing = db.query(models.Component).filter(
                models.Component.project_id == project_id,
                models.Component.manufacturer == comp_data["manufacturer"],
                models.Component.part_number == comp_data["part_number"]
            ).first()
            
            if existing:
                continue
            
            db_component = models.Component(
                manufacturer=comp_data["manufacturer"],
                part_number=comp_data["part_number"],
                description=comp_data.get("description"),
                datasheet_url=comp_data.get("datasheet_url"),
                availability=models.ComponentAvailability(comp_data.get("availability", "in_stock")),
                project_id=project_id,
                source=models.ComponentSource.AI_DISCOVERED
            )
            db.add(db_component)
            db.flush()
            log_project_change(
                db,
                project_id=project_id,
                change_type="component_discovered",
                description=f"Discovered component {db_component.manufacturer} {db_component.part_number}",
                entity_type="component",
                entity_id=db_component.id,
                new_value={
                    "manufacturer": db_component.manufacturer,
                    "part_number": db_component.part_number,
                    "description": db_component.description or "",
                    "datasheet_url": db_component.datasheet_url or "",
                },
            )
            discovered_components.append(db_component)
        
        log_project_change(
            db,
            project_id=project_id,
            change_type="component_discovery_run",
            description=f"Ran AI discovery and found {len(discovered_components)} new component(s)",
            entity_type="system",
            new_value={"discovered_count": len(discovered_components)},
        )
        db.commit()
        
        for comp in discovered_components:
            db.refresh(comp)
        
        return {
            "status": "success",
            "discovered_count": len(discovered_components),
            "components": [schemas.Component.model_validate(c) for c in discovered_components]
        }
        
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _score_single_component_criterion(
    ai_service,
    component: models.Component,
    criterion: models.Criterion
) -> Tuple[Optional[dict], Optional[Exception]]:
    """Score a single component-criterion pair. Returns (score_data, error)."""
    try:
        score_data = await asyncio.to_thread(
            ai_service.score_component,
            component_manufacturer=component.manufacturer,
            component_part_number=component.part_number,
            component_description=component.description,
            component_datasheet_url=component.datasheet_url,
            criterion_name=criterion.name,
            criterion_description=criterion.description,
            criterion_unit=criterion.unit,
            criterion_higher_is_better=criterion.higher_is_better,
            criterion_min_req=criterion.minimum_requirement,
            criterion_max_req=criterion.maximum_requirement
        )
        return score_data, None
    except Exception as e:
        print(f"Error scoring component {component.id} for criterion {criterion.id}: {str(e)}")
        return None, e


@router.post("/api/projects/{project_id}/score")
async def score_all_components(project_id: UUID, db: Session = Depends(get_db)):
    """Trigger AI scoring for all components against all criteria"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    components = db.query(models.Component).filter(models.Component.project_id == project_id).all()
    criteria = db.query(models.Criterion).filter(models.Criterion.project_id == project_id).all()

    if not components:
        raise HTTPException(status_code=400, detail="No components found for this project")
    if not criteria:
        raise HTTPException(status_code=400, detail="No criteria found for this project")

    # Pre-fetch all existing scores to avoid N+1 queries
    component_ids = [c.id for c in components]
    criterion_ids = [c.id for c in criteria]
    existing_scores = {
        (s.component_id, s.criterion_id): s
        for s in db.query(models.Score).filter(
            models.Score.component_id.in_(component_ids),
            models.Score.criterion_id.in_(criterion_ids)
        ).all()
    }

    scores_created = 0
    scores_updated = 0
    errors = []

    try:
        ai_service = get_ai_service()
        
        # Create all scoring tasks with their corresponding component-criterion pairs
        scoring_pairs = []  # List of (component, criterion) pairs
        scoring_tasks = []
        
        for component in components:
            for criterion in criteria:
                scoring_pairs.append((component, criterion))
                task = _score_single_component_criterion(ai_service, component, criterion)
                scoring_tasks.append(task)
        
        # Execute all scoring tasks in parallel (with reasonable concurrency limit)
        # Anthropic API typically allows high concurrency, but we'll limit to 20 concurrent requests
        # to avoid rate limits and excessive resource usage
        semaphore = asyncio.Semaphore(20)
        
        async def bounded_score(task):
            async with semaphore:
                return await task
        
        bounded_tasks = [bounded_score(task) for task in scoring_tasks]
        results = await asyncio.gather(*bounded_tasks, return_exceptions=True)
        
        # Process results and update database
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                errors.append(str(result))
                continue
            
            # Result should be a tuple (score_data, error) from _score_single_component_criterion
            if not isinstance(result, tuple) or len(result) != 2:
                errors.append(f"Unexpected result format at index {i}")
                continue
                
            score_data, error = result
            if error or not score_data:
                continue
            
            # Get the component and criterion for this result
            component, criterion = scoring_pairs[i]
            
            score_key = (component.id, criterion.id)
            existing_score = existing_scores.get(score_key)
            
            if existing_score:
                existing_score.score = score_data["score"]
                existing_score.rationale = score_data.get("rationale", "")
                existing_score.raw_value = score_data.get("raw_value")
                existing_score.extraction_confidence = score_data.get("confidence", 0.5)
                scores_updated += 1
            else:
                db_score = models.Score(
                    component_id=component.id,
                    criterion_id=criterion.id,
                    score=score_data["score"],
                    rationale=score_data.get("rationale", ""),
                    raw_value=score_data.get("raw_value"),
                    extraction_confidence=score_data.get("confidence", 0.5)
                )
                db.add(db_score)
                scores_created += 1

        db.commit()
        
        # Verify scores were saved by querying the database
        saved_scores_count = db.query(models.Score).join(models.Component).filter(
            models.Component.project_id == project_id
        ).count()

        response = {
            "status": "success",
            "scores_created": scores_created,
            "scores_updated": scores_updated,
            "total_scores": scores_created + scores_updated,
            "components_evaluated": len(components),
            "criteria_evaluated": len(criteria),
            "scores_in_database": saved_scores_count
        }
        
        if errors:
            response["errors_count"] = len(errors)
            response["warning"] = f"Some scores failed to generate ({len(errors)} errors)"
        
        return response

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"AI scoring failed: {str(e)}")


@router.post("/api/ai/optimize-project")
async def optimize_project_with_ai(request: dict):
    """Use AI to suggest component type and description for a project"""
    project_name = request.get("name", "")
    if not project_name:
        raise HTTPException(status_code=400, detail="Project name is required")

    try:
        ai_service = get_ai_service()
        result = ai_service.optimize_project(project_name)
        return result
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/ai/optimize-criteria/{project_id}")
async def optimize_criteria_with_ai(project_id: UUID, db: Session = Depends(get_db)):
    """Use AI to suggest evaluation criteria for a project"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        ai_service = get_ai_service()
        criteria_suggestions = ai_service.optimize_criteria(
            project_name=project.name,
            component_type=project.component_type,
            description=project.description
        )

        # Transform to match expected response format
        suggested_criteria = []
        for suggestion in criteria_suggestions:
            suggested_criteria.append({
                "name": suggestion.get("name", ""),
                "description": suggestion.get("description", ""),
                "weight": suggestion.get("weight", 5),
                "unit": suggestion.get("unit"),
                "higher_is_better": suggestion.get("higher_is_better", True)
            })

        return {
            "status": "success",
            "criteria": suggested_criteria
        }

    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/ai/chat")
async def ai_chat(request: dict):
    """AI chatbot for TradeForm-specific questions with system prompt protection"""
    question = request.get("question", "")
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    try:
        ai_service = get_ai_service()
        response_text = ai_service.chat(question)
        return {
            "response": response_text,
            "status": "success"
        }
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/projects/{project_id}/generate-report")
async def generate_trade_study_report(project_id: UUID, db: Session = Depends(get_db)):
    """Generate a comprehensive trade study report using AI"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    components = db.query(models.Component).filter(models.Component.project_id == project_id).all()
    criteria = db.query(models.Criterion).filter(models.Criterion.project_id == project_id).all()

    if not components:
        raise HTTPException(status_code=400, detail="No components found for this project")
    if not criteria:
        raise HTTPException(status_code=400, detail="No criteria found for this project")

    # Get all scores
    all_scores = db.query(models.Score).join(models.Component).filter(
        models.Component.project_id == project_id
    ).all()

    if not all_scores:
        raise HTTPException(
            status_code=400, 
            detail="No scores found for this project. Please score components first."
        )

    # Create scores dict for easy lookup
    scores_dict = {(str(score.component_id), str(score.criterion_id)): score for score in all_scores}

    # Calculate weighted scores and rankings
    scoring_service = get_scoring_service()
    results = scoring_service.calculate_weighted_scores(components, criteria, scores_dict)

    try:
        # Prepare data for AI service
        ai_service = get_ai_service()
        
        # Format components with their scores
        components_data = []
        for result in results:
            component = result["component"]
            component_scores = []
            
            for criterion in criteria:
                key = (str(component.id), str(criterion.id))
                if key in scores_dict:
                    score = scores_dict[key]
                    component_scores.append({
                        "criterion_name": criterion.name,
                        "criterion_description": criterion.description,
                        "criterion_weight": criterion.weight,
                        "criterion_unit": criterion.unit,
                        "score": score.score,
                        "rationale": score.rationale,
                        "raw_value": score.raw_value
                    })
            
            components_data.append({
                "manufacturer": component.manufacturer,
                "part_number": component.part_number,
                "description": component.description,
                "rank": result["rank"],
                "total_score": result["total_score"],
                "scores": component_scores
            })

        # Format criteria summary
        criteria_summary = [
            {
                "name": c.name,
                "description": c.description,
                "weight": c.weight,
                "unit": c.unit,
                "higher_is_better": c.higher_is_better
            }
            for c in criteria
        ]

        # Generate report using AI
        report = await asyncio.to_thread(
            ai_service.generate_trade_study_report,
            project_name=project.name,
            project_description=project.description,
            component_type=project.component_type,
            criteria=criteria_summary,
            components=components_data
        )

        # Save report to database
        project.trade_study_report = report
        project.report_generated_at = datetime.utcnow()
        log_project_change(
            db,
            project_id=project_id,
            change_type="report_generated",
            description="Generated trade study report",
            entity_type="system",
            new_value={
                "generated_at": project.report_generated_at.isoformat()
                if project.report_generated_at
                else None
            },
        )
        db.commit()
        db.refresh(project)

        return {
            "status": "success",
            "report": report,
            "generated_at": project.report_generated_at
        }

    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


def _prepare_report_lines(report_text: str) -> list[str]:
    """Normalize markdown-heavy text into clean paragraphs."""
    def clean_line(line: str) -> str:
        stripped = line.strip()
        if not stripped:
            return ""
        stripped = stripped.lstrip("#*- >")
        stripped = stripped.replace("**", "").replace("__", "")
        return " ".join(stripped.split())

    paragraphs: list[str] = []
    buffer: list[str] = []
    for raw_line in report_text.splitlines():
        cleaned = clean_line(raw_line)
        if not cleaned:
            if buffer:
                paragraphs.append(" ".join(buffer))
                buffer = []
            continue
        buffer.append(cleaned)

    if buffer:
        paragraphs.append(" ".join(buffer))

    header = [
        "Trade Study Report",
        f"Generated on {datetime.utcnow().strftime('%B %d, %Y')}",
    ]
    return header + [""] + (paragraphs or [""])


def _looks_like_heading(text: str) -> bool:
    """Heuristic to spot likely headings (short, title-case or ending with a colon)."""
    stripped = text.strip()
    if not stripped:
        return False

    if stripped.endswith(":") and len(stripped) <= 90:
        return True

    words = stripped.split()
    if len(words) <= 8:
        alpha_chars = [c for c in stripped if c.isalpha()]
        if alpha_chars and all(c.isupper() for c in alpha_chars) and len(stripped) <= 72:
            return True
        if stripped.istitle():
            return True

    return False


def _parse_report_blocks(report_text: str) -> List[Dict[str, object]]:
    """Convert raw AI text into structured blocks (headings, bullets, paragraphs)."""
    blocks: List[Dict[str, object]] = []
    bullet_buffer: List[str] = []
    paragraph_buffer: List[str] = []

    def clean_line(line: str) -> str:
        return (
            line.strip()
            .lstrip("#*- >")
            .replace("**", "")
            .replace("__", "")
        )

    def flush_paragraph():
        nonlocal paragraph_buffer
        if paragraph_buffer:
            blocks.append(
                {"type": "paragraph", "text": " ".join(paragraph_buffer)}
            )
            paragraph_buffer = []

    def flush_bullets():
        nonlocal bullet_buffer
        if bullet_buffer:
            blocks.append({"type": "bullets", "items": bullet_buffer})
            bullet_buffer = []

    for raw_line in report_text.splitlines():
        line = clean_line(raw_line)
        if not line:
            flush_paragraph()
            flush_bullets()
            continue

        if line.startswith(("-", "*", "•")) or re.match(r"^\d+[\.\)]\s", line):
            flush_paragraph()
            cleaned_bullet = re.sub(r"^\d+[\.\)]\s*", "", line).lstrip("-*• ").strip()
            bullet_buffer.append(cleaned_bullet)
            continue

        if _looks_like_heading(line):
            flush_paragraph()
            flush_bullets()
            words = line.split()
            level = 1 if len(words) <= 4 else 2
            blocks.append({"type": "heading", "text": line.rstrip(":").strip(), "level": level})
            continue

        paragraph_buffer.append(line)

    flush_paragraph()
    flush_bullets()
    return blocks


def _build_report_pdf(report_text: str) -> io.BytesIO:
    """Create a PDF document from the stored trade study report text."""
    if REPORTLAB_AVAILABLE:
        return _build_styled_report_pdf(report_text)

    prepared_lines = _prepare_report_lines(report_text)
    return _build_simple_pdf(prepared_lines)


def _build_styled_report_pdf(report_text: str) -> io.BytesIO:
    """High-quality PDF with headings, subheadings, and bullet formatting."""
    blocks = _parse_report_blocks(report_text)
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.9 * inch,
        rightMargin=0.9 * inch,
        topMargin=0.9 * inch,
        bottomMargin=0.9 * inch,
    )

    palette = {
        "ink": HexColor("#0f172a"),
        "muted": HexColor("#475569"),
        "accent": HexColor("#1f2937"),
        "rule": HexColor("#e5e7eb"),
    }

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="ReportTitle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=palette["ink"],
            alignment=TA_LEFT,
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ReportSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=13,
            textColor=palette["muted"],
            alignment=TA_LEFT,
            spaceAfter=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SectionHeading",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=16,
            textColor=palette["ink"],
            spaceBefore=10,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SubHeading",
            parent=styles["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=15,
            textColor=palette["ink"],
            spaceBefore=8,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Body",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=14.5,
            textColor=palette["muted"],
            spaceAfter=6,
        )
    )

    story: List[object] = [
        Paragraph("Trade Study Report", styles["ReportTitle"]),
        Paragraph(datetime.utcnow().strftime("Generated %B %d, %Y"), styles["ReportSubtitle"]),
        HRFlowable(width="100%", thickness=1, color=palette["rule"], spaceBefore=2, spaceAfter=14),
    ]

    if not blocks:
        story.append(Paragraph("No report content available.", styles["Body"]))
    else:
        for block in blocks:
            if block["type"] == "heading":
                level = block.get("level", 1)
                style_name = "SectionHeading" if level == 1 else "SubHeading"
                story.append(Paragraph(str(block["text"]), styles[style_name]))
            elif block["type"] == "paragraph":
                story.append(Paragraph(str(block["text"]), styles["Body"]))
            elif block["type"] == "bullets":
                items = [
                    ListItem(
                        Paragraph(str(item), styles["Body"]),
                        leftIndent=6,
                    )
                    for item in block.get("items", [])
                ]
                if items:
                    story.append(
                        ListFlowable(
                            items,
                            bulletType="bullet",
                            start="•",
                            bulletFontName="Helvetica-Bold",
                            bulletFontSize=10,
                            bulletColor=palette["accent"],
                            leftIndent=14,
                            spaceBefore=0,
                        )
                    )

    doc.build(story)
    buffer.seek(0)
    return buffer


def _escape_pdf_text(text: str) -> str:
    return (
        text.replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
    )


def _build_simple_pdf(lines: list[str]) -> io.BytesIO:
    """Lightweight PDF generator when reportlab isn't available."""
    buffer = io.BytesIO()
    buffer.write(b"%PDF-1.4\n")

    wrapped: list[str] = []
    for line in lines:
        wrapped_lines = textwrap.wrap(line, width=100)
        if not wrapped_lines:
            wrapped.append("")
        else:
            wrapped.extend(wrapped_lines)

    if not wrapped:
        wrapped = [""]

    text_commands = [
        "BT",
        "/F1 12 Tf",
        "14 TL",
        "72 720 Td",
    ]
    for idx, line in enumerate(wrapped):
        escaped_line = _escape_pdf_text(line)
        text_commands.append(f"({escaped_line}) Tj")
        if idx != len(wrapped) - 1:
            text_commands.append("T*")
    text_commands.append("ET")

    content_stream = "\n".join(text_commands).encode("latin-1", "ignore")

    offsets = [0]

    def write_obj(obj: bytes):
        offsets.append(buffer.tell())
        buffer.write(obj)

    write_obj(b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n")
    write_obj(b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n")
    write_obj(
        b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>endobj\n"
    )
    content_obj = (
        f"4 0 obj<< /Length {len(content_stream)} >>\nstream\n".encode("latin-1")
        + content_stream
        + b"\nendstream\nendobj\n"
    )
    write_obj(content_obj)
    write_obj(
        b"5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n"
    )

    startxref = buffer.tell()
    buffer.write(f"xref\n0 {len(offsets)}\n".encode("latin-1"))
    buffer.write(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        buffer.write(f"{off:010} 00000 n \n".encode("latin-1"))

    buffer.write(
        b"trailer<< /Size "
        + str(len(offsets)).encode("latin-1")
        + b" /Root 1 0 R >>\nstartxref\n"
        + str(startxref).encode("latin-1")
        + b"\n%%EOF"
    )
    buffer.seek(0)
    return buffer


@router.get("/api/projects/{project_id}/report", response_model=schemas.TradeStudyReportResponse)
def get_trade_study_report(project_id: UUID, db: Session = Depends(get_db)):
    """Fetch the most recent trade study report for a project."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.trade_study_report:
        raise HTTPException(
            status_code=404,
            detail="No trade study report found for this project"
        )

    return {
        "report": project.trade_study_report,
        "generated_at": project.report_generated_at
    }


@router.get("/api/projects/{project_id}/report/pdf")
def download_trade_study_report_pdf(project_id: UUID, db: Session = Depends(get_db)):
    """Download the stored trade study report as a PDF file."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.trade_study_report:
        raise HTTPException(
            status_code=404,
            detail="No trade study report found for this project"
        )

    pdf_buffer = _build_report_pdf(project.trade_study_report)
    safe_name = (project.name or "trade_study").lower().replace(" ", "_")
    safe_name = "".join(ch if ch.isalnum() or ch in ("_", "-") else "_" for ch in safe_name)
    filename = f"trade_study_report_{safe_name}.pdf"

    headers = {
        "Content-Disposition": f"attachment; filename={filename}"
    }
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)


@router.get("/api/proxy-pdf")
async def proxy_pdf(url: str):
    """Proxy endpoint to download PDFs that may have CORS restrictions"""
    import httpx
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, follow_redirects=True)
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to download PDF: {response.status_code}"
                )
            
            file_bytes = response.content
            content_type = response.headers.get("content-type", "").lower()
            if "pdf" not in content_type and not is_pdf_content(file_bytes):
                raise HTTPException(
                    status_code=400,
                    detail="The requested URL did not return a PDF file."
                )

            filename = url.split("/")[-1].split("?")[0].split("#")[0] or "download.pdf"
            if not filename.lower().endswith(".pdf"):
                filename += ".pdf"

            return StreamingResponse(
                io.BytesIO(file_bytes),
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"'
                }
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request timeout while downloading PDF")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to proxy PDF: {str(e)}")
