from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root (two levels up: backend/app -> backend -> project root)
project_root = Path(__file__).parent.parent.parent
env_path = project_root / '.env'
load_dotenv(dotenv_path=env_path)

# Fallback to current directory if project root .env doesn't exist
if not env_path.exists():
    load_dotenv()

# Database URL - force SQLite for local development
DATABASE_URL = "sqlite:///./tradeform.db"

# You can override with environment variable for production
if os.getenv("DATABASE_URL") and not os.getenv("DATABASE_URL").startswith("postgres://"):
    DATABASE_URL = os.getenv("DATABASE_URL")

# Create engine (add connect_args for SQLite)
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
