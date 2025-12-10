"""Supplier onboarding router"""
import mimetypes
import secrets
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
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
    material_name: Optional[str] = None
    material_description: Optional[str] = None
    material_mime_type: Optional[str] = None
    material_original_filename: Optional[str] = None
    material_size_bytes: Optional[int] = None
    material_updated_at: Optional[datetime] = None
    material_download_url: Optional[str] = None
    material_share_url: Optional[str] = None
    has_material: bool = False

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

SUPPLIER_MATERIALS_DIR = Path(__file__).resolve().parents[2] / "supplier_documents"
SUPPLIER_MATERIALS_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_MATERIAL_EXTENSIONS = {".pdf", ".doc", ".docx"}
MAX_MATERIAL_SIZE_BYTES = 20 * 1024 * 1024  # 20MB


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


def _attach_material_metadata(supplier: Supplier) -> Supplier:
    """Add convenience flags/URLs for step materials."""
    if not supplier:
        return supplier

    for step in supplier.steps:
        has_material = bool(step.material_file_path)
        step.has_material = has_material
        step.material_download_url = (
            f"/api/suppliers/{supplier.id}/steps/{step.id}/material"
            if has_material
            else None
        )
        step.material_share_url = (
            f"/api/suppliers/shared/{supplier.share_token}/steps/{step.id}/material"
            if has_material and supplier.share_token
            else None
        )
    return supplier


def _get_supplier_for_user(db: Session, supplier_id: UUID, user_id: UUID) -> Supplier:
    supplier = (
        db.query(Supplier)
        .filter(Supplier.id == supplier_id, Supplier.user_id == user_id)
        .first()
    )
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


def _get_step_for_supplier(db: Session, supplier_id: UUID, step_id: UUID) -> SupplierStep:
    step = (
        db.query(SupplierStep)
        .filter(SupplierStep.id == step_id, SupplierStep.supplier_id == supplier_id)
        .first()
    )
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    return step


def _build_material_response(step: SupplierStep) -> FileResponse:
    """Return a FileResponse for a step's uploaded material."""
    if not step.material_file_path:
        raise HTTPException(
            status_code=404, detail="No material uploaded for this step yet"
        )

    file_path = Path(step.material_file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Material file not found on server")

    filename = step.material_name or step.material_original_filename or file_path.name
    media_type = (
        step.material_mime_type
        or mimetypes.guess_type(filename)[0]
        or "application/octet-stream"
    )
    return FileResponse(file_path, media_type=media_type, filename=filename)


@router.post("", response_model=SupplierResponse)
def create_supplier(
    supplier_data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user_required)
):
    """Create a new supplier with default onboarding steps"""
    user = current_user

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
    return _attach_material_metadata(supplier)


@router.get("", response_model=List[SupplierResponse])
def list_suppliers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user_required)
):
    """List all suppliers for the current user"""
    user = current_user

    suppliers = db.query(Supplier).filter(Supplier.user_id == user.id).order_by(Supplier.created_at.desc()).all()
    return [_attach_material_metadata(s) for s in suppliers]


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user_required)
):
    """Get a specific supplier by ID"""
    user = current_user

    supplier = _get_supplier_for_user(db, supplier_id, user.id)
    return _attach_material_metadata(supplier)


@router.patch("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: UUID,
    supplier_data: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user_required)
):
    """Update a supplier"""
    user = current_user

    supplier = _get_supplier_for_user(db, supplier_id, user.id)

    for field, value in supplier_data.dict(exclude_unset=True).items():
        setattr(supplier, field, value)

    db.commit()
    db.refresh(supplier)
    return _attach_material_metadata(supplier)


@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user_required)
):
    """Delete a supplier"""
    user = current_user

    supplier = _get_supplier_for_user(db, supplier_id, user.id)

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
    # Get or create dev user (must match create_supplier)
    user = _get_or_create_dev_user(db)

    # Verify supplier ownership
    _get_supplier_for_user(db, supplier_id, user.id)

    step = _get_step_for_supplier(db, supplier_id, step_id)

    step.completed = toggle_data.completed
    step.completed_at = toggle_data.completed_at

    # Always update started_at if provided (even if it's being set for the first time)
    if toggle_data.started_at is not None:
        step.started_at = toggle_data.started_at

    db.commit()
    db.refresh(step)
    return step


@router.post("/{supplier_id}/steps/{step_id}/material", response_model=SupplierStepResponse)
async def upload_step_material(
    supplier_id: UUID,
    step_id: UUID,
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user_required)
):
    """Upload or replace a task material (e.g., PDF) for a supplier step."""
    user = current_user
    supplier = _get_supplier_for_user(db, supplier_id, user.id)
    step = _get_step_for_supplier(db, supplier_id, step_id)

    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    contents = await file.read()
    if len(contents) > MAX_MATERIAL_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size is {MAX_MATERIAL_SIZE_BYTES // (1024 * 1024)}MB",
        )

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_MATERIAL_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(sorted(ALLOWED_MATERIAL_EXTENSIONS))}",
        )

    # Persist file to disk under supplier folder to keep shared links stable
    material_dir = SUPPLIER_MATERIALS_DIR / str(user.id) / str(supplier_id)
    material_dir.mkdir(parents=True, exist_ok=True)
    material_path = material_dir / f"{step_id}{file_ext}"

    with open(material_path, "wb") as f:
        f.write(contents)

    mime_type = (
        mimetypes.guess_type(file.filename)[0]
        or "application/octet-stream"
    )

    # Update step metadata
    step.material_file_path = str(material_path)
    step.material_mime_type = mime_type
    step.material_original_filename = file.filename
    if name:
        step.material_name = name
    elif not step.material_name:
        step.material_name = file.filename

    if description is not None:
        step.material_description = description

    step.material_size_bytes = len(contents)
    step.material_updated_at = datetime.utcnow()

    db.commit()
    db.refresh(step)
    step.has_material = True
    step.material_download_url = f"/api/suppliers/{supplier_id}/steps/{step_id}/material"
    step.material_share_url = (
        f"/api/suppliers/shared/{supplier.share_token}/steps/{step_id}/material"
        if supplier.share_token
        else None
    )
    return step


@router.get("/{supplier_id}/steps/{step_id}/material")
def download_step_material(
    supplier_id: UUID,
    step_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user_required)
):
    """Download a step's uploaded material (internal view)."""
    user = current_user
    _get_supplier_for_user(db, supplier_id, user.id)
    step = _get_step_for_supplier(db, supplier_id, step_id)
    return _build_material_response(step)


@router.post("/{supplier_id}/share", response_model=ShareLinkResponse)
def generate_share_link(
    supplier_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user_required)
):
    """Generate a shareable link for a supplier"""
    user = current_user

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

    return _attach_material_metadata(supplier)


@router.get("/shared/{share_token}/steps/{step_id}/material")
def download_shared_step_material(
    share_token: str,
    step_id: UUID,
    db: Session = Depends(get_db),
):
    """Public download endpoint for shared supplier materials."""
    supplier = db.query(Supplier).filter(Supplier.share_token == share_token).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    step = (
        db.query(SupplierStep)
        .filter(SupplierStep.id == step_id, SupplierStep.supplier_id == supplier.id)
        .first()
    )
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    return _build_material_response(step)
