"""
Text parsing utilities for markdown and report text processing.

Provides shared functions for parsing markdown-formatted text into structured blocks.
Used by report generation services (PDF, Word) and AI routers.
"""

import re
from typing import List, Dict


def clean_markdown_line(line: str) -> str:
    """
    Clean markdown formatting from a line of text.
    
    Args:
        line: Raw line potentially containing markdown
        
    Returns:
        Cleaned line with markdown symbols removed
    """
    return (
        line.strip()
        .lstrip("#*- >")
        .replace("**", "")
        .replace("__", "")
    )


def looks_like_heading(text: str) -> bool:
    """
    Heuristic to determine if text looks like a heading.
    
    Criteria:
    - Short text ending with a colon
    - All uppercase short text
    - Title case short text
    
    Args:
        text: Text to evaluate
        
    Returns:
        True if text appears to be a heading
    """
    stripped = text.strip()
    if not stripped:
        return False

    # Lines ending with colon that aren't too long
    if stripped.endswith(":") and len(stripped) <= 90:
        return True

    words = stripped.split()
    if len(words) <= 8:
        # All uppercase short text
        alpha_chars = [c for c in stripped if c.isalpha()]
        if alpha_chars and all(c.isupper() for c in alpha_chars) and len(stripped) <= 72:
            return True
        # Title case
        if stripped.istitle():
            return True

    return False


def parse_report_blocks(report_text: str) -> List[Dict[str, object]]:
    """
    Convert raw AI/markdown text into structured blocks.
    
    Parses text into headings, bullet lists, and paragraphs for
    rendering in PDF or Word documents.
    
    Args:
        report_text: Raw markdown-formatted report text
        
    Returns:
        List of block dictionaries with 'type' and content fields:
        - {"type": "heading", "text": str, "level": int}
        - {"type": "paragraph", "text": str}
        - {"type": "bullets", "items": List[str]}
    """
    blocks: List[Dict[str, object]] = []
    bullet_buffer: List[str] = []
    paragraph_buffer: List[str] = []

    def flush_paragraph():
        nonlocal paragraph_buffer
        if paragraph_buffer:
            blocks.append(
                {"type": "paragraph", "text": " ".join(paragraph_buffer)}
            )
            paragraph_buffer = []

    def flush_bullets():
        nonlocal bullet_buffer
        if bullet_buffer:
            blocks.append({"type": "bullets", "items": bullet_buffer})
            bullet_buffer = []

    for raw_line in report_text.splitlines():
        line = clean_markdown_line(raw_line)
        if not line:
            flush_paragraph()
            flush_bullets()
            continue

        # Check for bullet points or numbered lists
        if line.startswith(("-", "*", "•")) or re.match(r"^\d+[\.\)]\s", line):
            flush_paragraph()
            cleaned_bullet = re.sub(r"^\d+[\.\)]\s*", "", line).lstrip("-*• ").strip()
            bullet_buffer.append(cleaned_bullet)
            continue

        # Check for headings
        if looks_like_heading(line):
            flush_paragraph()
            flush_bullets()
            words = line.split()
            level = 1 if len(words) <= 4 else 2
            blocks.append({
                "type": "heading",
                "text": line.rstrip(":").strip(),
                "level": level
            })
            continue

        # Regular paragraph text
        paragraph_buffer.append(line)

    # Flush remaining buffers
    flush_paragraph()
    flush_bullets()
    
    return blocks


def prepare_report_lines(report_text: str) -> List[str]:
    """
    Normalize markdown text into clean paragraphs for simple PDF rendering.
    
    Args:
        report_text: Raw markdown report text
        
    Returns:
        List of cleaned paragraph strings with header prepended
    """
    from datetime import datetime

    paragraphs: List[str] = []
    buffer: List[str] = []
    
    for raw_line in report_text.splitlines():
        cleaned = clean_markdown_line(raw_line)
        if not cleaned:
            if buffer:
                paragraphs.append(" ".join(buffer))
                buffer = []
            continue
        buffer.append(cleaned)

    if buffer:
        paragraphs.append(" ".join(buffer))

    header = [
        "Trade Study Report",
        f"Generated on {datetime.utcnow().strftime('%B %d, %Y')}",
    ]
    return header + [""] + (paragraphs or [""])

