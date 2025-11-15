"""
Input validation utilities.

Provides validation functions for common input types and formats.
"""

import re
from typing import Optional
from uuid import UUID


def is_valid_email(email: str) -> bool:
    """
    Validate email address format.
    
    Args:
        email: Email address to validate
        
    Returns:
        True if email is valid, False otherwise
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def is_valid_uuid(uuid_string: str) -> bool:
    """
    Validate UUID string format.
    
    Args:
        uuid_string: UUID string to validate
        
    Returns:
        True if UUID is valid, False otherwise
    """
    try:
        UUID(uuid_string)
        return True
    except (ValueError, AttributeError):
        return False


def is_valid_url(url: str) -> bool:
    """
    Validate URL format.
    
    Args:
        url: URL to validate
        
    Returns:
        True if URL is valid, False otherwise
    """
    pattern = r'^https?://[^\s/$.?#].[^\s]*$'
    return bool(re.match(pattern, url))


def validate_score_range(score: float, min_val: float = 1, max_val: float = 10) -> Optional[str]:
    """
    Validate that a score is within the valid range.
    
    Args:
        score: Score value to validate
        min_val: Minimum allowed value
        max_val: Maximum allowed value
        
    Returns:
        Error message if invalid, None if valid
    """
    if score < min_val:
        return f"Score must be at least {min_val}"
    if score > max_val:
        return f"Score must not exceed {max_val}"
    return None


def validate_weight(weight: float) -> Optional[str]:
    """
    Validate criterion weight value.
    
    Args:
        weight: Weight value to validate
        
    Returns:
        Error message if invalid, None if valid
    """
    if weight <= 0:
        return "Weight must be positive"
    if weight > 100:
        return "Weight should not exceed 100"
    return None


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename by removing or replacing unsafe characters.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename safe for filesystem use
    """
    # Remove or replace unsafe characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove leading/trailing dots and spaces
    filename = filename.strip('. ')
    # Limit length
    if len(filename) > 255:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:250] + ('.' + ext if ext else '')
    return filename or 'unnamed'

