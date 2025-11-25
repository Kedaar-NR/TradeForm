"""
Professional PDF Report Service for Trade Study Reports.

Generates industry-grade technical reports with cover pages, ToC, charts,
tables, and proper typography following engineering documentation standards.
"""
# pyright: reportMissingModuleSource=false

import io
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

# Try to import reportlab - it may not be installed in all environments
REPORTLAB_AVAILABLE = False
try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        PageBreak, HRFlowable, ListFlowable, ListItem, KeepTogether
    )
    from reportlab.platypus.tableofcontents import TableOfContents
    from reportlab.graphics.shapes import Drawing, String, Line, Rect
    from reportlab.graphics.charts.barcharts import VerticalBarChart
    from reportlab.graphics.charts.spider import SpiderChart
    from reportlab.graphics import renderPDF
    REPORTLAB_AVAILABLE = True
except ImportError as e:
    logging.warning(f"reportlab not available, professional PDF generation disabled: {e}")


class ProfessionalPDFService:
    """Service for generating professional trade study PDF reports."""
    
    # Color palette - initialized lazily in __init__ to avoid NameError if reportlab unavailable
    COLORS: Dict[str, Any] = {}

    def __init__(self):
        # Initialize colors here to avoid class-level NameError if reportlab not installed
        if not self.COLORS:
            self._init_colors()
        self.styles = self._create_styles()
        self.page_info = {'page_count': 0, 'current_page': 1}
        self.toc_entries: List[Tuple[int, str, int]] = []
    
    @classmethod
    def _init_colors(cls) -> None:
        """Initialize color palette. Called lazily to avoid NameError if reportlab unavailable."""
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

    def _create_styles(self) -> dict:
        """Create custom paragraph styles for the report."""
        base_styles = getSampleStyleSheet()
        
        custom_styles = {
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
                fontSize=18,
                leading=24,
                textColor=self.COLORS['header'],
                spaceBefore=24,
                spaceAfter=12,
                borderWidth=0,
                borderPadding=0,
            ),
            'subsection_heading': ParagraphStyle(
                name='SubsectionHeading',
                parent=base_styles['Heading2'],
                fontName='Helvetica-Bold',
                fontSize=14,
                leading=18,
                textColor=self.COLORS['header'],
                spaceBefore=16,
                spaceAfter=8,
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
        
        return custom_styles

    def _parse_ai_report_sections(self, report_text: str) -> Dict[str, str]:
        """Parse AI-generated report text into logical sections."""
        sections = {
            'executive_summary': '',
            'methodology': '',
            'analysis': '',
            'conclusion': '',
            'full_text': report_text or ''
        }
        
        if not report_text:
            return sections
        
        # Normalize the text
        text = report_text.strip()
        lines = text.split('\n')
        
        current_section = 'executive_summary'
        section_content = []
        
        section_keywords = {
            'executive summary': 'executive_summary',
            'summary': 'executive_summary',
            'overview': 'executive_summary',
            'methodology': 'methodology',
            'approach': 'methodology',
            'evaluation criteria': 'methodology',
            'criteria': 'methodology',
            'analysis': 'analysis',
            'component': 'analysis',
            'evaluation': 'analysis',
            'comparison': 'analysis',
            'conclusion': 'conclusion',
            'recommendation': 'conclusion',
            'result': 'conclusion',
        }
        
        for line in lines:
            line_lower = line.lower().strip()
            
            # Check if this line is a section header
            is_header = False
            if line_lower.startswith('#') or (len(line_lower) < 60 and ':' not in line_lower):
                for keyword, section_name in section_keywords.items():
                    if keyword in line_lower:
                        # Save current section content
                        if section_content:
                            sections[current_section] = '\n'.join(section_content).strip()
                        current_section = section_name
                        section_content = []
                        is_header = True
                        break
            
            if not is_header and line.strip():
                # Clean markdown formatting
                clean_line = line.strip().lstrip('#').strip()
                clean_line = clean_line.replace('**', '').replace('__', '')
                if clean_line:
                    section_content.append(clean_line)
        
        # Save last section
        if section_content:
            sections[current_section] = '\n'.join(section_content).strip()
        
        return sections

    def generate_report(
        self,
        project_name: str,
        project_description: Optional[str],
        component_type: str,
        criteria: List[Dict[str, Any]],
        components_data: List[Dict[str, Any]],
        report_text: str,
    ) -> io.BytesIO:
        """
        Generate a professional PDF trade study report.
        
        Args:
            project_name: Name of the trade study project
            project_description: Optional project description
            component_type: Type/category of components being evaluated
            criteria: List of criterion dicts with name, description, weight, unit
            components_data: List of component dicts with scores and rankings
            report_text: AI-generated report narrative text
            
        Returns:
            BytesIO buffer containing the PDF
        """
        buffer = io.BytesIO()
        
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=1 * inch,
            rightMargin=1 * inch,
            topMargin=1 * inch,
            bottomMargin=1 * inch,
        )
        
        # Parse AI-generated report into sections for integration
        ai_sections = self._parse_ai_report_sections(report_text)
        
        story = []
        
        # Build report sections
        story.extend(self._build_cover_page(project_name, component_type, project_description))
        story.append(PageBreak())
        
        story.extend(self._build_table_of_contents())
        story.append(PageBreak())
        
        story.extend(self._build_executive_summary(project_name, components_data, criteria, ai_sections))
        story.append(PageBreak())
        
        story.extend(self._build_methodology_section(criteria, ai_sections))
        story.append(PageBreak())
        
        story.extend(self._build_component_analysis(components_data, criteria, ai_sections))
        story.append(PageBreak())
        
        story.extend(self._build_charts_section(components_data, criteria))
        story.append(PageBreak())
        
        story.extend(self._build_conclusion(components_data, project_name))
        story.append(PageBreak())
        
        story.extend(self._build_appendix(components_data, criteria, project_name))
        
        # Build with page template for headers/footers
        doc.build(
            story,
            onFirstPage=lambda canvas, doc: self._add_page_decorations(canvas, doc, project_name, is_cover=True),
            onLaterPages=lambda canvas, doc: self._add_page_decorations(canvas, doc, project_name, is_cover=False),
        )
        
        buffer.seek(0)
        return buffer

    def _build_cover_page(
        self,
        project_name: str,
        component_type: str,
        description: Optional[str],
    ) -> List:
        """Build the cover page."""
        elements = []
        
        # Top spacer
        elements.append(Spacer(1, 2 * inch))
        
        # Main title
        elements.append(Paragraph(
            f"{project_name}",
            self.styles['cover_title']
        ))
        
        elements.append(Spacer(1, 0.3 * inch))
        
        # Subtitle
        elements.append(Paragraph(
            "Trade Study Report",
            self.styles['cover_subtitle']
        ))
        
        elements.append(Spacer(1, 0.5 * inch))
        
        # Decorative line
        elements.append(HRFlowable(
            width="60%",
            thickness=2,
            color=self.COLORS['accent'],
            spaceBefore=10,
            spaceAfter=30,
            hAlign='CENTER',
        ))
        
        # Component category
        elements.append(Paragraph(
            f"<b>Component Category:</b> {component_type}",
            ParagraphStyle(
                name='CoverCategory',
                parent=self.styles['body'],
                fontSize=12,
                alignment=TA_CENTER,
                textColor=self.COLORS['body'],
            )
        ))
        
        if description:
            elements.append(Spacer(1, 0.3 * inch))
            elements.append(Paragraph(
                description[:300] + ('...' if len(description) > 300 else ''),
                ParagraphStyle(
                    name='CoverDesc',
                    parent=self.styles['body'],
                    fontSize=10,
                    alignment=TA_CENTER,
                    textColor=self.COLORS['muted'],
                )
            ))
        
        # Bottom section with date and branding
        elements.append(Spacer(1, 2.5 * inch))
        
        elements.append(Paragraph(
            datetime.now().strftime("%B %d, %Y"),
            ParagraphStyle(
                name='CoverDate',
                parent=self.styles['body'],
                fontSize=11,
                alignment=TA_CENTER,
                textColor=self.COLORS['muted'],
            )
        ))
        
        elements.append(Spacer(1, 0.5 * inch))
        
        elements.append(Paragraph(
            "Prepared by TradeForm",
            ParagraphStyle(
                name='CoverBrand',
                parent=self.styles['body'],
                fontSize=10,
                alignment=TA_CENTER,
                textColor=self.COLORS['accent'],
                fontName='Helvetica-Bold',
            )
        ))
        
        return elements

    def _build_table_of_contents(self) -> List:
        """Build table of contents page."""
        elements = []
        
        elements.append(Paragraph("Table of Contents", self.styles['toc_heading']))
        elements.append(Spacer(1, 0.3 * inch))
        
        toc_entries = [
            ("1. Executive Summary", 3),
            ("2. Methodology", 4),
            ("    2.1 Evaluation Criteria", 4),
            ("    2.2 Scoring Methodology", 4),
            ("3. Component Analysis", 5),
            ("    3.1 Summary Comparison", 5),
            ("    3.2 Detailed Evaluations", 5),
            ("4. Visual Analysis", 6),
            ("    4.1 Score Comparison Chart", 6),
            ("    4.2 Criteria Radar Chart", 6),
            ("5. Conclusion & Recommendation", 7),
            ("6. Appendix", 8),
            ("    6.1 Raw Scoring Matrix", 8),
            ("    6.2 Project Metadata", 8),
        ]
        
        for entry, page in toc_entries:
            indent = 20 if entry.startswith("    ") else 0
            entry_text = entry.strip()
            
            # Create dotted leader between entry and page number
            elements.append(
                Paragraph(
                    f'<font name="Helvetica">{entry_text}</font>'
                    f'<font name="Helvetica" color="#9CA3AF"> {"." * (50 - len(entry_text))} </font>'
                    f'<font name="Helvetica">{page}</font>',
                    ParagraphStyle(
                        name=f'TOC_{entry_text[:10]}',
                        parent=self.styles['toc_entry'],
                        leftIndent=indent,
                    )
                )
            )
        
        return elements

    def _build_executive_summary(
        self,
        project_name: str,
        components_data: List[Dict[str, Any]],
        criteria: List[Dict[str, Any]],
        ai_sections: Optional[Dict[str, str]] = None,
    ) -> List:
        """Build executive summary section with AI-generated narrative."""
        elements = []
        
        elements.append(Paragraph("1. Executive Summary", self.styles['section_heading']))
        elements.append(HRFlowable(
            width="100%",
            thickness=1,
            color=self.COLORS['border'],
            spaceAfter=15,
        ))
        
        # Sort by rank to get top performer
        sorted_components = sorted(components_data, key=lambda x: x.get('rank', 999))
        top_component = sorted_components[0] if sorted_components else None
        
        # Add AI-generated executive summary if available
        ai_summary = (ai_sections or {}).get('executive_summary', '')
        if ai_summary and len(ai_summary) > 50:
            # Use AI narrative for summary
            for para in ai_summary.split('\n\n'):
                if para.strip():
                    elements.append(Paragraph(para.strip(), self.styles['body']))
            elements.append(Spacer(1, 0.15 * inch))
        else:
            # Fallback to structured summary
            num_components = len(components_data)
            num_criteria = len(criteria)
            
            summary_text = (
                f"This trade study evaluates <b>{num_components}</b> candidate components "
                f"against <b>{num_criteria}</b> weighted criteria to identify the optimal "
                f"solution for the {project_name} project."
            )
            elements.append(Paragraph(summary_text, self.styles['body']))
        
        if top_component:
            # Recommendation box
            elements.append(Spacer(1, 0.2 * inch))
            
            rec_table = Table(
                [[
                    Paragraph(
                        f"<b>RECOMMENDATION:</b> {top_component.get('manufacturer', 'N/A')} "
                        f"{top_component.get('part_number', 'N/A')}",
                        self.styles['recommendation_box']
                    ),
                    Paragraph(
                        f"Score: <b>{top_component.get('total_score', 0):.2f}</b>",
                        ParagraphStyle(
                            name='RecScore',
                            parent=self.styles['body'],
                            alignment=TA_RIGHT,
                            fontName='Helvetica-Bold',
                            textColor=self.COLORS['success'],
                        )
                    ),
                ]],
                colWidths=[4.5 * inch, 1.5 * inch],
            )
            rec_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#EFF6FF')),
                ('BOX', (0, 0), (-1, -1), 1, self.COLORS['accent']),
                ('LEFTPADDING', (0, 0), (-1, -1), 15),
                ('RIGHTPADDING', (0, 0), (-1, -1), 15),
                ('TOPPADDING', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            elements.append(rec_table)
        
        elements.append(Spacer(1, 0.3 * inch))
        
        # Key findings
        elements.append(Paragraph("Key Findings:", self.styles['subsection_heading']))
        
        findings = []
        if top_component:
            findings.append(
                f"The {top_component.get('manufacturer', '')} {top_component.get('part_number', '')} "
                f"achieves the highest weighted score of {top_component.get('total_score', 0):.2f}."
            )
        
        if len(sorted_components) >= 2 and top_component:
            runner_up = sorted_components[1]
            score_diff = (top_component.get('total_score', 0) - runner_up.get('total_score', 0))
            findings.append(
                f"Score differential of {score_diff:.2f} points separates the top two candidates."
            )
        
        if criteria:
            # Find highest weighted criterion
            top_criterion = max(criteria, key=lambda x: x.get('weight', 0))
            findings.append(
                f"'{top_criterion.get('name', 'N/A')}' carries the highest weight "
                f"({top_criterion.get('weight', 0):.1f}%) in the evaluation."
            )
        
        for finding in findings:
            elements.append(Paragraph(f"• {finding}", self.styles['body']))
        
        return elements

    def _build_methodology_section(
        self,
        criteria: List[Dict[str, Any]],
        ai_sections: Optional[Dict[str, str]] = None,
    ) -> List:
        """Build methodology section with criteria and scoring explanation."""
        elements = []
        
        elements.append(Paragraph("2. Methodology", self.styles['section_heading']))
        elements.append(HRFlowable(
            width="100%",
            thickness=1,
            color=self.COLORS['border'],
            spaceAfter=15,
        ))
        
        # Add AI methodology narrative if available
        ai_methodology = (ai_sections or {}).get('methodology', '')
        if ai_methodology and len(ai_methodology) > 50:
            for para in ai_methodology.split('\n\n')[:2]:  # First 2 paragraphs
                if para.strip():
                    elements.append(Paragraph(para.strip(), self.styles['body']))
            elements.append(Spacer(1, 0.15 * inch))
        else:
            # Fallback to standard overview
            elements.append(Paragraph(
                "This trade study employs a weighted multi-criteria decision analysis (MCDA) "
                "approach to systematically evaluate candidate components. Each criterion is "
                "assigned a weight based on its importance to the project requirements.",
                self.styles['body']
            ))
        
        elements.append(Spacer(1, 0.2 * inch))
        
        # Criteria subsection
        elements.append(Paragraph("2.1 Evaluation Criteria", self.styles['subsection_heading']))
        
        if criteria:
            # Criteria table
            table_data = [['Criterion', 'Weight', 'Unit', 'Description']]
            
            for c in criteria:
                table_data.append([
                    c.get('name', 'N/A'),
                    f"{c.get('weight', 0):.1f}%",
                    c.get('unit', '-') or '-',
                    (c.get('description', '')[:50] + '...') if len(c.get('description', '')) > 50 else c.get('description', '-'),
                ])
            
            criteria_table = Table(
                table_data,
                colWidths=[1.5 * inch, 0.8 * inch, 0.8 * inch, 3 * inch],
            )
            criteria_table.setStyle(TableStyle([
                # Header
                ('BACKGROUND', (0, 0), (-1, 0), self.COLORS['header']),
                ('TEXTCOLOR', (0, 0), (-1, 0), self.COLORS['white']),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('TOPPADDING', (0, 0), (-1, 0), 10),
                # Body
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('TEXTCOLOR', (0, 1), (-1, -1), self.COLORS['body']),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
                ('TOPPADDING', (0, 1), (-1, -1), 8),
                # Alternating rows
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [self.COLORS['white'], self.COLORS['light_gray']]),
                # Grid
                ('BOX', (0, 0), (-1, -1), 1, self.COLORS['border']),
                ('LINEBELOW', (0, 0), (-1, 0), 1, self.COLORS['border']),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (1, 0), (2, -1), 'CENTER'),
            ]))
            elements.append(criteria_table)
        
        elements.append(Spacer(1, 0.3 * inch))
        
        # Scoring methodology
        elements.append(Paragraph("2.2 Scoring Methodology", self.styles['subsection_heading']))
        
        elements.append(Paragraph(
            "Components are evaluated on a 1-10 scale for each criterion:",
            self.styles['body']
        ))
        
        score_explanations = [
            ("1-2", "Does not meet requirements"),
            ("3-4", "Marginally meets requirements"),
            ("5-6", "Adequately meets requirements"),
            ("7-8", "Exceeds requirements"),
            ("9-10", "Significantly exceeds requirements"),
        ]
        
        for score_range, explanation in score_explanations:
            elements.append(Paragraph(
                f"<b>{score_range}:</b> {explanation}",
                ParagraphStyle(
                    name=f'Score_{score_range}',
                    parent=self.styles['body'],
                    leftIndent=20,
                    fontSize=10,
                )
            ))
        
        elements.append(Spacer(1, 0.2 * inch))
        
        # Formula
        elements.append(Paragraph(
            "<b>Weighted Score Formula:</b>",
            self.styles['body_bold']
        ))
        elements.append(Paragraph(
            "Total Score = Σ (Criterion Score × Criterion Weight) / Σ Weights",
            ParagraphStyle(
                name='Formula',
                parent=self.styles['body'],
                fontName='Courier',
                fontSize=10,
                leftIndent=20,
                textColor=self.COLORS['accent_dark'],
            )
        ))
        
        return elements

    def _build_component_analysis(
        self,
        components_data: List[Dict[str, Any]],
        criteria: List[Dict[str, Any]],
        ai_sections: Optional[Dict[str, str]] = None,
    ) -> List:
        """Build component analysis section with summary table and details."""
        elements = []
        
        elements.append(Paragraph("3. Component Analysis", self.styles['section_heading']))
        elements.append(HRFlowable(
            width="100%",
            thickness=1,
            color=self.COLORS['border'],
            spaceAfter=15,
        ))
        
        # Add AI analysis narrative if available
        ai_analysis = (ai_sections or {}).get('analysis', '')
        if ai_analysis and len(ai_analysis) > 100:
            # Add brief intro from AI narrative
            intro_para = ai_analysis.split('\n\n')[0] if '\n\n' in ai_analysis else ai_analysis[:300]
            if intro_para.strip():
                elements.append(Paragraph(intro_para.strip()[:400], self.styles['body']))
                elements.append(Spacer(1, 0.15 * inch))
        
        # Summary comparison table
        elements.append(Paragraph("3.1 Summary Comparison", self.styles['subsection_heading']))
        
        if components_data:
            sorted_components = sorted(components_data, key=lambda x: x.get('rank', 999))
            
            # Build summary table
            header = ['Rank', 'Component', 'Score']
            table_data = [header]
            
            for comp in sorted_components:
                table_data.append([
                    f"#{comp.get('rank', '-')}",
                    f"{comp.get('manufacturer', 'N/A')} {comp.get('part_number', '')}",
                    f"{comp.get('total_score', 0):.2f}",
                ])
            
            summary_table = Table(
                table_data,
                colWidths=[0.7 * inch, 4 * inch, 1 * inch],
            )
            summary_table.setStyle(TableStyle([
                # Header
                ('BACKGROUND', (0, 0), (-1, 0), self.COLORS['accent']),
                ('TEXTCOLOR', (0, 0), (-1, 0), self.COLORS['white']),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('TOPPADDING', (0, 0), (-1, 0), 10),
                # Body
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('TEXTCOLOR', (0, 1), (-1, -1), self.COLORS['body']),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
                ('TOPPADDING', (0, 1), (-1, -1), 8),
                # Highlight winner
                ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#ECFDF5')),
                ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
                # Alternating rows (from row 2)
                ('ROWBACKGROUNDS', (0, 2), (-1, -1), [self.COLORS['white'], self.COLORS['light_gray']]),
                # Grid
                ('BOX', (0, 0), (-1, -1), 1, self.COLORS['border']),
                ('LINEBELOW', (0, 0), (-1, 0), 1, self.COLORS['border']),
                ('ALIGN', (0, 0), (0, -1), 'CENTER'),
                ('ALIGN', (2, 0), (2, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            elements.append(summary_table)
        
        elements.append(Spacer(1, 0.4 * inch))
        
        # Detailed evaluations
        elements.append(Paragraph("3.2 Detailed Evaluations", self.styles['subsection_heading']))
        
        for comp in sorted(components_data, key=lambda x: x.get('rank', 999)):
            # Component header
            comp_name = f"{comp.get('manufacturer', 'N/A')} {comp.get('part_number', '')}"
            rank = comp.get('rank', '-')
            score = comp.get('total_score', 0)
            
            elements.append(Spacer(1, 0.15 * inch))
            
            comp_header = Table(
                [[
                    Paragraph(f"<b>#{rank}</b> {comp_name}", self.styles['body_bold']),
                    Paragraph(f"<b>{score:.2f}</b>", ParagraphStyle(
                        name='CompScore',
                        parent=self.styles['body_bold'],
                        alignment=TA_RIGHT,
                        textColor=self.COLORS['success'] if rank == 1 else self.COLORS['body'],
                    )),
                ]],
                colWidths=[5 * inch, 1.1 * inch],
            )
            comp_header.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), self.COLORS['light_gray']),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
                ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('BOX', (0, 0), (-1, -1), 1, self.COLORS['border']),
            ]))
            elements.append(comp_header)
            
            # Description
            if comp.get('description'):
                elements.append(Paragraph(
                    comp['description'][:200] + ('...' if len(comp.get('description', '')) > 200 else ''),
                    ParagraphStyle(
                        name='CompDesc',
                        parent=self.styles['body'],
                        fontSize=9,
                        leftIndent=10,
                        spaceBefore=4,
                    )
                ))
            
            # Scores breakdown
            scores = comp.get('scores', [])
            if scores:
                strengths = []
                weaknesses = []
                
                for s in scores:
                    score_val = s.get('score', 0)
                    crit_name = s.get('criterion_name', 'Unknown')
                    if score_val >= 7:
                        strengths.append(f"{crit_name} ({score_val}/10)")
                    elif score_val <= 4:
                        weaknesses.append(f"{crit_name} ({score_val}/10)")
                
                if strengths:
                    elements.append(Paragraph(
                        f"<font color='#10B981'>[+] Strengths:</font> {', '.join(strengths)}",
                        ParagraphStyle(
                            name='Strengths',
                            parent=self.styles['body'],
                            fontSize=9,
                            leftIndent=10,
                        )
                    ))
                
                if weaknesses:
                    elements.append(Paragraph(
                        f"<font color='#EF4444'>[-] Weaknesses:</font> {', '.join(weaknesses)}",
                        ParagraphStyle(
                            name='Weaknesses',
                            parent=self.styles['body'],
                            fontSize=9,
                            leftIndent=10,
                        )
                    ))
        
        return elements

    def _build_charts_section(
        self,
        components_data: List[Dict[str, Any]],
        criteria: List[Dict[str, Any]],
    ) -> List:
        """Build visual analysis section with charts."""
        import logging
        
        elements = []
        
        elements.append(Paragraph("4. Visual Analysis", self.styles['section_heading']))
        elements.append(HRFlowable(
            width="100%",
            thickness=1,
            color=self.COLORS['border'],
            spaceAfter=15,
        ))
        
        # Bar chart with error handling
        elements.append(Paragraph("4.1 Score Comparison Chart", self.styles['subsection_heading']))
        
        if components_data:
            try:
                bar_chart = self._create_bar_chart(components_data)
                if bar_chart:
                    elements.append(bar_chart)
                    elements.append(Paragraph(
                        "Figure 1: Weighted total scores by component",
                        self.styles['caption']
                    ))
            except Exception as e:
                logging.warning(f"Failed to create bar chart: {e}")
                elements.append(Paragraph(
                    "Chart unavailable - see scoring table for component comparison.",
                    self.styles['body']
                ))
        
        elements.append(Spacer(1, 0.4 * inch))
        
        # Spider/Radar chart with error handling
        elements.append(Paragraph("4.2 Criteria Performance Radar", self.styles['subsection_heading']))
        
        if components_data and criteria:
            try:
                spider_chart = self._create_spider_chart(components_data, criteria)
                if spider_chart:
                    elements.append(spider_chart)
                    elements.append(Paragraph(
                        "Figure 2: Criteria scores comparison across top components",
                        self.styles['caption']
                    ))
            except Exception as e:
                logging.warning(f"Failed to create spider chart: {e}")
                elements.append(Paragraph(
                    "Chart unavailable - see detailed evaluations for criteria breakdown.",
                    self.styles['body']
                ))
        
        return elements

    def _create_bar_chart(self, components_data: List[Dict[str, Any]]) -> Optional[Drawing]:
        """Create a bar chart comparing component scores."""
        if not components_data:
            return None
        
        sorted_components = sorted(components_data, key=lambda x: x.get('rank', 999))[:8]  # Max 8 components
        
        drawing = Drawing(450, 200)
        
        bc = VerticalBarChart()
        bc.x = 50
        bc.y = 50
        bc.height = 120
        bc.width = 380
        
        # Data
        data = [[comp.get('total_score', 0) for comp in sorted_components]]
        bc.data = data
        
        # Categories (component names)
        bc.categoryAxis.categoryNames = [
            f"{comp.get('manufacturer', '')[:10]}"
            for comp in sorted_components
        ]
        
        # Styling
        bc.valueAxis.valueMin = 0
        bc.valueAxis.valueMax = 10
        bc.valueAxis.valueStep = 2
        bc.categoryAxis.labels.fontName = 'Helvetica'
        bc.categoryAxis.labels.fontSize = 8
        bc.categoryAxis.labels.angle = 30
        bc.valueAxis.labels.fontName = 'Helvetica'
        bc.valueAxis.labels.fontSize = 8
        bc.bars[0].fillColor = self.COLORS['accent']
        bc.barWidth = 20
        bc.groupSpacing = 10
        
        drawing.add(bc)
        
        return drawing

    def _create_spider_chart(
        self,
        components_data: List[Dict[str, Any]],
        criteria: List[Dict[str, Any]],
    ) -> Optional[Drawing]:
        """Create a spider/radar chart comparing criteria scores."""
        if not components_data or not criteria:
            return None
        
        # Take top 3 components for comparison
        top_components = sorted(components_data, key=lambda x: x.get('rank', 999))[:3]
        
        drawing = Drawing(400, 250)
        
        # Build data matrix
        data = []
        criteria_names = [c.get('name', f'C{i+1}')[:15] for i, c in enumerate(criteria)]
        
        for comp in top_components:
            comp_scores = []
            scores_dict = {s.get('criterion_name'): s.get('score', 5) for s in comp.get('scores', [])}
            for crit in criteria:
                score = scores_dict.get(crit.get('name'), 5)
                # Normalize to 0-1 range for spider chart
                comp_scores.append(score / 10.0)
            data.append(comp_scores)
        
        if not data or not data[0]:
            return None
        
        sc = SpiderChart()
        sc.x = 100
        sc.y = 30
        sc.width = 200
        sc.height = 200
        sc.data = data
        sc.labels = criteria_names
        
        # Color each series differently
        chart_colors = [
            self.COLORS['accent'],
            self.COLORS['success'],
            self.COLORS['warning'],
        ]
        for i, color in enumerate(chart_colors[:len(data)]):
            sc.strands[i].fillColor = colors.Color(
                color.red, color.green, color.blue, alpha=0.3
            )
            sc.strands[i].strokeColor = color
            sc.strands[i].strokeWidth = 2
        
        drawing.add(sc)
        
        # Add legend
        y_pos = 220
        for i, comp in enumerate(top_components):
            legend_color = chart_colors[i] if i < len(chart_colors) else self.COLORS['muted']
            rect = Rect(330, y_pos - i * 20, 12, 12)
            rect.fillColor = legend_color
            rect.strokeColor = colors.transparent
            drawing.add(rect)
            label = String(
                348, y_pos - i * 20 + 2,
                f"{comp.get('manufacturer', '')[:12]}",
                fontName='Helvetica',
                fontSize=8,
            )
            label.fillColor = self.COLORS['body']
            drawing.add(label)
        
        return drawing

    def _build_conclusion(
        self,
        components_data: List[Dict[str, Any]],
        project_name: str,
    ) -> List:
        """Build conclusion and recommendation section."""
        elements = []
        
        elements.append(Paragraph("5. Conclusion & Recommendation", self.styles['section_heading']))
        elements.append(HRFlowable(
            width="100%",
            thickness=1,
            color=self.COLORS['border'],
            spaceAfter=15,
        ))
        
        sorted_components = sorted(components_data, key=lambda x: x.get('rank', 999))
        
        if sorted_components:
            winner = sorted_components[0]
            
            # Final ranking list
            elements.append(Paragraph("Final Rankings:", self.styles['subsection_heading']))
            
            for comp in sorted_components:
                rank = comp.get('rank', '-')
                name = f"{comp.get('manufacturer', 'N/A')} {comp.get('part_number', '')}"
                score = comp.get('total_score', 0)
                
                # Use text prefixes instead of emojis (reportlab has issues with unicode emojis)
                prefix = "(1st)" if rank == 1 else "(2nd)" if rank == 2 else "(3rd)" if rank == 3 else f"#{rank}"
                
                elements.append(Paragraph(
                    f"<b>{prefix}</b> {name} - Score: {score:.2f}",
                    ParagraphStyle(
                        name=f'Rank_{rank}',
                        parent=self.styles['body'],
                        leftIndent=10,
                        fontName='Helvetica-Bold' if rank == 1 else 'Helvetica',
                    )
                ))
            
            elements.append(Spacer(1, 0.3 * inch))
            
            # Recommendation box
            elements.append(Paragraph("Recommendation:", self.styles['subsection_heading']))
            
            rec_content = Paragraph(
                f"Based on the weighted multi-criteria analysis, "
                f"<b>{winner.get('manufacturer', 'N/A')} {winner.get('part_number', '')}</b> "
                f"is recommended as the optimal solution for the {project_name} project. "
                f"This component achieved the highest weighted score of <b>{winner.get('total_score', 0):.2f}</b> "
                f"across all evaluation criteria.",
                ParagraphStyle(
                    name='RecText',
                    parent=self.styles['body'],
                    textColor=self.COLORS['header'],
                )
            )
            
            rec_box = Table(
                [[rec_content]],
                colWidths=[6 * inch],
            )
            rec_box.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F0FDF4')),
                ('BOX', (0, 0), (-1, -1), 2, self.COLORS['success']),
                ('LEFTPADDING', (0, 0), (-1, -1), 15),
                ('RIGHTPADDING', (0, 0), (-1, -1), 15),
                ('TOPPADDING', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ]))
            elements.append(rec_box)
        
        return elements

    def _build_appendix(
        self,
        components_data: List[Dict[str, Any]],
        criteria: List[Dict[str, Any]],
        project_name: str,
    ) -> List:
        """Build appendix with raw data and metadata."""
        elements = []
        
        elements.append(Paragraph("6. Appendix", self.styles['section_heading']))
        elements.append(HRFlowable(
            width="100%",
            thickness=1,
            color=self.COLORS['border'],
            spaceAfter=15,
        ))
        
        # Raw scoring matrix
        elements.append(Paragraph("6.1 Raw Scoring Matrix", self.styles['subsection_heading']))
        
        if components_data and criteria:
            # Build matrix header
            header = ['Component'] + [c.get('name', 'C')[:8] for c in criteria] + ['Total']
            table_data = [header]
            
            for comp in sorted(components_data, key=lambda x: x.get('rank', 999)):
                row = [f"{comp.get('manufacturer', '')[:10]}"]
                scores_dict = {s.get('criterion_name'): s.get('score', '-') for s in comp.get('scores', [])}
                
                for crit in criteria:
                    score = scores_dict.get(crit.get('name'), '-')
                    row.append(str(score) if score != '-' else '-')
                
                row.append(f"{comp.get('total_score', 0):.2f}")
                table_data.append(row)
            
            # Calculate column widths
            num_cols = len(header)
            available_width = 6 * inch
            first_col_width = 1.2 * inch
            remaining_width = available_width - first_col_width
            other_col_width = remaining_width / (num_cols - 1)
            
            col_widths = [first_col_width] + [other_col_width] * (num_cols - 1)
            
            matrix_table = Table(table_data, colWidths=col_widths)
            matrix_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), self.COLORS['header']),
                ('TEXTCOLOR', (0, 0), (-1, 0), self.COLORS['white']),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 7),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [self.COLORS['white'], self.COLORS['light_gray']]),
                ('BOX', (0, 0), (-1, -1), 1, self.COLORS['border']),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, self.COLORS['border']),
                ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            elements.append(matrix_table)
        
        elements.append(Spacer(1, 0.3 * inch))
        
        # Project metadata
        elements.append(Paragraph("6.2 Project Metadata", self.styles['subsection_heading']))
        
        metadata = [
            ['Project Name', project_name],
            ['Generated', datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")],
            ['Components Evaluated', str(len(components_data))],
            ['Criteria Used', str(len(criteria))],
            ['Report Version', '1.0'],
            ['Generated By', 'TradeForm Professional'],
        ]
        
        meta_table = Table(metadata, colWidths=[1.5 * inch, 4 * inch])
        meta_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (-1, -1), self.COLORS['body']),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [self.COLORS['white'], self.COLORS['light_gray']]),
            ('BOX', (0, 0), (-1, -1), 1, self.COLORS['border']),
        ]))
        elements.append(meta_table)
        
        return elements

    def _add_page_decorations(
        self,
        canvas,
        doc,
        project_name: str,
        is_cover: bool = False,
    ):
        """Add headers and footers to each page."""
        canvas.saveState()
        
        page_width, page_height = letter
        
        if not is_cover:
            # Header line
            canvas.setStrokeColor(self.COLORS['border'])
            canvas.setLineWidth(0.5)
            canvas.line(
                1 * inch,
                page_height - 0.7 * inch,
                page_width - 1 * inch,
                page_height - 0.7 * inch,
            )
            
            # Header text - project name on left
            canvas.setFont('Helvetica', 8)
            canvas.setFillColor(self.COLORS['muted'])
            canvas.drawString(1 * inch, page_height - 0.6 * inch, project_name[:50])
            
            # Header text - "Trade Study Report" on right
            canvas.drawRightString(
                page_width - 1 * inch,
                page_height - 0.6 * inch,
                "Trade Study Report",
            )
        
        # Footer line
        canvas.setStrokeColor(self.COLORS['border'])
        canvas.line(1 * inch, 0.7 * inch, page_width - 1 * inch, 0.7 * inch)
        
        # Footer text
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(self.COLORS['muted'])
        
        # Page number on right
        page_num = canvas.getPageNumber()
        canvas.drawRightString(
            page_width - 1 * inch,
            0.5 * inch,
            f"Page {page_num}",
        )
        
        # TradeForm branding on left
        if not is_cover:
            canvas.drawString(1 * inch, 0.5 * inch, "Generated by TradeForm")
        
        canvas.restoreState()


# Singleton instance
_pdf_service: Optional["ProfessionalPDFService"] = None


def get_pdf_service() -> Optional["ProfessionalPDFService"]:
    """Get the PDF service singleton.
    
    Returns None if reportlab is not available, allowing graceful fallback
    to simple PDF generation.
    """
    if not REPORTLAB_AVAILABLE:
        return None
    
    global _pdf_service
    if _pdf_service is None:
        _pdf_service = ProfessionalPDFService()
    return _pdf_service

