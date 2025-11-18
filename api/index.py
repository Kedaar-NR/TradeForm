"""
Vercel serverless function entry point for FastAPI backend.
This wraps the FastAPI app for deployment on Vercel.
"""
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.main import app

# Vercel expects a variable named 'app' or 'handler'
handler = app
