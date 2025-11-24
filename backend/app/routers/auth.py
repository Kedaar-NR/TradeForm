"""Authentication endpoints for user registration and login."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/register", response_model=schemas.AuthResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = auth.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user
    hashed_password = auth.get_password_hash(user_data.password)
    db_user = models.User(
        email=user_data.email,
        name=user_data.name,
        password_hash=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Create user profile for onboarding
    user_profile = models.UserProfile(
        user_id=db_user.id,
        onboarding_status=models.OnboardingStatus.NOT_STARTED
    )
    db.add(user_profile)
    db.commit()

    # Create access token
    access_token = auth.create_access_token(
        data={"sub": str(db_user.id)},
        expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "name": db_user.name,
            "created_at": db_user.created_at,
            "onboarding_status": user_profile.onboarding_status.value
        }
    }


@router.post("/login", response_model=schemas.AuthResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login with email and password"""
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get or create user profile
    profile = db.query(models.UserProfile).filter(
        models.UserProfile.user_id == user.id
    ).first()
    
    if not profile:
        profile = models.UserProfile(
            user_id=user.id,
            onboarding_status=models.OnboardingStatus.NOT_STARTED
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # Create access token
    access_token = auth.create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "created_at": user.created_at,
            "onboarding_status": profile.onboarding_status.value
        }
    }


@router.get("/me", response_model=schemas.User)
def get_current_user_info(current_user: models.User = Depends(auth.get_current_user_required)):
    """Get current user information"""
    return current_user

