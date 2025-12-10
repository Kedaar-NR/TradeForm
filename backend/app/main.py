"""
FastAPI application entry point.

This file sets up the FastAPI app, middleware, and includes all route modules.
All business logic and routes are organized in the routers/ directory.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables before any other imports
# This ensures GEMINI_API_KEY and other env vars are available to all modules
project_root = Path(__file__).resolve().parents[2]
env_path = project_root / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.database import (
    engine,
    run_sql_migrations,
    ensure_project_group_schema,
    ensure_supplier_material_columns,
    ensure_user_profile_image_column,
)
from app.routers import (
    auth,
    projects,
    project_groups,
    criteria,
    components,
    scores,
    datasheets,
    results,
    collaboration,
    ai,
    onboarding,
    search,
    suppliers,
    cad
)

# Create all database tables and run migrations
print("=" * 60, flush=True)
print("Initializing database...", flush=True)
print("=" * 60, flush=True)
models.Base.metadata.create_all(bind=engine)
print("✓ Base tables created", flush=True)
run_sql_migrations()
ensure_project_group_schema()
ensure_supplier_material_columns()
ensure_user_profile_image_column()
print("=" * 60, flush=True)

# Initialize FastAPI app
app = FastAPI(
    title="TradeForm API",
    description="AI-Powered Trade Study Automation API",
    version="1.0.0"
)

# CORS configuration - must be added BEFORE routes for OPTIONS to work
# We allow defaults for local dev and automatically add common deployment URLs when present.
def _parse_origins(value: str) -> list[str]:
    """Split a comma string into a list of cleaned origins."""
    return [origin.strip() for origin in value.split(",") if origin.strip()]


default_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
]
prod_defaults = [
    "https://trade-form.com",
    "https://www.trade-form.com",
    "https://tradeform-production.up.railway.app",
]
env_origins = _parse_origins(os.getenv("CORS_ORIGINS", ""))

# Auto-add deploy URLs when provided (e.g., Vercel/Render)
vercel_url = os.getenv("VERCEL_URL")  # Usually set without protocol
frontend_url = os.getenv("FRONTEND_URL")
render_host = os.getenv("RENDER_EXTERNAL_URL") or os.getenv("RENDER_EXTERNAL_HOSTNAME")

def _normalize_url(url: str | None) -> str | None:
    if not url:
        return None
    if url.startswith("http://") or url.startswith("https://"):
        return url
    return f"https://{url}"

derived_origins = [
    _normalize_url(vercel_url),
    _normalize_url(frontend_url),
    _normalize_url(render_host),
]

cors_origins = [o for o in env_origins + default_origins + prod_defaults + derived_origins if o]

# For development/temporary allow all, set ALLOW_ALL_ORIGINS=true
if os.getenv("ALLOW_ALL_ORIGINS", "false").lower() == "true":
    cors_origins = ["*"]

# Add CORS middleware - this must handle OPTIONS preflight requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Include routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(project_groups.router)
app.include_router(criteria.router)
app.include_router(components.router)
app.include_router(scores.router)
app.include_router(datasheets.router)
app.include_router(results.router)
app.include_router(collaboration.router)
app.include_router(ai.router)
app.include_router(onboarding.router)
app.include_router(search.router)
app.include_router(suppliers.router)
app.include_router(cad.router)


@app.on_event("startup")
async def startup_event():
    """Log startup information and check environment configuration"""
    print("=" * 60)
    print("TradeForm Backend Starting...")
    print("=" * 60)
    
    # Check GEMINI_API_KEY
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        # Mask the key for security (show first 10 chars)
        masked_key = gemini_key[:10] + "..." if len(gemini_key) > 10 else "***"
        print(f"✓ GEMINI_API_KEY is set ({masked_key})")
        print("  Datasheet Q&A features will be available")
    else:
        print("⚠ GEMINI_API_KEY is NOT set")
        print("  Datasheet Q&A features will not be available")
        print("  Set GEMINI_API_KEY in your .env file to enable these features")
    
    # Check ANTHROPIC_API_KEY
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    if anthropic_key:
        masked_key = anthropic_key[:10] + "..." if len(anthropic_key) > 10 else "***"
        print(f"✓ ANTHROPIC_API_KEY is set ({masked_key})")
    else:
        print("⚠ ANTHROPIC_API_KEY is NOT set")
        print("  AI component discovery and scoring will not be available")
    
    print("=" * 60)
    print()


@app.get("/")
def read_root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to TradeForm API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
