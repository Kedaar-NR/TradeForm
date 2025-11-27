"""AI-powered endpoints for optimization, discovery, scoring, chat, and PDF proxy."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID
import io
import asyncio
from typing import Tuple, Optional, List
from datetime import datetime
import logging

from app import models, schemas
from app.database import get_db
from app.services.ai_service import get_ai_service
from app.services.scoring_service import get_scoring_service
from app.services.change_logger import log_project_change
from app.services.word_service import get_word_service
from app.services.report_builder import build_report_pdf
from app.utils.file_helpers import is_pdf_content

router = APIRouter(tags=["ai"])
logger = logging.getLogger(__name__)


@router.post("/api/projects/{project_id}/discover")
def discover_components(
    project_id: UUID,
    request: schemas.DiscoverComponentsRequest = schemas.DiscoverComponentsRequest(),
    db: Session = Depends(get_db)
):
    """Trigger AI component discovery using Anthropic Claude."""
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
                db, project_id=project_id, change_type="component_discovered",
                description=f"Discovered component {db_component.manufacturer} {db_component.part_number}",
                entity_type="component", entity_id=db_component.id,
                new_value={"manufacturer": db_component.manufacturer, "part_number": db_component.part_number,
                    "description": db_component.description or "", "datasheet_url": db_component.datasheet_url or ""},
            )
            discovered_components.append(db_component)
        
        log_project_change(
            db, project_id=project_id, change_type="component_discovery_run",
            description=f"Ran AI discovery and found {len(discovered_components)} new component(s)",
            entity_type="system", new_value={"discovered_count": len(discovered_components)},
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


async def _score_component_batch(
    ai_service,
    component: models.Component,
    criteria: List[models.Criterion],
    timeout_seconds: int = 60
) -> Tuple[models.Component, List[dict], Optional[Exception]]:
    """Score a component against ALL criteria in one AI call. Much faster."""
    try:
        component_dict = {
            "manufacturer": component.manufacturer,
            "part_number": component.part_number,
            "description": component.description or "",
        }
        criteria_dicts = [
            {
                "name": c.name,
                "description": c.description or "",
                "unit": c.unit or "",
                "higher_is_better": c.higher_is_better,
            }
            for c in criteria
        ]
        
        # Add timeout to prevent hanging
        scores = await asyncio.wait_for(
            asyncio.to_thread(
                ai_service.score_component_batch,
                component=component_dict,
                criteria=criteria_dicts
            ),
            timeout=timeout_seconds
        )
        logger.info(f"Scored component {component.manufacturer} {component.part_number}")
        return component, scores, None
    except asyncio.TimeoutError:
        logger.error(f"Timeout scoring component {component.id}")
        return component, [], Exception("Scoring timed out")
    except Exception as e:
        logger.error(f"Error batch scoring component {component.id}: {str(e)}")
        return component, [], e


@router.post("/api/projects/{project_id}/score")
async def score_all_components(project_id: UUID, db: Session = Depends(get_db)):
    """Trigger AI scoring for all components against all criteria.
    Uses batch scoring - one AI call per component (scores all criteria at once).
    """
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    components = db.query(models.Component).filter(models.Component.project_id == project_id).all()
    criteria = db.query(models.Criterion).filter(models.Criterion.project_id == project_id).all()
    
    if not components:
        raise HTTPException(status_code=400, detail="No components found for this project")
    if not criteria:
        raise HTTPException(status_code=400, detail="No criteria found for this project")
    
    # Build criterion name to ID mapping
    criterion_map = {c.name: c for c in criteria}
    
    # Pre-fetch existing scores
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
        
        # Create batch scoring tasks - one per component (scores ALL criteria at once)
        # Process in smaller batches to avoid API overload
        logger.info(f"Starting batch scoring for {len(components)} components with {len(criteria)} criteria")
        
        scoring_tasks = [
            _score_component_batch(ai_service, component, criteria)
            for component in components
        ]
        
        # Run with low concurrency to avoid API rate limits (2 at a time)
        semaphore = asyncio.Semaphore(2)
        
        async def bounded_score(task):
            async with semaphore:
                return await task
        
        bounded_tasks = [bounded_score(task) for task in scoring_tasks]
        results = await asyncio.gather(*bounded_tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, Exception):
                errors.append(str(result))
                continue
            
            component, scores_list, error = result
            if error:
                errors.append(str(error))
                continue
            
            # Process each score from the batch
            for score_data in scores_list:
                criterion_name = score_data.get("criterion_name", "")
                criterion = criterion_map.get(criterion_name)
                
                if not criterion:
                    # Try fuzzy match
                    for crit_name, crit in criterion_map.items():
                        if crit_name.lower() in criterion_name.lower() or criterion_name.lower() in crit_name.lower():
                            criterion = crit
                            break
                
                if not criterion:
                    continue
                
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
    """Use AI to suggest component type and description for a project."""
    project_name = request.get("name", "")
    if not project_name:
        raise HTTPException(status_code=400, detail="Project name is required")
    
    try:
        ai_service = get_ai_service()
        result = ai_service.optimize_project(project_name)
        return result
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/ai/optimize-criteria/{project_id}")
async def optimize_criteria_with_ai(project_id: UUID, db: Session = Depends(get_db)):
    """Use AI to suggest evaluation criteria for a project."""
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
        
        suggested_criteria = [
            {
                "name": s.get("name", ""),
                "description": s.get("description", ""),
                "weight": s.get("weight", 5),
                "unit": s.get("unit"),
                "higher_is_better": s.get("higher_is_better", True)
            }
            for s in criteria_suggestions
        ]
        
        return {"status": "success", "criteria": suggested_criteria}
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/ai/chat")
async def ai_chat(request: dict):
    """AI chatbot for TradeForm-specific questions."""
    question = request.get("question", "")
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    
    try:
        ai_service = get_ai_service()
        response_text = ai_service.chat(question)
        return {"response": response_text, "status": "success"}
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/projects/{project_id}/generate-report")
async def generate_trade_study_report(project_id: UUID, db: Session = Depends(get_db)):
    """Generate a comprehensive trade study report using AI."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    components = db.query(models.Component).filter(models.Component.project_id == project_id).all()
    criteria = db.query(models.Criterion).filter(models.Criterion.project_id == project_id).all()
    
    if not components:
        raise HTTPException(status_code=400, detail="No components found for this project")
    if not criteria:
        raise HTTPException(status_code=400, detail="No criteria found for this project")
    
    all_scores = db.query(models.Score).join(models.Component).filter(
        models.Component.project_id == project_id
    ).all()
    
    if not all_scores:
        raise HTTPException(status_code=400, detail="No scores found. Please score components first.")
    
    scores_dict = {(str(score.component_id), str(score.criterion_id)): score for score in all_scores}
    
    scoring_service = get_scoring_service()
    results = scoring_service.calculate_weighted_scores(components, criteria, scores_dict)
    
    try:
        ai_service = get_ai_service()
        
        components_data = _prepare_components_data(results, criteria, scores_dict)
        criteria_summary = _prepare_criteria_summary(criteria)
        
        report = await asyncio.to_thread(
            ai_service.generate_trade_study_report,
            project_name=project.name,
            project_description=project.description,
            component_type=project.component_type,
            criteria=criteria_summary,
            components=components_data
        )
        
        project.trade_study_report = report
        project.report_generated_at = datetime.utcnow()
        log_project_change(
            db, project_id=project_id, change_type="report_generated",
            description="Generated trade study report", entity_type="system",
            new_value={"generated_at": project.report_generated_at.isoformat() if project.report_generated_at else None},
        )
        db.commit()
        db.refresh(project)
        
        return {"status": "success", "report": report, "generated_at": project.report_generated_at}
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


def _prepare_components_data(results, criteria, scores_dict):
    """Prepare component data for report generation."""
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
    return components_data


def _prepare_criteria_summary(criteria):
    """Prepare criteria summary for report generation."""
    return [
        {
            "name": c.name,
            "description": c.description,
            "weight": c.weight,
            "unit": c.unit,
            "higher_is_better": c.higher_is_better
        }
        for c in criteria
    ]


@router.get("/api/projects/{project_id}/report", response_model=schemas.TradeStudyReportResponse)
def get_trade_study_report(project_id: UUID, db: Session = Depends(get_db)):
    """Fetch the most recent trade study report for a project."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not project.trade_study_report:
        raise HTTPException(status_code=404, detail="No trade study report found for this project")
    
    return {"report": project.trade_study_report, "generated_at": project.report_generated_at}


@router.get("/api/projects/{project_id}/report/pdf")
def download_trade_study_report_pdf(project_id: UUID, db: Session = Depends(get_db)):
    """Download the stored trade study report as a professional PDF file."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not project.trade_study_report:
        raise HTTPException(status_code=404, detail="No trade study report found for this project")
    
    # Fetch data for professional PDF
    components = db.query(models.Component).filter(models.Component.project_id == project_id).all()
    criteria = db.query(models.Criterion).filter(models.Criterion.project_id == project_id).all()
    all_scores = db.query(models.Score).join(models.Component).filter(
        models.Component.project_id == project_id
    ).all()
    
    logger.info(f"PDF Generation - Project {project_id}: components={len(components)}, criteria={len(criteria)}, scores={len(all_scores)}")
    
    from app.services.pdf_report_service import get_pdf_service, REPORTLAB_AVAILABLE
    
    pdf_buffer = _generate_pdf_buffer(project, components, criteria, all_scores)
    
    safe_name = _sanitize_filename(project.name or "trade_study")
    filename = f"trade_study_report_{safe_name}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


def _generate_pdf_buffer(project, components, criteria, all_scores):
    """Generate PDF buffer with professional or fallback PDF."""
    from app.services.pdf_report_service import get_pdf_service, REPORTLAB_AVAILABLE
    
    if not REPORTLAB_AVAILABLE:
        logger.warning("reportlab not available - generating text-only PDF")
        return build_report_pdf(project.trade_study_report)
    
    if not components or not criteria or not all_scores:
        logger.warning(f"Missing data for professional PDF")
        return build_report_pdf(project.trade_study_report)
    
    scores_dict = {(str(s.component_id), str(s.criterion_id)): s for s in all_scores}
    scoring_service = get_scoring_service()
    results = scoring_service.calculate_weighted_scores(components, criteria, scores_dict)
    
    components_data = _prepare_components_data(results, criteria, scores_dict)
    criteria_data = _prepare_criteria_summary(criteria)
    
    try:
        pdf_service = get_pdf_service()
        if pdf_service is None:
            raise ImportError("PDF service unavailable")
        return pdf_service.generate_report(
            project_name=project.name,
            project_description=project.description,
            component_type=project.component_type,
            criteria=criteria_data,
            components_data=components_data,
            report_text=project.trade_study_report,
        )
    except Exception as e:
        logger.error(f"Professional PDF generation failed: {str(e)}")
        return build_report_pdf(project.trade_study_report)


def _sanitize_filename(name: str) -> str:
    """Sanitize filename for safe file download."""
    safe_name = name.lower().replace(" ", "_")
    return "".join(ch if ch.isalnum() or ch in ("_", "-") else "_" for ch in safe_name)


@router.get("/api/projects/{project_id}/report/docx")
def download_trade_study_report_docx(project_id: UUID, db: Session = Depends(get_db)):
    """Download the stored trade study report as a Word (.docx) file."""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not project.trade_study_report:
        raise HTTPException(status_code=404, detail="No trade study report found for this project")
    
    word_service = get_word_service()
    docx_buffer = word_service.generate_report_docx(project.trade_study_report)
    
    safe_name = _sanitize_filename(project.name or "trade_study")
    filename = f"trade_study_report_{safe_name}.docx"
    
    return StreamingResponse(
        docx_buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/api/proxy-pdf")
async def proxy_pdf(url: str):
    """Proxy endpoint to download PDFs that may have CORS restrictions."""
    import httpx
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, follow_redirects=True)
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=f"Failed to download PDF: {response.status_code}")
            
            file_bytes = response.content
            content_type = response.headers.get("content-type", "").lower()
            if "pdf" not in content_type and not is_pdf_content(file_bytes):
                raise HTTPException(status_code=400, detail="The requested URL did not return a PDF file.")
            
            filename = url.split("/")[-1].split("?")[0].split("#")[0] or "download.pdf"
            if not filename.lower().endswith(".pdf"):
                filename += ".pdf"
            
            return StreamingResponse(
                io.BytesIO(file_bytes),
                media_type="application/pdf",
                headers={"Content-Disposition": f'attachment; filename="{filename}"'}
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request timeout while downloading PDF")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to proxy PDF: {str(e)}")
