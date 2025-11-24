from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.database import Base

class ProjectStatus(str, enum.Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class ComponentAvailability(str, enum.Enum):
    IN_STOCK = "in_stock"
    LIMITED = "limited"
    OBSOLETE = "obsolete"

class ComponentSource(str, enum.Enum):
    AI_DISCOVERED = "ai_discovered"
    MANUALLY_ADDED = "manually_added"

class OnboardingStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"

class UserDocumentType(str, enum.Enum):
    CRITERIA = "criteria"
    RATING_DOC = "rating_doc"
    REPORT_TEMPLATE = "report_template"

class ProcessingStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    projects = relationship("Project", back_populates="creator")
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    project_groups = relationship("ProjectGroup", back_populates="creator")

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    onboarding_status = Column(Enum(OnboardingStatus), default=OnboardingStatus.NOT_STARTED)
    onboarding_last_updated_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="profile")

class UserDocument(Base):
    __tablename__ = "user_documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type = Column(Enum(UserDocumentType), nullable=False)
    storage_url = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    onboarding_source = Column(Boolean, default=True)
    processing_status = Column(Enum(ProcessingStatus), default=ProcessingStatus.UPLOADED)
    processing_error = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User")
    content = relationship("UserDocumentContent", back_populates="document", uselist=False, cascade="all, delete-orphan")

class UserDocumentContent(Base):
    __tablename__ = "user_document_contents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_document_id = Column(UUID(as_uuid=True), ForeignKey("user_documents.id"), unique=True, nullable=False)
    raw_text = Column(Text)
    parsed_json = Column(Text)
    embedding_id = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    document = relationship("UserDocument", back_populates="content")

class ProjectGroup(Base):
    __tablename__ = "project_groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text)
    icon = Column(String, default="folder")  # Icon identifier (e.g., 'folder', 'chip', 'lightning', etc.)
    color = Column(String, default="#6B7280")  # Hex color code
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship("User", back_populates="project_groups")
    projects = relationship("Project", back_populates="project_group")

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    component_type = Column(String, nullable=False)
    description = Column(Text)
    project_group_id = Column(UUID(as_uuid=True), ForeignKey("project_groups.id"), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    status = Column(Enum(ProjectStatus), default=ProjectStatus.DRAFT)
    trade_study_report = Column(Text)  # AI-generated trade study report
    report_generated_at = Column(DateTime(timezone=True))  # Timestamp when report was generated

    # Relationships
    creator = relationship("User", back_populates="projects")
    project_group = relationship("ProjectGroup", back_populates="projects")
    criteria = relationship("Criterion", back_populates="project", cascade="all, delete-orphan")
    components = relationship("Component", back_populates="project", cascade="all, delete-orphan")
    changes = relationship("ProjectChange", back_populates="project", cascade="all, delete-orphan")
    versions = relationship("ProjectVersion", back_populates="project", cascade="all, delete-orphan")
    shares = relationship("ProjectShare", back_populates="project", cascade="all, delete-orphan")
    comments = relationship("ProjectComment", back_populates="project", cascade="all, delete-orphan")

class Criterion(Base):
    __tablename__ = "criteria"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    weight = Column(Float, nullable=False)
    unit = Column(String)
    higher_is_better = Column(Boolean, default=True)
    minimum_requirement = Column(Float)
    maximum_requirement = Column(Float)

    # Relationships
    project = relationship("Project", back_populates="criteria")
    scores = relationship("Score", back_populates="criterion", cascade="all, delete-orphan")

class Component(Base):
    __tablename__ = "components"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    manufacturer = Column(String, nullable=False)
    part_number = Column(String, nullable=False)
    description = Column(Text)
    datasheet_url = Column(String)
    datasheet_file_path = Column(String)
    availability = Column(Enum(ComponentAvailability), default=ComponentAvailability.IN_STOCK)
    source = Column(Enum(ComponentSource), default=ComponentSource.MANUALLY_ADDED)

    # Relationships
    project = relationship("Project", back_populates="components")
    scores = relationship("Score", back_populates="component", cascade="all, delete-orphan")
    datasheet_document = relationship("DatasheetDocument", back_populates="component", uselist=False, cascade="all, delete-orphan")

class Score(Base):
    __tablename__ = "scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    component_id = Column(UUID(as_uuid=True), ForeignKey("components.id"), nullable=False)
    criterion_id = Column(UUID(as_uuid=True), ForeignKey("criteria.id"), nullable=False)
    raw_value = Column(Float)
    score = Column(Integer, nullable=False)  # 1-10
    rationale = Column(Text)
    extraction_confidence = Column(Float)  # 0-1
    manually_adjusted = Column(Boolean, default=False)
    adjusted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    adjusted_at = Column(DateTime(timezone=True))

    # Relationships
    component = relationship("Component", back_populates="scores")
    criterion = relationship("Criterion", back_populates="scores")
    adjuster = relationship("User")

# Version History Models
class ProjectVersion(Base):
    __tablename__ = "project_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    snapshot_data = Column(Text)  # JSON snapshot of project state
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    description = Column(Text)

    # Relationships
    project = relationship("Project", back_populates="versions", passive_deletes=True)
    creator = relationship("User")

# Team Collaboration Models
class ProjectShare(Base):
    __tablename__ = "project_shares"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    shared_with_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    shared_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    permission = Column(String, default="view")  # view, edit, admin
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project = relationship("Project", back_populates="shares", passive_deletes=True)
    shared_with = relationship("User", foreign_keys=[shared_with_user_id])
    shared_by = relationship("User", foreign_keys=[shared_by_user_id])

class ProjectComment(Base):
    __tablename__ = "project_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    # Optional: reference to specific component or criterion
    component_id = Column(UUID(as_uuid=True), ForeignKey("components.id"), nullable=True)
    criterion_id = Column(UUID(as_uuid=True), ForeignKey("criteria.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="comments", passive_deletes=True)
    user = relationship("User")
    component = relationship("Component")
    criterion = relationship("Criterion")

class ProjectChange(Base):
    __tablename__ = "project_changes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    change_type = Column(String, nullable=False)  # criterion_added, component_added, weight_changed, etc.
    change_description = Column(Text, nullable=False)
    entity_type = Column(String)  # criterion, component, score
    entity_id = Column(UUID(as_uuid=True))
    old_value = Column(Text)
    new_value = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project = relationship("Project", back_populates="changes", passive_deletes=True)
    user = relationship("User")

# ============================================================================
# DATASHEET PARSING MODELS
# ============================================================================

class DatasheetDocument(Base):
    """Represents one processed datasheet per component"""
    __tablename__ = "datasheet_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    component_id = Column(UUID(as_uuid=True), ForeignKey("components.id"), nullable=False, unique=True)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    num_pages = Column(Integer)
    parsed_at = Column(DateTime(timezone=True), server_default=func.now())
    parse_status = Column(String, nullable=False, default="pending")  # pending, success, failed
    parse_error = Column(Text)
    suggested_questions = Column(Text)  # JSON array of cached AI-generated questions

    # Relationships
    component = relationship("Component", back_populates="datasheet_document")
    pages = relationship("DatasheetPage", back_populates="datasheet", cascade="all, delete-orphan")

class DatasheetPage(Base):
    """Represents extracted text per page"""
    __tablename__ = "datasheet_pages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    datasheet_id = Column(UUID(as_uuid=True), ForeignKey("datasheet_documents.id"), nullable=False)
    page_number = Column(Integer, nullable=False)
    raw_text = Column(Text)
    section_title = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    datasheet = relationship("DatasheetDocument", back_populates="pages")

class DatasheetParameter(Base):
    """Represents structured key-value pairs extracted from datasheets"""
    __tablename__ = "datasheet_parameters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    component_id = Column(UUID(as_uuid=True), ForeignKey("components.id"), nullable=False)
    name = Column(String, nullable=False)
    value = Column(String)
    numeric_value = Column(Float)
    unit = Column(String)
    page_number = Column(Integer)
    source_snippet = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    component = relationship("Component")
