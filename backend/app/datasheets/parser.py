"""PDF datasheet parser module"""

from dataclasses import dataclass
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class ParsedPage:
    """Represents a parsed page from a PDF"""
    page_number: int
    raw_text: str
    section_title: Optional[str] = None


def parse_pdf_to_pages(file_path: str) -> List[ParsedPage]:
    """
    Parse a PDF file and extract text per page.
    
    Args:
        file_path: Path to the PDF file
        
    Returns:
        List of ParsedPage objects containing extracted text
        
    Raises:
        Exception: If PDF parsing fails
    """
    try:
        import pdfplumber
        
        parsed_pages = []
        
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                try:
                    # Extract text from the page
                    text = page.extract_text() or ""
                    
                    # Try to detect section title (simple heuristic)
                    section_title = _extract_section_title(text)
                    
                    parsed_pages.append(ParsedPage(
                        page_number=page_num,
                        raw_text=text,
                        section_title=section_title
                    ))
                    
                except Exception as e:
                    logger.warning(f"Failed to parse page {page_num}: {str(e)}")
                    # Add empty page to maintain page numbering
                    parsed_pages.append(ParsedPage(
                        page_number=page_num,
                        raw_text="",
                        section_title=None
                    ))
        
        logger.info(f"Successfully parsed {len(parsed_pages)} pages from {file_path}")
        return parsed_pages
        
    except ImportError:
        logger.error("pdfplumber not installed. Install with: pip install pdfplumber")
        raise Exception("PDF parsing library not available")
    except Exception as e:
        logger.error(f"Failed to parse PDF {file_path}: {str(e)}")
        raise Exception(f"PDF parsing failed: {str(e)}")


def _extract_section_title(text: str) -> Optional[str]:
    """
    Extract section title from page text using simple heuristics.
    
    Args:
        text: Raw text from the page
        
    Returns:
        Section title if found, None otherwise
    """
    if not text:
        return None
    
    lines = text.strip().split('\n')
    if not lines:
        return None
    
    # Take first non-empty line as potential section title
    for line in lines[:5]:  # Check first 5 lines
        line = line.strip()
        if line:
            # If line is short and uppercase-heavy, likely a title
            if len(line) < 100:
                uppercase_ratio = sum(1 for c in line if c.isupper()) / max(len(line), 1)
                if uppercase_ratio > 0.5 or line.isupper():
                    return line[:200]  # Limit length
                # Otherwise, just return first significant line
                return line[:200]
    
    return None


def retrieve_relevant_chunks(question: str, pages: List, max_chunks: int = 8) -> List[dict]:
    """
    Retrieve relevant text chunks from datasheet pages based on question.
    
    Uses simple keyword-based relevance scoring.
    
    Args:
        question: The user's question
        pages: List of DatasheetPage model objects
        max_chunks: Maximum number of chunks to return
        
    Returns:
        List of dicts with page_number, section_title, and text
    """
    if not pages:
        return []
    
    # Tokenize question into keywords (simple approach)
    keywords = _extract_keywords(question)
    
    # Score each page by keyword matches
    scored_pages = []
    for page in pages:
        if not page.raw_text:
            continue
            
        text_lower = page.raw_text.lower()
        
        # Count keyword matches (case-insensitive)
        score = sum(1 for keyword in keywords if keyword in text_lower)
        
        # Boost score if section title matches
        if page.section_title and any(kw in page.section_title.lower() for kw in keywords):
            score += 2
        
        if score > 0:
            scored_pages.append((score, page))
    
    # Sort by score (descending) and take top N
    scored_pages.sort(key=lambda x: x[0], reverse=True)
    top_pages = scored_pages[:max_chunks]
    
    # Convert to result format
    results = []
    for _, page in top_pages:
        # Split long pages into chunks (if needed)
        chunks = _split_into_chunks(page.raw_text, max_chunk_size=2000)
        
        for chunk_text in chunks[:2]:  # Max 2 chunks per page
            results.append({
                "page_number": page.page_number,
                "section_title": page.section_title,
                "text": chunk_text
            })
            
            if len(results) >= max_chunks:
                break
        
        if len(results) >= max_chunks:
            break
    
    return results


def _extract_keywords(text: str) -> List[str]:
    """
    Extract keywords from text for relevance matching.
    
    Simple approach: split on whitespace and remove common words.
    
    Args:
        text: Input text
        
    Returns:
        List of keyword strings (lowercase)
    """
    # Common stop words to ignore
    stop_words = {
        'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
        'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
        'to', 'was', 'will', 'with', 'what', 'when', 'where', 'who', 'how'
    }
    
    # Split and clean
    words = text.lower().split()
    keywords = []
    
    for word in words:
        # Remove punctuation
        word = ''.join(c for c in word if c.isalnum())
        # Keep if not a stop word and has length > 2
        if word and len(word) > 2 and word not in stop_words:
            keywords.append(word)
    
    return keywords


def _split_into_chunks(text: str, max_chunk_size: int = 2000) -> List[str]:
    """
    Split text into manageable chunks.
    
    Args:
        text: Text to split
        max_chunk_size: Maximum characters per chunk
        
    Returns:
        List of text chunks
    """
    if len(text) <= max_chunk_size:
        return [text]
    
    chunks = []
    current_chunk = []
    current_size = 0
    
    # Split by lines to preserve some structure
    lines = text.split('\n')
    
    for line in lines:
        line_len = len(line) + 1  # +1 for newline
        
        if current_size + line_len > max_chunk_size and current_chunk:
            # Save current chunk and start new one
            chunks.append('\n'.join(current_chunk))
            current_chunk = [line]
            current_size = line_len
        else:
            current_chunk.append(line)
            current_size += line_len
    
    # Add remaining chunk
    if current_chunk:
        chunks.append('\n'.join(current_chunk))
    
    return chunks

