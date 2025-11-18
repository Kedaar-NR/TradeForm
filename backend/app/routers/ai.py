"""AI-powered endpoints for optimization, discovery, scoring, chat, and PDF proxy."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID
import io
import asyncio
from typing import Tuple, Optional
from datetime import datetime

from app import models, schemas
from app.database import get_db
from app.services.ai_service import get_ai_service
from app.services.scoring_service import get_scoring_service

router = APIRouter(tags=["ai"])


@router.post("/api/projects/{project_id}/discover")
def discover_components(project_id: UUID, db: Session = Depends(get_db)):
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
            criteria_names=criteria_names
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
            discovered_components.append(db_component)
        
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
        db.commit()
        db.refresh(project)

        return {
            "status": "success",
            "report": report
        }

    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


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
            
            content_type = response.headers.get("content-type", "").lower()
            if "pdf" not in content_type and not url.lower().endswith(".pdf"):
                pass
            
            return StreamingResponse(
                io.BytesIO(response.content),
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="{url.split("/")[-1]}"'
                }
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request timeout while downloading PDF")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to proxy PDF: {str(e)}")

