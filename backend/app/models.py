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

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    projects = relationship("Project", back_populates="creator")

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    component_type = Column(String, nullable=False)
    description = Column(Text)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    status = Column(Enum(ProjectStatus), default=ProjectStatus.DRAFT)

    # Relationships
    creator = relationship("User", back_populates="projects")
    criteria = relationship("Criterion", back_populates="project", cascade="all, delete-orphan")
    components = relationship("Component", back_populates="project", cascade="all, delete-orphan")

class Criterion(Base):
    __tablename__ = "criteria"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
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
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
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
