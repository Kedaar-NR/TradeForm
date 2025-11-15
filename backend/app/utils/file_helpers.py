"""
File handling utilities.

Provides helper functions for file upload, download, and processing operations.
"""

import os
from pathlib import Path
from typing import Optional, Tuple
from fastapi import UploadFile
import mimetypes


def get_file_extension(filename: str) -> str:
    """
    Extract file extension from filename.
    
    Args:
        filename: Name of the file
        
    Returns:
        File extension including dot (e.g., '.pdf'), empty string if none
    """
    return Path(filename).suffix.lower()


def is_allowed_file_type(filename: str, allowed_extensions: list) -> bool:
    """
    Check if file has an allowed extension.
    
    Args:
        filename: Name of the file
        allowed_extensions: List of allowed extensions (e.g., ['.pdf', '.xlsx'])
        
    Returns:
        True if file type is allowed, False otherwise
    """
    ext = get_file_extension(filename)
    return ext in [e.lower() for e in allowed_extensions]


def get_mime_type(filename: str) -> Optional[str]:
    """
    Get MIME type for a file based on its extension.
    
    Args:
        filename: Name of the file
        
    Returns:
        MIME type string or None if unknown
    """
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type


def get_file_size_mb(file_path: str) -> float:
    """
    Get file size in megabytes.
    
    Args:
        file_path: Path to the file
        
    Returns:
        File size in MB
    """
    size_bytes = os.path.getsize(file_path)
    return size_bytes / (1024 * 1024)


def validate_file_size(file: UploadFile, max_size_mb: float) -> Tuple[bool, Optional[str]]:
    """
    Validate uploaded file size.
    
    Args:
        file: Uploaded file object
        max_size_mb: Maximum allowed size in megabytes
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        file.file.seek(0, 2)  # Seek to end
        size_bytes = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        size_mb = size_bytes / (1024 * 1024)
        
        if size_mb > max_size_mb:
            return False, f"File size ({size_mb:.2f}MB) exceeds maximum allowed size ({max_size_mb}MB)"
        
        return True, None
    except Exception as e:
        return False, f"Failed to validate file size: {str(e)}"


def ensure_directory_exists(directory_path: str) -> None:
    """
    Ensure a directory exists, creating it if necessary.
    
    Args:
        directory_path: Path to the directory
    """
    Path(directory_path).mkdir(parents=True, exist_ok=True)


def generate_unique_filename(original_filename: str, prefix: str = "", suffix: str = "") -> str:
    """
    Generate a unique filename based on original name.
    
    Args:
        original_filename: Original filename
        prefix: Optional prefix to add
        suffix: Optional suffix to add before extension
        
    Returns:
        Unique filename
    """
    import uuid
    from datetime import datetime
    
    name, ext = os.path.splitext(original_filename)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    
    parts = [p for p in [prefix, name, suffix, timestamp, unique_id] if p]
    return "_".join(parts) + ext


def is_pdf_file(filename: str) -> bool:
    """
    Check if file is a PDF based on extension.
    
    Args:
        filename: Name of the file
        
    Returns:
        True if file is PDF, False otherwise
    """
    return get_file_extension(filename) == '.pdf'


def is_excel_file(filename: str) -> bool:
    """
    Check if file is an Excel file based on extension.
    
    Args:
        filename: Name of the file
        
    Returns:
        True if file is Excel format, False otherwise
    """
    ext = get_file_extension(filename)
    return ext in ['.xlsx', '.xls']

