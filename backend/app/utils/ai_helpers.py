"""
AI response handling utilities.

Provides helper functions for extracting and processing responses from AI APIs.
"""

from typing import Any


def extract_response_text(message: Any) -> str:
    """
    Extract text content from an Anthropic API message response.
    
    Handles different block types in the message content array,
    extracting text from each block and concatenating.
    
    Args:
        message: Anthropic API message response object
        
    Returns:
        Concatenated text content from all blocks
    """
    response_text = ""
    for block in message.content:
        text = getattr(block, 'text', '')
        if text:
            response_text += text
    return response_text.strip()


def clean_json_response(text: str) -> str:
    """
    Remove markdown code block formatting from JSON response.
    
    AI models often wrap JSON responses in ```json ... ``` blocks.
    This function strips that formatting to get raw JSON.
    
    Args:
        text: Response text potentially containing markdown code blocks
        
    Returns:
        Clean JSON string without markdown formatting
    """
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return text

