#!/usr/bin/env python3
"""Initialize the database without starting the server"""
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("Initializing database...")

try:
    from app.database import engine, Base
    from app import models
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Check if database file exists
    if os.path.exists("tradeform.db"):
        size = os.path.getsize("tradeform.db")
        print(f"✓ Database created successfully: tradeform.db ({size} bytes)")
    else:
        print("✗ Database file not found")
        sys.exit(1)
        
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

