"""
Data transformation utilities.

Handles conversions between different data formats, particularly
between snake_case (Python/database) and camelCase (JavaScript/API).
"""

from typing import Dict, Any, List
import re


def snake_to_camel(snake_str: str) -> str:
    """
    Convert snake_case string to camelCase.
    
    Args:
        snake_str: String in snake_case format
        
    Returns:
        String in camelCase format
        
    Example:
        >>> snake_to_camel("user_name")
        "userName"
    """
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


def camel_to_snake(camel_str: str) -> str:
    """
    Convert camelCase string to snake_case.
    
    Args:
        camel_str: String in camelCase format
        
    Returns:
        String in snake_case format
        
    Example:
        >>> camel_to_snake("userName")
        "user_name"
    """
    return re.sub(r'(?<!^)(?=[A-Z])', '_', camel_str).lower()


def dict_keys_to_camel(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert all keys in a dictionary from snake_case to camelCase.
    
    Args:
        data: Dictionary with snake_case keys
        
    Returns:
        Dictionary with camelCase keys
    """
    return {snake_to_camel(k): v for k, v in data.items()}


def dict_keys_to_snake(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert all keys in a dictionary from camelCase to snake_case.
    
    Args:
        data: Dictionary with camelCase keys
        
    Returns:
        Dictionary with snake_case keys
    """
    return {camel_to_snake(k): v for k, v in data.items()}


def model_to_camel_dict(model: Any, exclude: List[str] = None) -> Dict[str, Any]:
    """
    Convert a SQLAlchemy model instance to a dictionary with camelCase keys.
    
    Args:
        model: SQLAlchemy model instance
        exclude: List of field names to exclude
        
    Returns:
        Dictionary with camelCase keys
    """
    exclude = exclude or []
    data = {}
    
    for column in model.__table__.columns:
        if column.name not in exclude:
            value = getattr(model, column.name)
            camel_key = snake_to_camel(column.name)
            data[camel_key] = value
    
    return data

