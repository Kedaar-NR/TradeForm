from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app import models, schemas
from app.database import engine, get_db

# Create all tables
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="TradeForm API",
    description="AI-Powered Trade Study Automation API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
def read_root():
    return {
        "message": "Welcome to TradeForm API",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# ============================================================================
# PROJECT ENDPOINTS
# ============================================================================

@app.post("/api/projects", response_model=schemas.Project, status_code=status.HTTP_201_CREATED)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    """Create a new trade study project"""
    db_project = models.Project(**project.dict())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@app.get("/api/projects", response_model=List[schemas.Project])
def list_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all trade study projects"""
    projects = db.query(models.Project).offset(skip).limit(limit).all()
    return projects

@app.get("/api/projects/{project_id}", response_model=schemas.ProjectWithDetails)
def get_project(project_id: UUID, db: Session = Depends(get_db)):
    """Get project details with criteria and components"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.put("/api/projects/{project_id}", response_model=schemas.Project)
def update_project(project_id: UUID, project_update: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    """Update project details"""
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    for key, value in project_update.dict(exclude_unset=True).items():
        setattr(db_project, key, value)

    db.commit()
    db.refresh(db_project)
    return db_project

@app.delete("/api/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: UUID, db: Session = Depends(get_db)):
    """Delete a project"""
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(db_project)
    db.commit()
    return None

# ============================================================================
# CRITERIA ENDPOINTS
# ============================================================================

@app.post("/api/projects/{project_id}/criteria", response_model=schemas.Criterion, status_code=status.HTTP_201_CREATED)
def add_criterion(project_id: UUID, criterion: schemas.CriterionBase, db: Session = Depends(get_db)):
    """Add evaluation criterion to project"""
    # Verify project exists
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db_criterion = models.Criterion(**criterion.dict(), project_id=project_id)
    db.add(db_criterion)
    db.commit()
    db.refresh(db_criterion)
    return db_criterion

@app.get("/api/projects/{project_id}/criteria", response_model=List[schemas.Criterion])
def list_criteria(project_id: UUID, db: Session = Depends(get_db)):
    """List all criteria for a project"""
    criteria = db.query(models.Criterion).filter(models.Criterion.project_id == project_id).all()
    return criteria

@app.put("/api/criteria/{criterion_id}", response_model=schemas.Criterion)
def update_criterion(criterion_id: UUID, criterion_update: schemas.CriterionBase, db: Session = Depends(get_db)):
    """Update a criterion"""
    db_criterion = db.query(models.Criterion).filter(models.Criterion.id == criterion_id).first()
    if not db_criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")

    for key, value in criterion_update.dict(exclude_unset=True).items():
        setattr(db_criterion, key, value)

    db.commit()
    db.refresh(db_criterion)
    return db_criterion

@app.delete("/api/criteria/{criterion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_criterion(criterion_id: UUID, db: Session = Depends(get_db)):
    """Delete a criterion"""
    db_criterion = db.query(models.Criterion).filter(models.Criterion.id == criterion_id).first()
    if not db_criterion:
        raise HTTPException(status_code=404, detail="Criterion not found")

    db.delete(db_criterion)
    db.commit()
    return None

# ============================================================================
# COMPONENT ENDPOINTS
# ============================================================================

@app.post("/api/projects/{project_id}/components", response_model=schemas.Component, status_code=status.HTTP_201_CREATED)
def add_component(project_id: UUID, component: schemas.ComponentBase, db: Session = Depends(get_db)):
    """Manually add a component to project"""
    # Verify project exists
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db_component = models.Component(
        **component.dict(),
        project_id=project_id,
        source=models.ComponentSource.MANUALLY_ADDED
    )
    db.add(db_component)
    db.commit()
    db.refresh(db_component)
    return db_component

@app.get("/api/projects/{project_id}/components", response_model=List[schemas.Component])
def list_components(project_id: UUID, db: Session = Depends(get_db)):
    """List all components for a project"""
    components = db.query(models.Component).filter(models.Component.project_id == project_id).all()
    return components

@app.delete("/api/components/{component_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_component(component_id: UUID, db: Session = Depends(get_db)):
    """Delete a component"""
    db_component = db.query(models.Component).filter(models.Component.id == component_id).first()
    if not db_component:
        raise HTTPException(status_code=404, detail="Component not found")

    db.delete(db_component)
    db.commit()
    return None

# ============================================================================
# SCORE ENDPOINTS
# ============================================================================

@app.post("/api/scores", response_model=schemas.Score, status_code=status.HTTP_201_CREATED)
def create_score(score: schemas.ScoreCreate, db: Session = Depends(get_db)):
    """Create or update a score for a component-criterion pair"""
    db_score = models.Score(**score.dict())
    db.add(db_score)
    db.commit()
    db.refresh(db_score)
    return db_score

@app.get("/api/projects/{project_id}/scores", response_model=List[schemas.Score])
def get_project_scores(project_id: UUID, db: Session = Depends(get_db)):
    """Get all scores for a project"""
    scores = db.query(models.Score).join(models.Component).filter(
        models.Component.project_id == project_id
    ).all()
    return scores

@app.put("/api/scores/{score_id}", response_model=schemas.Score)
def update_score(score_id: UUID, score_update: schemas.ScoreUpdate, db: Session = Depends(get_db)):
    """Update a score (manual override)"""
    db_score = db.query(models.Score).filter(models.Score.id == score_id).first()
    if not db_score:
        raise HTTPException(status_code=404, detail="Score not found")

    for key, value in score_update.dict(exclude_unset=True).items():
        setattr(db_score, key, value)

    db.commit()
    db.refresh(db_score)
    return db_score

# ============================================================================
# RESULTS ENDPOINTS
# ============================================================================

@app.get("/api/projects/{project_id}/results")
def get_project_results(project_id: UUID, db: Session = Depends(get_db)):
    """Get ranked results with weighted scores"""
    # Get project with all data
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get all components with scores
    components = db.query(models.Component).filter(models.Component.project_id == project_id).all()
    criteria = db.query(models.Criterion).filter(models.Criterion.project_id == project_id).all()

    # Calculate weighted scores
    results = []
    total_weight = sum(c.weight for c in criteria)

    for component in components:
        scores = db.query(models.Score).filter(models.Score.component_id == component.id).all()
        score_dict = {s.criterion_id: s for s in scores}

        # Calculate weighted total
        weighted_sum = 0
        for criterion in criteria:
            if criterion.id in score_dict:
                weighted_sum += score_dict[criterion.id].score * criterion.weight

        total_score = weighted_sum / total_weight if total_weight > 0 else 0

        results.append({
            "component": component,
            "scores": scores,
            "total_score": round(total_score, 2)
        })

    # Sort by total score (descending)
    results.sort(key=lambda x: x["total_score"], reverse=True)

    # Add rank
    for i, result in enumerate(results):
        result["rank"] = i + 1

    return {
        "project": project,
        "criteria": criteria,
        "results": results
    }

# ============================================================================
# AI ENDPOINTS (Placeholder for future implementation)
# ============================================================================

@app.post("/api/projects/{project_id}/discover")
def discover_components(project_id: UUID, db: Session = Depends(get_db)):
    """Trigger AI component discovery"""
    return {
        "message": "Component discovery feature coming soon",
        "status": "not_implemented"
    }

@app.post("/api/components/{component_id}/datasheet")
def upload_datasheet(component_id: UUID, db: Session = Depends(get_db)):
    """Upload and extract datasheet"""
    return {
        "message": "Datasheet extraction feature coming soon",
        "status": "not_implemented"
    }

@app.post("/api/projects/{project_id}/score")
def score_all_components(project_id: UUID, db: Session = Depends(get_db)):
    """Trigger AI scoring for all components"""
    return {
        "message": "AI scoring feature coming soon",
        "status": "not_implemented"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
