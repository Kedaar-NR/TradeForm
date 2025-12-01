from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
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

# Database URL - use environment variable or fallback to SQLite for local development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tradeform.db")

# Create engine (add connect_args for SQLite)
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()


def run_sql_migrations():
    """Apply SQL migrations in backend/migrations once per deployment."""
    # Skip migrations for SQLite/local dev where create_all() is enough
    if DATABASE_URL.startswith("sqlite"):
        print("Skipping SQL migrations (SQLite detected)")
        return

    # Try multiple possible paths for migrations directory
    possible_paths = [
        Path(__file__).resolve().parents[1] / "migrations",  # backend/migrations
        Path("/app/migrations"),  # Railway/Docker absolute path
        Path("migrations"),  # Current directory
    ]
    
    migrations_dir = None
    for path in possible_paths:
        if path.exists() and path.is_dir():
            migrations_dir = path
            break
    
    if not migrations_dir:
        print(f"WARNING: Migrations directory not found. Tried: {possible_paths}")
        return

    print(f"Running migrations from: {migrations_dir}")
    try:
        with engine.begin() as conn:
            # Track applied migrations
            conn.exec_driver_sql(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    filename TEXT PRIMARY KEY,
                    applied_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )

            migration_files = sorted(migrations_dir.glob("*.sql"))
            if not migration_files:
                print("No migration files found")
                return

            for migration_path in migration_files:
                filename = migration_path.name
                already_applied = conn.execute(
                    text("SELECT 1 FROM schema_migrations WHERE filename = :name"),
                    {"name": filename},
                ).scalar()

                if already_applied:
                    print(f"Migration {filename} already applied, skipping")
                    continue

                print(f"Applying migration: {filename}")
                sql = migration_path.read_text()
                # exec_driver_sql allows multi-statement SQL (needed for our .sql files)
                conn.exec_driver_sql(sql)
                try:
                    conn.execute(
                        text("INSERT INTO schema_migrations (filename) VALUES (:name)"),
                        {"name": filename},
                    )
                except IntegrityError:
                    # Another process inserted first; safe to ignore
                    pass
                print(f"✓ Applied DB migration: {filename}")
    except Exception as exc:
        # Fail fast with a clear message so we don't run with an out-of-sync schema
        import traceback
        print(f"✗ Database migration failed: {exc}")
        print(traceback.format_exc())
        raise


def ensure_project_group_schema():
    """
    Safety net: ensure project_group_id support exists even if SQL migrations were skipped.
    Adds project_groups table (if missing), column on projects, and FK constraint.
    """
    if DATABASE_URL.startswith("sqlite"):
        print("Skipping schema self-heal (SQLite detected)")
        return

    try:
        print("Running schema self-heal for project_group_id...")
        with engine.begin() as conn:
            # Check if column already exists
            column_exists = conn.execute(
                text("""
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'projects' AND column_name = 'project_group_id'
                """)
            ).scalar()
            
            if column_exists:
                print("✓ project_group_id column already exists")
            else:
                print("Creating project_groups table...")
                conn.exec_driver_sql(
                    """
                    CREATE TABLE IF NOT EXISTS project_groups (
                        id UUID PRIMARY KEY,
                        name VARCHAR NOT NULL,
                        description TEXT,
                        icon VARCHAR DEFAULT 'folder',
                        color VARCHAR DEFAULT '#6B7280',
                        created_by UUID REFERENCES users(id),
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_at TIMESTAMPTZ DEFAULT NOW()
                    );
                    """
                )

                print("Adding project_group_id column to projects...")
                # PostgreSQL doesn't support ADD COLUMN IF NOT EXISTS, so use DO block
                conn.exec_driver_sql(
                    """
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_name = 'projects' AND column_name = 'project_group_id'
                        ) THEN
                            ALTER TABLE projects ADD COLUMN project_group_id UUID;
                        END IF;
                    END $$;
                    """
                )

                print("Adding foreign key constraint...")
                conn.exec_driver_sql(
                    """
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.table_constraints
                            WHERE table_name = 'projects'
                              AND constraint_name = 'projects_project_group_id_fkey'
                        ) THEN
                            ALTER TABLE projects
                            ADD CONSTRAINT projects_project_group_id_fkey
                            FOREIGN KEY (project_group_id) REFERENCES project_groups(id);
                        END IF;
                    END $$;
                    """
                )
                print("✓ Ensured project_group_id column/constraint on projects")
    except Exception as exc:
        import traceback
        print(f"✗ Schema self-heal failed: {exc}")
        print(traceback.format_exc())
        raise

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
