from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum

class ProjectStatus(str, Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class ComponentAvailability(str, Enum):
    IN_STOCK = "in_stock"
    LIMITED = "limited"
    OBSOLETE = "obsolete"

class ComponentSource(str, Enum):
    AI_DISCOVERED = "ai_discovered"
    MANUALLY_ADDED = "manually_added"

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: User

# Project Schemas
class ProjectBase(BaseModel):
    name: str
    component_type: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    component_type: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None

class Project(ProjectBase):
    id: UUID
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None

    class Config:
        from_attributes = True

# Criterion Schemas
class CriterionBase(BaseModel):
    name: str
    description: Optional[str] = None
    weight: float = Field(gt=0, le=10)
    unit: Optional[str] = None
    higher_is_better: bool = True
    minimum_requirement: Optional[float] = None
    maximum_requirement: Optional[float] = None

class CriterionCreate(CriterionBase):
    project_id: UUID

class Criterion(CriterionBase):
    id: UUID
    project_id: UUID

    class Config:
        from_attributes = True

# Component Schemas
class ComponentBase(BaseModel):
    manufacturer: str
    part_number: str
    description: Optional[str] = None
    datasheet_url: Optional[str] = None
    availability: ComponentAvailability = ComponentAvailability.IN_STOCK

class ComponentCreate(ComponentBase):
    project_id: UUID
    source: ComponentSource = ComponentSource.MANUALLY_ADDED

class ComponentUpdate(BaseModel):
    manufacturer: Optional[str] = None
    part_number: Optional[str] = None
    description: Optional[str] = None
    datasheet_url: Optional[str] = None
    availability: Optional[ComponentAvailability] = None

class Component(ComponentBase):
    id: UUID
    project_id: UUID
    datasheet_file_path: Optional[str] = None
    source: ComponentSource

    class Config:
        from_attributes = True

# Score Schemas
class ScoreBase(BaseModel):
    raw_value: Optional[float] = None
    score: int = Field(ge=1, le=10)
    rationale: Optional[str] = None
    extraction_confidence: Optional[float] = Field(default=None, ge=0, le=1)

class ScoreCreate(ScoreBase):
    component_id: UUID
    criterion_id: UUID

class ScoreUpdate(BaseModel):
    score: int = Field(ge=1, le=10)
    rationale: Optional[str] = None
    manually_adjusted: bool = True

class Score(ScoreBase):
    id: UUID
    component_id: UUID
    criterion_id: UUID
    manually_adjusted: bool
    adjusted_by: Optional[UUID] = None
    adjusted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Project with Details
class ProjectWithDetails(Project):
    criteria: List[Criterion] = []
    components: List[Component] = []

# Component with Scores
class ComponentWithScores(Component):
    scores: List[Score] = []
    total_score: Optional[float] = None
    rank: Optional[int] = None

# Version History Schemas
class ProjectVersionBase(BaseModel):
    description: Optional[str] = None

class ProjectVersionCreate(ProjectVersionBase):
    pass

class ProjectVersion(ProjectVersionBase):
    id: UUID
    project_id: UUID
    version_number: int
    snapshot_data: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Team Collaboration Schemas
class ProjectShareBase(BaseModel):
    shared_with_user_id: UUID
    permission: str = "view"  # view, edit, admin

class ProjectShareCreate(ProjectShareBase):
    pass

class ProjectShare(ProjectShareBase):
    id: UUID
    project_id: UUID
    shared_by_user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class ProjectCommentBase(BaseModel):
    content: str
    component_id: Optional[UUID] = None
    criterion_id: Optional[UUID] = None

class ProjectCommentCreate(ProjectCommentBase):
    pass

class ProjectComment(ProjectCommentBase):
    id: UUID
    project_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProjectChangeBase(BaseModel):
    change_type: str
    change_description: str
    entity_type: Optional[str] = None
    entity_id: Optional[UUID] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None

class ProjectChange(ProjectChangeBase):
    id: UUID
    project_id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# ============================================================================
# DATASHEET SCHEMAS
# ============================================================================

class DatasheetStatus(BaseModel):
    """Datasheet status for a component"""
    has_datasheet: bool
    parsed: bool
    num_pages: Optional[int] = None
    parsed_at: Optional[datetime] = None
    parse_status: Optional[str] = None
    parse_error: Optional[str] = None

class DatasheetQueryRequest(BaseModel):
    """Request for datasheet Q&A"""
    question: str
    criterion_id: Optional[UUID] = None

class DatasheetCitation(BaseModel):
    """Citation reference from datasheet"""
    page_number: int
    snippet: str

class DatasheetQueryAnswer(BaseModel):
    """Response from datasheet Q&A"""
    answer: str
    citations: List[DatasheetCitation]
    confidence: Optional[float] = None

class DatasheetSuggestionsResponse(BaseModel):
    """Suggested questions for datasheet"""
    suggestions: List[str]
