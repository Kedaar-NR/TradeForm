from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

# Set up logging for migrations
logger = logging.getLogger(__name__)

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
        logger.info("Skipping SQL migrations (SQLite detected)")
        print("Skipping SQL migrations (SQLite detected)", flush=True)
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
        error_msg = f"WARNING: Migrations directory not found. Tried: {possible_paths}"
        logger.warning(error_msg)
        print(error_msg, flush=True, file=sys.stderr)
        return

    info_msg = f"Running migrations from: {migrations_dir}"
    logger.info(info_msg)
    print(info_msg, flush=True)
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
                logger.info("No migration files found")
                print("No migration files found", flush=True)
                return

            for migration_path in migration_files:
                filename = migration_path.name
                already_applied = conn.execute(
                    text("SELECT 1 FROM schema_migrations WHERE filename = :name"),
                    {"name": filename},
                ).scalar()

                if already_applied:
                    logger.info(f"Migration {filename} already applied, skipping")
                    print(f"Migration {filename} already applied, skipping", flush=True)
                    continue

                logger.info(f"Applying migration: {filename}")
                print(f"Applying migration: {filename}", flush=True)
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
                success_msg = f"✓ Applied DB migration: {filename}"
                logger.info(success_msg)
                print(success_msg, flush=True)
    except Exception as exc:
        # Fail fast with a clear message so we don't run with an out-of-sync schema
        import traceback
        error_msg = f"✗ Database migration failed: {exc}"
        logger.error(error_msg, exc_info=True)
        print(error_msg, flush=True, file=sys.stderr)
        print(traceback.format_exc(), flush=True, file=sys.stderr)
        raise


def ensure_project_group_schema():
    """
    Safety net: ensure project_group_id support exists even if SQL migrations were skipped.
    Adds project_groups table (if missing), column on projects, and FK constraint.
    """
    if DATABASE_URL.startswith("sqlite"):
        logger.info("Skipping schema self-heal (SQLite detected)")
        print("Skipping schema self-heal (SQLite detected)", flush=True)
        return

    try:
        logger.info("Running schema self-heal for project_group_id...")
        print("Running schema self-heal for project_group_id...", flush=True)
        with engine.begin() as conn:
            # Check if column already exists
            column_exists = conn.execute(
                text("""
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'projects' AND column_name = 'project_group_id'
                """)
            ).scalar()
            
            if column_exists:
                logger.info("✓ project_group_id column already exists")
                print("✓ project_group_id column already exists", flush=True)
            else:
                logger.info("Creating project_groups table...")
                print("Creating project_groups table...", flush=True)
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

                logger.info("Adding project_group_id column to projects...")
                print("Adding project_group_id column to projects...", flush=True)
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

                logger.info("Adding foreign key constraint...")
                print("Adding foreign key constraint...", flush=True)
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
                success_msg = "✓ Ensured project_group_id column/constraint on projects"
                logger.info(success_msg)
                print(success_msg, flush=True)
    except Exception as exc:
        import traceback
        error_msg = f"✗ Schema self-heal failed: {exc}"
        logger.error(error_msg, exc_info=True)
        print(error_msg, flush=True, file=sys.stderr)
        print(traceback.format_exc(), flush=True, file=sys.stderr)
        raise


def ensure_supplier_material_columns():
    """
    Ensure supplier_steps has material columns when running on SQLite (where SQL migrations are skipped).
    This keeps local development databases in sync with the ORM model.
    """
    if not DATABASE_URL.startswith("sqlite"):
        return

    required_columns = {
        "material_name": "TEXT",
        "material_description": "TEXT",
        "material_file_path": "TEXT",
        "material_mime_type": "TEXT",
        "material_original_filename": "TEXT",
        "material_size_bytes": "INTEGER",
        "material_updated_at": "TIMESTAMP",
    }

    try:
        with engine.begin() as conn:
            existing_columns = {
                row[1]
                for row in conn.execute(text("PRAGMA table_info(supplier_steps)"))
            }

            for column_name, column_type in required_columns.items():
                if column_name not in existing_columns:
                    conn.exec_driver_sql(
                        f"ALTER TABLE supplier_steps ADD COLUMN {column_name} {column_type}"
                    )
    except Exception as exc:
        logger.warning(
            "Unable to ensure supplier material columns on SQLite: %s", exc, exc_info=True
        )


def ensure_user_profile_image_column():
    """
    Ensure users table has profile_image_url column when running on SQLite.
    This keeps local development databases in sync with the ORM model.
    """
    if not DATABASE_URL.startswith("sqlite"):
        return

    try:
        with engine.begin() as conn:
            existing_columns = {
                row[1]
                for row in conn.execute(text("PRAGMA table_info(users)"))
            }

            if "profile_image_url" not in existing_columns:
                conn.exec_driver_sql(
                    "ALTER TABLE users ADD COLUMN profile_image_url TEXT"
                )
                logger.info("✓ Added profile_image_url column to users table (SQLite)")
                print("✓ Added profile_image_url column to users table (SQLite)", flush=True)
    except Exception as exc:
        logger.warning(
            "Unable to ensure profile_image_url column on SQLite: %s", exc, exc_info=True
        )

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
