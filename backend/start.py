#!/usr/bin/env python3
"""
Simple startup script to initialize database and start the backend.
This helps debug any startup issues.
"""
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
project_root = Path(__file__).parent.parent
env_path = project_root / '.env'
load_dotenv(dotenv_path=env_path)
if not env_path.exists():
    load_dotenv()

print("=" * 60)
print("TradeForm Backend Startup")
print("=" * 60)

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("\n1. Importing modules...")
    from app import models
    from app.database import engine, Base, run_sql_migrations, ensure_project_group_schema
    
    print("✓ Modules imported successfully")
    
    print("\n2. Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created")
    
    print("\n3. Applying SQL migrations (if needed)...")
    run_sql_migrations()
    ensure_project_group_schema()
    print("✓ Migrations applied")
    
    print("\n4. Checking database file...")
    if os.path.exists("tradeform.db"):
        size = os.path.getsize("tradeform.db")
        print(f"✓ Database file exists: tradeform.db ({size} bytes)")
    else:
        print("⚠ Database file not found!")
    
    print("\n5. Checking environment variables...")
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        # Mask the key for security (show first 10 chars)
        masked_key = gemini_key[:10] + "..." if len(gemini_key) > 10 else "***"
        print(f"✓ GEMINI_API_KEY is set ({masked_key})")
    else:
        print("⚠ GEMINI_API_KEY is not set. AI datasheet Q&A features will not be available.")
        print("   Set GEMINI_API_KEY in your .env file to enable Gemini API features.")
    
    print("\n6. Starting FastAPI server...")
    print("   Backend will be available at: http://localhost:8000")
    print("   API docs at: http://localhost:8000/docs")
    print("=" * 60)
    print()
    
    # Start uvicorn
    # Note: For development with auto-reload, run uvicorn directly:
    #   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Disabled to avoid port conflicts with startup script
        log_level="info"
    )
    
except ImportError as e:
    print(f"\n✗ Import Error: {e}")
    print("\nMissing dependencies? Try running:")
    print("  pip install -r requirements.txt")
    sys.exit(1)
    
except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
