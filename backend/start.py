#!/usr/bin/env python3
"""
Simple startup script to initialize database and start the backend.
This helps debug any startup issues.
"""
import sys
import os

print("=" * 60)
print("TradeForm Backend Startup")
print("=" * 60)

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("\n1. Importing modules...")
    from app import models
    from app.database import engine, Base
    
    print("✓ Modules imported successfully")
    
    print("\n2. Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created")
    
    print("\n3. Checking database file...")
    if os.path.exists("tradeform.db"):
        size = os.path.getsize("tradeform.db")
        print(f"✓ Database file exists: tradeform.db ({size} bytes)")
    else:
        print("⚠ Database file not found!")
    
    print("\n4. Starting FastAPI server...")
    print("   Backend will be available at: http://localhost:8000")
    print("   API docs at: http://localhost:8000/docs")
    print("=" * 60)
    print()
    
    # Start uvicorn
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
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

