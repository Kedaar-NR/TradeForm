"""Supplier onboarding router"""
import secrets
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app import models, auth
from app.database import get_db
from app.models import Supplier, SupplierStep, SupplierOnboardingStep

router = APIRouter(prefix="/api/suppliers", tags=["suppliers"])


# Pydantic schemas
class SupplierStepBase(BaseModel):
    step_id: str
    title: str
    description: Optional[str] = None
    completed: bool = False
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class SupplierStepResponse(SupplierStepBase):
    id: UUID
    step_order: int

    class Config:
        from_attributes = True


class SupplierCreate(BaseModel):
    name: str
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    color: str = "#0ea5e9"
    notes: Optional[str] = None


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    color: Optional[str] = None
    notes: Optional[str] = None
    grade: Optional[str] = None


class SupplierResponse(BaseModel):
    id: UUID
    name: str
    contact_name: Optional[str]
    contact_email: Optional[str]
    color: str
    notes: Optional[str]
    grade: Optional[str]
    share_token: Optional[str]
    created_at: datetime
    updated_at: datetime
    steps: List[SupplierStepResponse]

    class Config:
        from_attributes = True


class StepToggleRequest(BaseModel):
    step_id: UUID
    completed: bool
    completed_at: Optional[datetime] = None
    started_at: Optional[datetime] = None


class ShareLinkResponse(BaseModel):
    share_token: str
    share_url: str


# Step templates
STEP_TEMPLATES = [
    {"step_id": SupplierOnboardingStep.NDA, "title": "NDA signed", "description": "Mutual NDA executed and archived.", "order": 0},
    {"step_id": SupplierOnboardingStep.SECURITY, "title": "Security & compliance", "description": "Security questionnaire, compliance docs, and ITAR/export checks.", "order": 1},
    {"step_id": SupplierOnboardingStep.QUALITY, "title": "Quality package", "description": "Process controls, change-management flow, and certifications shared.", "order": 2},
    {"step_id": SupplierOnboardingStep.SAMPLE, "title": "First article sample", "description": "Pilot/first-article sample built and reviewed by the team.", "order": 3},
    {"step_id": SupplierOnboardingStep.COMMERCIAL, "title": "Commercial terms", "description": "Quote, MOQ, payment terms, and SLA agreed.", "order": 4},
    {"step_id": SupplierOnboardingStep.PILOT, "title": "Pilot run & onboarding", "description": "Small batch pilot completed and team trained on handoff.", "order": 5},
    {"step_id": SupplierOnboardingStep.PRODUCTION, "title": "Production slot", "description": "Production scheduling, packaging, and logistics locked in.", "order": 6},
]


def create_default_steps(supplier_id: UUID, db: Session, created_at: datetime):
    """Create default onboarding steps for a supplier"""
    steps = []
    for template in STEP_TEMPLATES:
        step = SupplierStep(
            supplier_id=supplier_id,
            step_id=template["step_id"],
            step_order=template["order"],
            title=template["title"],
            description=template["description"],
            started_at=created_at if template["order"] == 0 else None,
        )
        db.add(step)
        steps.append(step)
    return steps


def _get_or_create_dev_user(db: Session) -> models.User:
    """Get or create a shared development user for testing.
    
    TODO: TEMPORARILY BYPASSED FOR DEVELOPMENT - Re-enable auth check when fixing auth
    
    WARNING: This creates a SHARED dev user. All unauthenticated requests use the same
    user account, meaning suppliers are NOT isolated between sessions. This is only
    acceptable for development/testing. Proper authentication will provide per-user
    data isolation.
    """
    dev_email = "dev@tradeform.local"
    
    # Try to get existing user first
    dev_user = db.query(models.User).filter(models.User.email == dev_email).first()
    if dev_user:
        return dev_user
    
    # Try to create new user, handle race condition
    try:
        dev_user = models.User(
            email=dev_email,
            name="Development User (Shared)",
            password_hash=""  # No password for dev user
        )
        db.add(dev_user)
        db.commit()
        db.refresh(dev_user)
        return dev_user
    except IntegrityError:
        # Another request created the user concurrently, fetch it
        db.rollback()
        dev_user = db.query(models.User).filter(models.User.email == dev_email).first()
        if not dev_user:
            raise HTTPException(
                status_code=500,
                detail="Failed to create or retrieve development user"
            )
        return dev_user


@router.post("", response_model=SupplierResponse)
def create_supplier(
    supplier_data: SupplierCreate,
    db: Session = Depends(get_db)
):
    """Create a new supplier with default onboarding steps"""
    # Get or create dev user (similar pattern to onboarding router)
    user = _get_or_create_dev_user(db)

    supplier = Supplier(
        user_id=user.id,
        name=supplier_data.name,
        contact_name=supplier_data.contact_name,
        contact_email=supplier_data.contact_email,
        color=supplier_data.color,
        notes=supplier_data.notes,
    )
    db.add(supplier)
    db.flush()

    # Create default steps
    create_default_steps(supplier.id, db, supplier.created_at)

    db.commit()
    db.refresh(supplier)
    return supplier


@router.get("", response_model=List[SupplierResponse])
def list_suppliers(
    db: Session = Depends(get_db)
):
    """List all suppliers for the current user"""
    # Get first user (similar pattern to other routers)
    user = db.query(models.User).first()
    if not user:
        return []

    suppliers = db.query(Supplier).filter(Supplier.user_id == user.id).order_by(Supplier.created_at.desc()).all()
    return suppliers


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific supplier by ID"""
    # Get first user (similar pattern to other routers)
    user = db.query(models.User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user found")

    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.user_id == user.id
    ).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    return supplier


@router.patch("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: UUID,
    supplier_data: SupplierUpdate,
    db: Session = Depends(get_db)
):
    """Update a supplier"""
    # Get first user (similar pattern to other routers)
    user = db.query(models.User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user found")

    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.user_id == user.id
    ).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    for field, value in supplier_data.dict(exclude_unset=True).items():
        setattr(supplier, field, value)

    db.commit()
    db.refresh(supplier)
    return supplier


@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a supplier"""
    # Get first user (similar pattern to other routers)
    user = db.query(models.User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user found")

    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.user_id == user.id
    ).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    db.delete(supplier)
    db.commit()
    return {"success": True}


@router.patch("/{supplier_id}/steps/{step_id}")
def toggle_step(
    supplier_id: UUID,
    step_id: UUID,
    toggle_data: StepToggleRequest,
    db: Session = Depends(get_db)
):
    """Toggle a step's completion status"""
    # Get first user (similar pattern to other routers)
    user = db.query(models.User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user found")

    # Verify supplier ownership
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.user_id == user.id
    ).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    step = db.query(SupplierStep).filter(
        SupplierStep.id == step_id,
        SupplierStep.supplier_id == supplier_id
    ).first()

    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    step.completed = toggle_data.completed
    step.completed_at = toggle_data.completed_at
    if toggle_data.started_at:
        step.started_at = toggle_data.started_at

    db.commit()
    db.refresh(step)
    return step


@router.post("/{supplier_id}/share", response_model=ShareLinkResponse)
def generate_share_link(
    supplier_id: UUID,
    db: Session = Depends(get_db)
):
    """Generate a shareable link for a supplier"""
    # Get first user (similar pattern to other routers)
    user = db.query(models.User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user found")

    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.user_id == user.id
    ).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    # Generate token if doesn't exist
    if not supplier.share_token:
        supplier.share_token = secrets.token_urlsafe(32)
        db.commit()
        db.refresh(supplier)

    # Return the token and URL (frontend will construct full URL)
    return ShareLinkResponse(
        share_token=supplier.share_token,
        share_url=f"/suppliers/shared/{supplier.share_token}"
    )


@router.get("/shared/{share_token}", response_model=SupplierResponse)
def get_shared_supplier(
    share_token: str,
    db: Session = Depends(get_db)
):
    """Get a supplier by share token (public access)"""
    supplier = db.query(Supplier).filter(Supplier.share_token == share_token).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    return supplier
