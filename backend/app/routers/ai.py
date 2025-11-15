"""AI-powered endpoints for optimization, discovery, scoring, chat, and PDF proxy."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID
import io

from app import models, schemas
from app.database import get_db
from app.services.ai_service import get_ai_service

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

    scores_created = 0
    scores_updated = 0

    try:
        ai_service = get_ai_service()
        
        for component in components:
            for criterion in criteria:
                existing_score = db.query(models.Score).filter(
                    models.Score.component_id == component.id,
                    models.Score.criterion_id == criterion.id
                ).first()

                try:
                    score_data = ai_service.score_component(
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

                except Exception as e:
                    # Log but continue with other scorings
                    print(f"Error scoring component {component.id} for criterion {criterion.id}: {str(e)}")
                    continue

        db.commit()

        return {
            "status": "success",
            "scores_created": scores_created,
            "scores_updated": scores_updated,
            "total_scores": scores_created + scores_updated,
            "components_evaluated": len(components),
            "criteria_evaluated": len(criteria)
        }

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

