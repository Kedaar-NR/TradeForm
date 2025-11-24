"""Onboarding endpoints for user document uploads and processing."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from uuid import UUID
from pathlib import Path
from typing import List, Optional, Dict, Any
import mimetypes
import logging

from app import models, schemas, auth
from app.database import get_db
from app.services.document_parser import DocumentParserService
from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])

# Configuration
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
USER_DOCUMENTS_DIR = Path("user_documents")
USER_DOCUMENTS_DIR.mkdir(exist_ok=True)

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv"
}

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv"}


def _get_dev_user(db: Session) -> models.User:
    """Get or create a shared development user for testing.
    
    TODO: TEMPORARILY BYPASSED FOR DEVELOPMENT - Re-enable auth check when fixing auth
    
    WARNING: This creates a SHARED dev user. All unauthenticated requests use the same
    user account, meaning documents are NOT isolated between sessions. This is only
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
        logger.info("Creating shared development user for onboarding (data NOT isolated between sessions)")
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
            # Extremely unlikely, but handle it
            raise HTTPException(
                status_code=500,
                detail="Failed to create or retrieve development user"
            )
        return dev_user


def _get_or_create_profile(db: Session, user_id: UUID) -> models.UserProfile:
    """Get or create user profile."""
    profile = db.query(models.UserProfile).filter(
        models.UserProfile.user_id == user_id
    ).first()
    
    if not profile:
        profile = models.UserProfile(
            user_id=user_id,
            onboarding_status=models.OnboardingStatus.NOT_STARTED
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    return profile


@router.get("/status", response_model=schemas.OnboardingStatusResponse, response_model_by_alias=True)
def get_onboarding_status(
    db: Session = Depends(get_db),
    # TODO: TEMPORARILY BYPASSED FOR DEVELOPMENT - Re-enable auth check when fixing auth
    # current_user: models.User = Depends(auth.get_current_user_required)
):
    """Get current onboarding status and document counts."""
    user = _get_dev_user(db)  # TODO: Replace with current_user when auth is fixed
    profile = _get_or_create_profile(db, user.id)
    
    # Count documents by type (exclude deleted)
    docs = db.query(models.UserDocument).filter(
        models.UserDocument.user_id == user.id,
        models.UserDocument.deleted_at.is_(None)
    ).all()
    
    criteria_count = sum(1 for d in docs if d.type == models.UserDocumentType.CRITERIA)
    rating_docs_count = sum(1 for d in docs if d.type == models.UserDocumentType.RATING_DOC)
    report_templates_count = sum(1 for d in docs if d.type == models.UserDocumentType.REPORT_TEMPLATE)
    
    return schemas.OnboardingStatusResponse(
        onboarding_status=profile.onboarding_status,
        criteria_count=criteria_count,
        rating_docs_count=rating_docs_count,
        report_templates_count=report_templates_count
    )


@router.post("/status", response_model=Dict[str, Any])
def update_onboarding_status(
    status_update: schemas.OnboardingStatusUpdate,
    db: Session = Depends(get_db),
    # TODO: TEMPORARILY BYPASSED FOR DEVELOPMENT - Re-enable auth check when fixing auth
    # current_user: models.User = Depends(auth.get_current_user_required)
):
    """Update onboarding status."""
    user = _get_dev_user(db)  # TODO: Replace with current_user when auth is fixed
    profile = _get_or_create_profile(db, user.id)
    
    profile.onboarding_status = status_update.status
    profile.onboarding_last_updated_at = func.now()
    
    db.commit()
    db.refresh(profile)
    
    return {
        "status": "success",
        "onboarding_status": profile.onboarding_status.value
    }


@router.post("/upload", response_model=schemas.UserDocumentResponse, response_model_by_alias=True)
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form(...),
    db: Session = Depends(get_db),
    # TODO: TEMPORARILY BYPASSED FOR DEVELOPMENT - Re-enable auth check when fixing auth
    # current_user: models.User = Depends(auth.get_current_user_required)
):
    """Upload and process an onboarding document."""
    user = _get_dev_user(db)  # TODO: Replace with current_user when auth is fixed
    
    # Validate doc_type
    try:
        document_type = models.UserDocumentType(doc_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid document type. Must be one of: criteria, rating_doc, report_template"
        )
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Determine MIME type
    mime_type = mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
    
    if mime_type not in ALLOWED_MIME_TYPES and file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="File type not supported"
        )
    
    try:
        # Create user document record
        user_doc = models.UserDocument(
            user_id=user.id,
            type=document_type,
            original_filename=file.filename,
            mime_type=mime_type,
            file_size=file_size,
            storage_url="",  # Will update after saving
            onboarding_source=True,
            processing_status=models.ProcessingStatus.UPLOADED
        )
        db.add(user_doc)
        db.commit()
        db.refresh(user_doc)
        
        # Save file to disk
        user_dir = USER_DOCUMENTS_DIR / str(user.id)
        user_dir.mkdir(exist_ok=True)
        
        file_path = user_dir / f"{user_doc.id}{file_ext}"
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Update storage URL
        user_doc.storage_url = str(file_path)
        db.commit()
        
        # Update profile to IN_PROGRESS if it was NOT_STARTED
        profile = _get_or_create_profile(db, user.id)
        if profile.onboarding_status == models.OnboardingStatus.NOT_STARTED:
            profile.onboarding_status = models.OnboardingStatus.IN_PROGRESS
            profile.onboarding_last_updated_at = func.now()
            db.commit()
        
        # Process document asynchronously
        try:
            user_doc.processing_status = models.ProcessingStatus.PROCESSING
            db.commit()
            
            # Parse document
            parser = DocumentParserService()
            parse_result = parser.parse_document(str(file_path), mime_type)
            
            if not parse_result["success"]:
                user_doc.processing_status = models.ProcessingStatus.FAILED
                user_doc.processing_error = parse_result["error"]
                db.commit()
                db.refresh(user_doc)
                return user_doc
            
            # Save parsed content
            doc_content = models.UserDocumentContent(
                user_document_id=user_doc.id,
                raw_text=parse_result["raw_text"],
                parsed_json=parse_result["parsed_json"]
            )
            db.add(doc_content)
            db.commit()
            
            # Generate embeddings
            try:
                embedding_service = EmbeddingService()
                embedding_service.add_document(
                    user_id=user.id,
                    doc_id=str(user_doc.id),
                    text=parse_result["raw_text"],
                    metadata={
                        "type": document_type.value,
                        "filename": file.filename,
                        "user_id": str(user.id)
                    }
                )
                
                doc_content.embedding_id = str(user_doc.id)
                db.commit()
                
                logger.info(f"Successfully generated embeddings for document {user_doc.id}")
            
            except Exception as e:
                logger.error(f"Failed to generate embeddings for document {user_doc.id}: {str(e)}")
                # Don't fail the entire upload if embeddings fail
            
            # Mark as ready
            user_doc.processing_status = models.ProcessingStatus.READY
            db.commit()
            db.refresh(user_doc)
            
            return user_doc
        
        except Exception as e:
            logger.error(f"Failed to process document {user_doc.id}: {str(e)}")
            user_doc.processing_status = models.ProcessingStatus.FAILED
            user_doc.processing_error = str(e)
            db.commit()
            db.refresh(user_doc)
            return user_doc
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload document: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload document: {str(e)}"
        )


@router.get("/documents", response_model=List[schemas.UserDocumentResponse], response_model_by_alias=True)
def list_documents(
    doc_type: Optional[str] = Query(None, description="Filter by document type"),
    db: Session = Depends(get_db),
    # TODO: TEMPORARILY BYPASSED FOR DEVELOPMENT - Re-enable auth check when fixing auth
    # current_user: models.User = Depends(auth.get_current_user_required)
):
    """List user's onboarding documents."""
    user = _get_dev_user(db)  # TODO: Replace with current_user when auth is fixed
    
    query = db.query(models.UserDocument).filter(
        models.UserDocument.user_id == user.id,
        models.UserDocument.deleted_at.is_(None)
    )
    
    if doc_type:
        try:
            document_type = models.UserDocumentType(doc_type)
            query = query.filter(models.UserDocument.type == document_type)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid document type: {doc_type}"
            )
    
    docs = query.order_by(models.UserDocument.created_at.desc()).all()
    
    return docs


@router.delete("/documents/{doc_id}")
def delete_document(
    doc_id: UUID,
    db: Session = Depends(get_db),
    # TODO: TEMPORARILY BYPASSED FOR DEVELOPMENT - Re-enable auth check when fixing auth
    # current_user: models.User = Depends(auth.get_current_user_required)
):
    """Delete an onboarding document."""
    user = _get_dev_user(db)  # TODO: Replace with current_user when auth is fixed
    
    # Find document
    doc = db.query(models.UserDocument).filter(
        models.UserDocument.id == doc_id,
        models.UserDocument.user_id == user.id
    ).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Soft delete
        doc.deleted_at = func.now()
        db.commit()
        
        # Delete embeddings
        try:
            embedding_service = EmbeddingService()
            embedding_service.delete_document(user.id, str(doc_id))
            logger.info(f"Deleted embeddings for document {doc_id}")
        except Exception as e:
            logger.error(f"Failed to delete embeddings for document {doc_id}: {str(e)}")
        
        # Optionally delete physical file
        try:
            file_path = Path(doc.storage_url)
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Deleted file {file_path}")
        except Exception as e:
            logger.warning(f"Failed to delete file for document {doc_id}: {str(e)}")
        
        return {"status": "success", "message": "Document deleted"}
    
    except Exception as e:
        logger.error(f"Failed to delete document {doc_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete document: {str(e)}"
        )

