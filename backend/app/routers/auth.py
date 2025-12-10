"""Authentication endpoints for user registration and login."""

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
import os
import secrets
import httpx
from jose import jwt, JWTError

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["authentication"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
FRONTEND_REDIRECT_URL = os.getenv("FRONTEND_URL") or "/"
ACCESS_COOKIE_NAME = "access_token"
STATE_PURPOSE = "google_oauth_state"
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN")  # Set to ".trade-form.com" in production


def _set_auth_cookie(response: Response, token: str):
    cookie_params = {
        "key": ACCESS_COOKIE_NAME,
        "value": token,
        "max_age": 60 * 60 * 24 * 30,
        "httponly": True,
        "secure": True,
        "samesite": "lax",
        "path": "/",
    }
    # Only set domain if explicitly configured (for production cross-subdomain support)
    if COOKIE_DOMAIN:
        cookie_params["domain"] = COOKIE_DOMAIN
    response.set_cookie(**cookie_params)


def _build_state_token() -> str:
    """Create a short-lived signed state token for OAuth."""
    exp_minutes = 15
    expire = datetime.utcnow() + timedelta(minutes=exp_minutes)
    payload = {"purpose": STATE_PURPOSE, "exp": expire, "nonce": secrets.token_urlsafe(8)}
    return jwt.encode(payload, auth.SECRET_KEY, algorithm=auth.ALGORITHM)


def _verify_state_token(token: str):
    try:
        data = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        if data.get("purpose") != STATE_PURPOSE:
            raise JWTError("Invalid purpose")
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid state") from exc


@router.post("/register", response_model=schemas.AuthResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, response: Response, db: Session = Depends(get_db)):
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

    _set_auth_cookie(response, access_token)

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
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
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

    _set_auth_cookie(response, access_token)

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


@router.get("/google/login")
def google_login(request: Request):
    """Start Google OAuth login flow"""
    if not (GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI):
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")

    # Use the env var GOOGLE_REDIRECT_URI from Railway
    redirect_uri = GOOGLE_REDIRECT_URI
    
    # Log for debugging
    print(f"[GOOGLE LOGIN] Using redirect URI: {redirect_uri}")

    state = _build_state_token()
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "state": state,
        "prompt": "consent",
    }
    from urllib.parse import urlencode

    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return RedirectResponse(url)


@router.get("/google/callback")
async def google_callback(request: Request, code: str, state: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback, issue JWT, and set session cookie."""
    if not (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI):
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")

    _verify_state_token(state)

    # Use the same redirect URI as in the login flow (from env var)
    redirect_uri = GOOGLE_REDIRECT_URI

    # Exchange code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        token_resp = await client.post(token_url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange Google code")
        token_data = token_resp.json()
        id_token = token_data.get("id_token")
        if not id_token:
            raise HTTPException(status_code=400, detail="Missing id_token from Google")

        # Validate id_token via tokeninfo
        verify_resp = await client.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": id_token})
        if verify_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid Google token")
        id_info = verify_resp.json()

    aud = id_info.get("aud")
    iss = id_info.get("iss")
    email = id_info.get("email")
    email_verified = id_info.get("email_verified")
    name = id_info.get("name") or email
    picture = id_info.get("picture")  # Google profile picture URL

    if aud != GOOGLE_CLIENT_ID or iss not in {"accounts.google.com", "https://accounts.google.com"}:
        raise HTTPException(status_code=400, detail="Invalid Google token payload")
    if not email or str(email_verified).lower() != "true":
        raise HTTPException(status_code=400, detail="Google account must have a verified email")

    # Upsert user
    user = auth.get_user_by_email(db, email)
    is_new_user = False
    
    if not user:
        is_new_user = True
        random_password = secrets.token_urlsafe(16)
        hashed_password = auth.get_password_hash(random_password)
        user = models.User(email=email, name=name, password_hash=hashed_password, profile_image_url=picture)
        db.add(user)
        db.commit()
        db.refresh(user)

        profile = models.UserProfile(
            user_id=user.id,
            onboarding_status=models.OnboardingStatus.NOT_STARTED
        )
        db.add(profile)
        db.commit()
    else:
        # Update display name and profile picture if missing or changed
        updated = False
        if not user.name and name:
            user.name = name
            updated = True
        if picture and user.profile_image_url != picture:
            user.profile_image_url = picture
            updated = True
        if updated:
            db.commit()

    access_token = auth.create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # Redirect based on whether this is a new signup or existing user login
    # Extract base domain from GOOGLE_REDIRECT_URI (e.g., https://trade-form.com)
    from urllib.parse import urlparse
    parsed = urlparse(GOOGLE_REDIRECT_URI)
    base_domain = f"{parsed.scheme}://{parsed.netloc}"
    
    # NEW users → onboarding, EXISTING users → dashboard
    if is_new_user:
        base_url = f"{base_domain}/onboarding"
    else:
        base_url = f"{base_domain}/dashboard"
    
    # Pass token via URL fragment (hash) so frontend can store it
    # Using fragment (#) keeps token out of server logs
    frontend_url = f"{base_url}#token={access_token}"
    
    response = RedirectResponse(frontend_url)
    _set_auth_cookie(response, access_token)  # Also set cookie as backup
    return response
