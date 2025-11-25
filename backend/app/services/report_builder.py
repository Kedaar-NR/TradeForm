"""
Report builder service for PDF generation from markdown text.

Provides text-based PDF generation for trade study reports,
including styled and simple PDF builders.
"""

import io
import textwrap
from datetime import datetime
from typing import List, Dict

from app.utils.text_parser import parse_report_blocks, prepare_report_lines

# Try to import reportlab
REPORTLAB_AVAILABLE = False
try:
    from reportlab.lib.colors import HexColor
    from reportlab.lib.enums import TA_LEFT
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import (
        HRFlowable, ListFlowable, ListItem, Paragraph, SimpleDocTemplate, Spacer
    )
    REPORTLAB_AVAILABLE = True
except ImportError:
    pass


def build_report_pdf(report_text: str) -> io.BytesIO:
    """
    Create a PDF document from stored trade study report text.
    
    Chooses between styled PDF (if reportlab available) or simple PDF.
    
    Args:
        report_text: Markdown-formatted report text
        
    Returns:
        BytesIO buffer containing the PDF
    """
    if REPORTLAB_AVAILABLE:
        return build_styled_report_pdf(report_text)
    
    prepared_lines = prepare_report_lines(report_text)
    return build_simple_pdf(prepared_lines)


def build_styled_report_pdf(report_text: str) -> io.BytesIO:
    """
    High-quality PDF with headings, subheadings, and bullet formatting.
    
    Args:
        report_text: Markdown-formatted report text
        
    Returns:
        BytesIO buffer containing the styled PDF
    """
    if not REPORTLAB_AVAILABLE:
        raise RuntimeError("reportlab is not available")
    
    blocks = parse_report_blocks(report_text)
    buffer = io.BytesIO()
    
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.9 * inch,
        rightMargin=0.9 * inch,
        topMargin=0.9 * inch,
        bottomMargin=0.9 * inch,
    )
    
    palette = {
        "ink": HexColor("#0f172a"),
        "muted": HexColor("#475569"),
        "accent": HexColor("#1f2937"),
        "rule": HexColor("#e5e7eb"),
    }
    
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="ReportTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=palette["ink"],
        alignment=TA_LEFT,
        spaceAfter=10,
    ))
    styles.add(ParagraphStyle(
        name="ReportSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=13,
        textColor=palette["muted"],
        alignment=TA_LEFT,
        spaceAfter=12,
    ))
    styles.add(ParagraphStyle(
        name="SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=palette["ink"],
        spaceBefore=10,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="SubHeading",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=palette["ink"],
        spaceBefore=8,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=14.5,
        textColor=palette["muted"],
        spaceAfter=6,
    ))
    
    story: List[object] = [
        Paragraph("Trade Study Report", styles["ReportTitle"]),
        Paragraph(datetime.utcnow().strftime("Generated %B %d, %Y"), styles["ReportSubtitle"]),
        HRFlowable(width="100%", thickness=1, color=palette["rule"], spaceBefore=2, spaceAfter=14),
    ]
    
    if not blocks:
        story.append(Paragraph("No report content available.", styles["Body"]))
    else:
        for block in blocks:
            if block["type"] == "heading":
                level = block.get("level", 1)
                style_name = "SectionHeading" if level == 1 else "SubHeading"
                story.append(Paragraph(str(block["text"]), styles[style_name]))
            elif block["type"] == "paragraph":
                story.append(Paragraph(str(block["text"]), styles["Body"]))
            elif block["type"] == "bullets":
                items = [
                    ListItem(Paragraph(str(item), styles["Body"]), leftIndent=6)
                    for item in block.get("items", [])
                ]
                if items:
                    story.append(ListFlowable(
                        items,
                        bulletType="bullet",
                        start="•",
                        bulletFontName="Helvetica-Bold",
                        bulletFontSize=10,
                        bulletColor=palette["accent"],
                        leftIndent=14,
                        spaceBefore=0,
                    ))
    
    doc.build(story)
    buffer.seek(0)
    return buffer


def escape_pdf_text(text: str) -> str:
    """
    Escape special characters for raw PDF text stream.
    
    Args:
        text: Raw text to escape
        
    Returns:
        Escaped text safe for PDF content stream
    """
    return (
        text.replace("\\", "\\\\")
        .replace("(", "\\(")
        .replace(")", "\\)")
    )


def build_simple_pdf(lines: List[str]) -> io.BytesIO:
    """
    Lightweight PDF generator when reportlab isn't available.
    
    Creates a minimal valid PDF with basic text content.
    
    Args:
        lines: List of text lines to include
        
    Returns:
        BytesIO buffer containing the simple PDF
    """
    buffer = io.BytesIO()
    buffer.write(b"%PDF-1.4\n")
    
    wrapped: List[str] = []
    for line in lines:
        wrapped_lines = textwrap.wrap(line, width=100)
        if not wrapped_lines:
            wrapped.append("")
        else:
            wrapped.extend(wrapped_lines)
    
    if not wrapped:
        wrapped = [""]
    
    text_commands = [
        "BT",
        "/F1 12 Tf",
        "14 TL",
        "72 720 Td",
    ]
    for idx, line in enumerate(wrapped):
        escaped_line = escape_pdf_text(line)
        text_commands.append(f"({escaped_line}) Tj")
        if idx != len(wrapped) - 1:
            text_commands.append("T*")
    text_commands.append("ET")
    
    content_stream = "\n".join(text_commands).encode("latin-1", "ignore")
    
    offsets = [0]
    
    def write_obj(obj: bytes):
        offsets.append(buffer.tell())
        buffer.write(obj)
    
    write_obj(b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n")
    write_obj(b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n")
    write_obj(
        b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>endobj\n"
    )
    content_obj = (
        f"4 0 obj<< /Length {len(content_stream)} >>\nstream\n".encode("latin-1")
        + content_stream
        + b"\nendstream\nendobj\n"
    )
    write_obj(content_obj)
    write_obj(b"5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n")
    
    startxref = buffer.tell()
    buffer.write(f"xref\n0 {len(offsets)}\n".encode("latin-1"))
    buffer.write(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        buffer.write(f"{off:010} 00000 n \n".encode("latin-1"))
    
    buffer.write(
        b"trailer<< /Size "
        + str(len(offsets)).encode("latin-1")
        + b" /Root 1 0 R >>\nstartxref\n"
        + str(startxref).encode("latin-1")
        + b"\n%%EOF"
    )
    buffer.seek(0)
    return buffer

