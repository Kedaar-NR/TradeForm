"""Results and export endpoints for trade study analysis."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

from app import models
from app.database import get_db
from app.services.excel_service import get_excel_service
from app.services.scoring_service import get_scoring_service
from app.services.change_logger import log_project_change

router = APIRouter(tags=["results"])


@router.get("/api/projects/{project_id}/results")
def get_project_results(project_id: UUID, db: Session = Depends(get_db)):
    """Get ranked results with weighted scores"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    components = db.query(models.Component).filter(models.Component.project_id == project_id).all()
    criteria = db.query(models.Criterion).filter(models.Criterion.project_id == project_id).all()
    
    # Get all scores
    all_scores = db.query(models.Score).join(models.Component).filter(
        models.Component.project_id == project_id
    ).all()
    
    # Create scores dict for easy lookup
    scores_dict = {(str(score.component_id), str(score.criterion_id)): score for score in all_scores}
    
    # Calculate results using scoring service
    scoring_service = get_scoring_service()
    results = scoring_service.calculate_weighted_scores(components, criteria, scores_dict)

    return {
        "project": project,
        "criteria": criteria,
        "results": results
    }


@router.get("/api/projects/{project_id}/export/full")
def export_full_trade_study(project_id: UUID, db: Session = Depends(get_db)):
    """Export complete trade study to multi-sheet Excel file"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    components = db.query(models.Component).filter(models.Component.project_id == project_id).all()
    criteria = db.query(models.Criterion).filter(models.Criterion.project_id == project_id).all()

    # Get all scores
    all_scores = db.query(models.Score).join(models.Component).filter(
        models.Component.project_id == project_id
    ).all()
    
    # Create scores dict
    scores_dict = {(str(score.component_id), str(score.criterion_id)): score for score in all_scores}
    
    # Calculate results using scoring service
    scoring_service = get_scoring_service()
    results = scoring_service.calculate_weighted_scores(components, criteria, scores_dict)

    # Convert results to format expected by Excel service
    formatted_results = []
    for result in results:
        formatted_results.append({
            "component": result["component"],
            "score_dict": result["score_dict"],
            "total_score": result["total_score"]
        })
    
    # Use Excel service to generate file
    excel_service = get_excel_service()
    output = excel_service.export_full_trade_study(project, components, criteria, formatted_results)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{project.name.replace(' ', '_')}_TradeStudy_{timestamp}.xlsx"

    log_project_change(
        db,
        project_id=project_id,
        change_type="trade_study_exported",
        description=f"Exported full trade study report with {len(components)} components and {len(criteria)} criteria",
        entity_type="system",
        new_value={
            "components": len(components),
            "criteria": len(criteria),
            "scores": len(results),
        },
    )

    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': f'attachment; filename={filename}'}
    )
