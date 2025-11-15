"""
FastAPI application entry point.

This file sets up the FastAPI app, middleware, and includes all route modules.
All business logic and routes are organized in the routers/ directory.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app import models
from app.database import engine
from app.routers import (
    auth,
    projects,
    criteria,
    components,
    scores,
    datasheets,
    results,
    collaboration,
    ai
)

# Create all database tables
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="TradeForm API",
    description="AI-Powered Trade Study Automation API",
    version="1.0.0"
)

# CORS configuration
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
if os.getenv("ALLOW_ALL_ORIGINS", "false").lower() == "true":
    cors_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(criteria.router)
app.include_router(components.router)
app.include_router(scores.router)
app.include_router(datasheets.router)
app.include_router(results.router)
app.include_router(collaboration.router)
app.include_router(ai.router)


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
