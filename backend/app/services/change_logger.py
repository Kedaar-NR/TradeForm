import json
from typing import Any, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app import models
from app.auth import get_password_hash

SYSTEM_USER_EMAIL = "system@tradeform.com"
SYSTEM_USER_NAME = "System"
SYSTEM_USER_PASSWORD = "system-default-password"


def _ensure_system_user(db: Session) -> models.User:
    """Ensure a system user exists for logging purposes."""
    user = (
        db.query(models.User)
        .filter(models.User.email == SYSTEM_USER_EMAIL)
        .first()
    )
    if user:
        return user

    user = models.User(
        email=SYSTEM_USER_EMAIL,
        name=SYSTEM_USER_NAME,
        password_hash=get_password_hash(SYSTEM_USER_PASSWORD),
    )
    db.add(user)
    db.flush()
    return user


def _serialize_value(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        try:
            return json.dumps(value)
        except Exception:
            return str(value)
    return str(value)


def log_project_change(
    db: Session,
    *,
    project_id: UUID,
    change_type: str,
    description: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[UUID] = None,
    old_value: Any = None,
    new_value: Any = None,
    user_id: Optional[UUID] = None,
):
    """Persist a change log entry for a project."""
    user = (
        db.query(models.User).filter(models.User.id == user_id).first()
        if user_id
        else None
    )
    if not user:
        user = _ensure_system_user(db)

    change = models.ProjectChange(
        project_id=project_id,
        user_id=user.id,
        change_type=change_type,
        change_description=description,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=_serialize_value(old_value),
        new_value=_serialize_value(new_value),
    )
    db.add(change)
