"""Global search endpoint for querying across all entities."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from pydantic import BaseModel

from app import models
from app.database import get_db

router = APIRouter(prefix="/api/search", tags=["search"])


class SearchResult(BaseModel):
    id: str
    type: str  # "project_group", "project", "component", "criterion"
    title: str
    subtitle: Optional[str] = None
    path: str  # Navigation path
    project_id: Optional[str] = None
    project_name: Optional[str] = None


class SearchResponse(BaseModel):
    results: List[SearchResult]
    total: int


@router.get("", response_model=SearchResponse)
def global_search(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db)
):
    """Search across all projects, components, criteria, and project groups."""
    results = []
    search_term = f"%{q.lower()}%"
    
    # Search Project Groups
    groups = db.query(models.ProjectGroup).filter(
        or_(
            models.ProjectGroup.name.ilike(search_term),
            models.ProjectGroup.description.ilike(search_term)
        )
    ).limit(5).all()
    
    for g in groups:
        results.append(SearchResult(
            id=str(g.id),
            type="project_group",
            title=g.name,
            subtitle=g.description,
            path=f"/project-group/{g.id}"
        ))
    
    # Search Projects
    projects = db.query(models.Project).filter(
        or_(
            models.Project.name.ilike(search_term),
            models.Project.component_type.ilike(search_term),
            models.Project.description.ilike(search_term)
        )
    ).limit(10).all()
    
    for p in projects:
        results.append(SearchResult(
            id=str(p.id),
            type="project",
            title=p.name,
            subtitle=p.component_type,
            path=f"/project/{p.id}"
        ))
    
    # Search Components (with project info)
    components = db.query(models.Component).join(models.Project).filter(
        or_(
            models.Component.manufacturer.ilike(search_term),
            models.Component.part_number.ilike(search_term),
            models.Component.description.ilike(search_term)
        )
    ).limit(10).all()
    
    for c in components:
        results.append(SearchResult(
            id=str(c.id),
            type="component",
            title=f"{c.manufacturer} {c.part_number}",
            subtitle=c.description[:100] + "..." if c.description and len(c.description) > 100 else c.description,
            path=f"/project/{c.project_id}/discovery",
            project_id=str(c.project_id),
            project_name=c.project.name if c.project else None
        ))
    
    # Search Criteria
    criteria = db.query(models.Criterion).join(models.Project).filter(
        or_(
            models.Criterion.name.ilike(search_term),
            models.Criterion.description.ilike(search_term)
        )
    ).limit(5).all()
    
    for cr in criteria:
        results.append(SearchResult(
            id=str(cr.id),
            type="criterion",
            title=cr.name,
            subtitle=f"Weight: {cr.weight}%",
            path=f"/project/{cr.project_id}/criteria",
            project_id=str(cr.project_id),
            project_name=cr.project.name if cr.project else None
        ))
    
    return SearchResponse(results=results[:limit], total=len(results))

