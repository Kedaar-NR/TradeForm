"""
PDF generation module for trade study reports.

This module provides professional PDF report generation with:
- Custom styling and color palettes
- Charts (bar charts, spider/radar charts)
- Tables (scoring matrices, trade-off comparisons)
- Section builders (cover, ToC, executive summary, etc.)
"""

from app.services.pdf.styles import PDFStyles, REPORTLAB_AVAILABLE
from app.services.pdf.charts import PDFChartBuilder
from app.services.pdf.tables import PDFTableBuilder
from app.services.pdf.sections import PDFSectionBuilder

__all__ = [
    "PDFStyles",
    "PDFChartBuilder",
    "PDFTableBuilder",
    "PDFSectionBuilder",
    "REPORTLAB_AVAILABLE",
]

