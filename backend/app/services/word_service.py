"""Service for generating Word documents (.docx) from trade study reports."""

import io
import re
from typing import List, Dict

try:
    from docx import Document
    from docx.shared import Pt, RGBColor, Inches
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False


def _looks_like_heading(text: str) -> bool:
    """Heuristic to spot likely headings (short, title-case or ending with a colon)."""
    stripped = text.strip()
    if not stripped:
        return False

    if stripped.endswith(":") and len(stripped) <= 90:
        return True

    words = stripped.split()
    if len(words) <= 8:
        alpha_chars = [c for c in stripped if c.isalpha()]
        if alpha_chars and all(c.isupper() for c in alpha_chars) and len(stripped) <= 72:
            return True
        if stripped.istitle():
            return True

    return False


def _parse_report_blocks(report_text: str) -> List[Dict[str, object]]:
    """Convert raw AI text into structured blocks (headings, bullets, paragraphs)."""
    blocks: List[Dict[str, object]] = []
    bullet_buffer: List[str] = []
    paragraph_buffer: List[str] = []

    def clean_line(line: str) -> str:
        return (
            line.strip()
            .lstrip("#*- >")
            .replace("**", "")
            .replace("__", "")
        )

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
        line = clean_line(raw_line)
        if not line:
            flush_paragraph()
            flush_bullets()
            continue

        if line.startswith(("-", "*", "•")) or re.match(r"^\d+[\.\)]\s", line):
            flush_paragraph()
            cleaned_bullet = re.sub(r"^\d+[\.\)]\s*", "", line).lstrip("-*• ").strip()
            bullet_buffer.append(cleaned_bullet)
            continue

        if _looks_like_heading(line):
            flush_paragraph()
            flush_bullets()
            words = line.split()
            level = 1 if len(words) <= 4 else 2
            blocks.append({"type": "heading", "text": line.rstrip(":").strip(), "level": level})
            continue

        paragraph_buffer.append(line)

    flush_paragraph()
    flush_bullets()
    return blocks


class WordService:
    """Service for generating Word documents from trade study reports."""

    @staticmethod
    def generate_report_docx(report_text: str) -> io.BytesIO:
        """
        Generate a formatted Word document from the trade study report text.
        
        Args:
            report_text: The markdown-formatted report text
            
        Returns:
            BytesIO object with .docx file
        """
        if not DOCX_AVAILABLE:
            raise ImportError("python-docx is not installed. Install it with: pip install python-docx")

        # Parse report into structured blocks
        blocks = _parse_report_blocks(report_text)
        
        # Create document
        doc = Document()
        
        # Set document margins (1 inch all around)
        sections = doc.sections
        for section in sections:
            section.top_margin = Inches(1)
            section.bottom_margin = Inches(1)
            section.left_margin = Inches(1)
            section.right_margin = Inches(1)
        
        # Define color palette
        color_ink = RGBColor(15, 23, 42)      # #0f172a
        color_muted = RGBColor(71, 85, 105)   # #475569
        color_accent = RGBColor(31, 41, 55)   # #1f2937
        
        # Process blocks
        for block in blocks:
            block_type = block.get("type")
            
            if block_type == "heading":
                level = block.get("level", 1)
                text = str(block.get("text", ""))
                
                # Add heading
                if level == 1:
                    heading = doc.add_heading(text, level=1)
                    # Style the heading
                    for run in heading.runs:
                        run.font.size = Pt(18)
                        run.font.color.rgb = color_ink
                        run.font.bold = True
                    heading.space_after = Pt(10)
                else:
                    heading = doc.add_heading(text, level=2)
                    for run in heading.runs:
                        run.font.size = Pt(14)
                        run.font.color.rgb = color_accent
                        run.font.bold = True
                    heading.space_after = Pt(8)
                    
            elif block_type == "paragraph":
                text = str(block.get("text", ""))
                if text:
                    para = doc.add_paragraph(text)
                    # Style paragraph
                    for run in para.runs:
                        run.font.size = Pt(11)
                        run.font.name = 'Calibri'
                        run.font.color.rgb = color_ink
                    para.space_after = Pt(8)
                    
            elif block_type == "bullets":
                items = block.get("items", [])
                for item in items:
                    para = doc.add_paragraph(str(item), style='List Bullet')
                    # Style bullet points
                    for run in para.runs:
                        run.font.size = Pt(11)
                        run.font.name = 'Calibri'
                        run.font.color.rgb = color_ink
                    para.space_after = Pt(4)
        
        # Save to BytesIO buffer
        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        
        return buffer


def get_word_service() -> WordService:
    """Get WordService instance."""
    return WordService()

