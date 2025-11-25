"""
PDF styles and color palette definitions.

Provides consistent styling for professional trade study reports.
"""

import logging
from typing import Dict, Any, Optional

# Try to import reportlab
REPORTLAB_AVAILABLE = False
try:
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
    REPORTLAB_AVAILABLE = True
except ImportError as e:
    logging.warning(f"reportlab not available: {e}")
    colors = None  # type: ignore
    getSampleStyleSheet = None  # type: ignore
    ParagraphStyle = None  # type: ignore
    TA_LEFT = TA_CENTER = TA_RIGHT = TA_JUSTIFY = None  # type: ignore


class PDFStyles:
    """Manages PDF styles and color palette."""
    
    # Color palette - initialized lazily
    COLORS: Dict[str, Any] = {}
    
    def __init__(self):
        """Initialize styles with color palette."""
        if not self.COLORS:
            self._init_colors()
        self.styles = self._create_styles()
    
    @classmethod
    def _init_colors(cls) -> None:
        """Initialize color palette. Called lazily to avoid errors if reportlab unavailable."""
        if not REPORTLAB_AVAILABLE:
            return
        cls.COLORS = {
            'header': colors.HexColor('#1A1A1A'),
            'body': colors.HexColor('#4A4A4A'),
            'accent': colors.HexColor('#0D6EFD'),
            'accent_dark': colors.HexColor('#0B5ED7'),
            'muted': colors.HexColor('#6B7280'),
            'light_gray': colors.HexColor('#F3F4F6'),
            'border': colors.HexColor('#E5E7EB'),
            'success': colors.HexColor('#10B981'),
            'warning': colors.HexColor('#F59E0B'),
            'error': colors.HexColor('#EF4444'),
            'white': colors.white,
        }
    
    def _create_styles(self) -> Dict[str, Any]:
        """Create custom paragraph styles for the report."""
        if not REPORTLAB_AVAILABLE:
            return {}
            
        base_styles = getSampleStyleSheet()
        
        return {
            'cover_title': ParagraphStyle(
                name='CoverTitle',
                parent=base_styles['Title'],
                fontName='Helvetica-Bold',
                fontSize=32,
                leading=40,
                textColor=self.COLORS['header'],
                alignment=TA_CENTER,
                spaceAfter=20,
            ),
            'cover_subtitle': ParagraphStyle(
                name='CoverSubtitle',
                parent=base_styles['Normal'],
                fontName='Helvetica',
                fontSize=16,
                leading=22,
                textColor=self.COLORS['muted'],
                alignment=TA_CENTER,
                spaceAfter=12,
            ),
            'section_heading': ParagraphStyle(
                name='SectionHeading',
                parent=base_styles['Heading1'],
                fontName='Helvetica-Bold',
                fontSize=16,
                leading=22,
                textColor=self.COLORS['white'],
                alignment=TA_CENTER,
                spaceBefore=20,
                spaceAfter=0,
            ),
            'subsection_heading': ParagraphStyle(
                name='SubsectionHeading',
                parent=base_styles['Heading2'],
                fontName='Helvetica-Bold',
                fontSize=12,
                leading=16,
                textColor=self.COLORS['header'],
                spaceBefore=16,
                spaceAfter=8,
                leftIndent=0,
            ),
            'body': ParagraphStyle(
                name='Body',
                parent=base_styles['Normal'],
                fontName='Helvetica',
                fontSize=11,
                leading=15,
                textColor=self.COLORS['body'],
                alignment=TA_JUSTIFY,
                spaceAfter=8,
            ),
            'body_bold': ParagraphStyle(
                name='BodyBold',
                parent=base_styles['Normal'],
                fontName='Helvetica-Bold',
                fontSize=11,
                leading=15,
                textColor=self.COLORS['header'],
                spaceAfter=6,
            ),
            'caption': ParagraphStyle(
                name='Caption',
                parent=base_styles['Normal'],
                fontName='Helvetica-Oblique',
                fontSize=9,
                leading=12,
                textColor=self.COLORS['muted'],
                alignment=TA_CENTER,
                spaceBefore=6,
                spaceAfter=12,
            ),
            'toc_heading': ParagraphStyle(
                name='TOCHeading',
                parent=base_styles['Heading1'],
                fontName='Helvetica-Bold',
                fontSize=18,
                leading=24,
                textColor=self.COLORS['header'],
                spaceAfter=20,
            ),
            'toc_entry': ParagraphStyle(
                name='TOCEntry',
                parent=base_styles['Normal'],
                fontName='Helvetica',
                fontSize=11,
                leading=16,
                textColor=self.COLORS['body'],
                leftIndent=0,
            ),
            'recommendation_box': ParagraphStyle(
                name='RecommendationBox',
                parent=base_styles['Normal'],
                fontName='Helvetica-Bold',
                fontSize=12,
                leading=16,
                textColor=self.COLORS['accent_dark'],
                alignment=TA_LEFT,
            ),
            'footer': ParagraphStyle(
                name='Footer',
                parent=base_styles['Normal'],
                fontName='Helvetica',
                fontSize=8,
                leading=10,
                textColor=self.COLORS['muted'],
            ),
        }
    
    def get_score_color(self, score: float) -> Optional[Any]:
        """
        Get background color based on score value (1-10 scale).
        
        Args:
            score: Score value between 1 and 10
            
        Returns:
            Color object for cell background
        """
        if not REPORTLAB_AVAILABLE:
            return None
        if score >= 8:
            return colors.HexColor('#DCFCE7')  # Green - excellent
        elif score >= 6:
            return colors.HexColor('#FEF9C3')  # Yellow - good
        elif score >= 4:
            return colors.HexColor('#FED7AA')  # Orange - fair
        else:
            return colors.HexColor('#FECACA')  # Red - poor

