"""
Professional PDF Report Service for Trade Study Reports.

Generates industry-grade technical reports with cover pages, ToC, charts,
tables, and proper typography following engineering documentation standards.

This module orchestrates PDF generation using sub-modules:
- pdf/styles.py - Color palette and paragraph styles
- pdf/charts.py - Bar and spider chart generation
- pdf/tables.py - Scoring matrix and trade-off tables
- pdf/sections.py - Section builders (cover, ToC, executive summary, etc.)
"""

import io
from datetime import datetime
from typing import List, Dict, Any, Optional

from app.services.pdf.styles import REPORTLAB_AVAILABLE, PDFStyles
from app.services.pdf.sections import PDFSectionBuilder
from app.services.pdf.tables import PDFTableBuilder

if REPORTLAB_AVAILABLE:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, PageBreak, Spacer, Paragraph
    from reportlab.lib.styles import ParagraphStyle


class ProfessionalPDFService:
    """Service for generating professional trade study PDF reports."""
    
    def __init__(self):
        """Initialize service with styles and section builder."""
        self.pdf_styles = PDFStyles()
        self.section_builder = PDFSectionBuilder(self.pdf_styles)
        self.table_builder = PDFTableBuilder(self.pdf_styles)
    
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
        
        # Reset citation tracking
        self.section_builder.reset_citations()
        
        # Parse AI-generated report into sections
        ai_sections = self._parse_ai_report_sections(report_text)
        
        story = []
        
        # Build report sections
        story.extend(self.section_builder.build_cover_page(project_name, component_type, project_description))
        story.append(PageBreak())
        
        story.extend(self.section_builder.build_table_of_contents())
        story.append(PageBreak())
        
        story.extend(self.section_builder.build_executive_summary(
            project_name, components_data, criteria, ai_sections))
        story.append(PageBreak())
        
        story.extend(self.section_builder.build_methodology_section(criteria, ai_sections))
        story.append(PageBreak())
        
        story.extend(self._build_component_analysis(components_data, criteria, ai_sections))
        story.append(PageBreak())
        
        story.extend(self.section_builder.build_charts_section(components_data, criteria))
        story.append(PageBreak())
        
        story.extend(self.section_builder.build_conclusion(components_data, project_name))
        story.append(PageBreak())
        
        story.extend(self._build_references_section(components_data))
        story.append(PageBreak())
        
        story.extend(self.section_builder.build_appendix(components_data, criteria, project_name))
        
        # Build with page decorations
        doc.build(
            story,
            onFirstPage=lambda canvas, doc: self._add_page_decorations(canvas, doc, project_name, is_cover=True),
            onLaterPages=lambda canvas, doc: self._add_page_decorations(canvas, doc, project_name, is_cover=False),
        )
        
        buffer.seek(0)
        return buffer
    
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
            
            is_header = False
            if line_lower.startswith('#') or (len(line_lower) < 60 and ':' not in line_lower):
                for keyword, section_name in section_keywords.items():
                    if keyword in line_lower:
                        if section_content:
                            sections[current_section] = '\n'.join(section_content).strip()
                        current_section = section_name
                        section_content = []
                        is_header = True
                        break
            
            if not is_header and line.strip():
                clean_line = line.strip().lstrip('#').strip()
                clean_line = clean_line.replace('**', '').replace('__', '')
                if clean_line:
                    section_content.append(clean_line)
        
        if section_content:
            sections[current_section] = '\n'.join(section_content).strip()
        
        return sections
    
    def _build_component_analysis(
        self,
        components_data: List[Dict[str, Any]],
        criteria: List[Dict[str, Any]],
        ai_sections: Optional[Dict[str, str]] = None,
    ) -> List[Any]:
        """Build component analysis section."""
        elements = []
        
        if not REPORTLAB_AVAILABLE:
            return elements
        
        elements.extend(self.section_builder.create_section_header("3. Component Analysis"))
        
        # AI analysis intro if available
        ai_analysis = (ai_sections or {}).get('analysis', '')
        if ai_analysis and len(ai_analysis) > 100:
            intro_para = ai_analysis.split('\n\n')[0] if '\n\n' in ai_analysis else ai_analysis[:300]
            if intro_para.strip():
                elements.append(Paragraph(intro_para.strip()[:400], self.pdf_styles.styles['body']))
                elements.append(Spacer(1, 0.15 * inch))
        
        # Scoring matrix
        elements.append(Paragraph("3.1 Weighted Scoring Matrix", self.pdf_styles.styles['subsection_heading']))
        elements.extend(self.table_builder.build_scoring_matrix(components_data, criteria))
        elements.append(Spacer(1, 0.3 * inch))
        
        # Trade-off comparison
        elements.extend(self.table_builder.build_tradeoff_table(components_data, criteria))
        elements.append(Spacer(1, 0.3 * inch))
        
        # Rankings summary
        elements.append(Paragraph("3.3 Rankings Summary", self.pdf_styles.styles['subsection_heading']))
        elements.extend(self._build_rankings_summary(components_data))
        
        return elements
    
    def _build_rankings_summary(self, components_data: List[Dict[str, Any]]) -> List[Any]:
        """Build rankings summary table."""
        elements = []
        
        if not REPORTLAB_AVAILABLE or not components_data:
            return elements
        
        from reportlab.platypus import Table, TableStyle
        from reportlab.lib import colors
        
        sorted_components = sorted(components_data, key=lambda x: x.get('rank', 999))
        
        header = ['Rank', 'Component', 'Score']
        table_data = [header]
        
        for comp in sorted_components:
            table_data.append([
                f"#{comp.get('rank', '-')}",
                f"{comp.get('manufacturer', 'N/A')} {comp.get('part_number', '')}",
                f"{comp.get('total_score', 0):.2f}",
            ])
        
        summary_table = Table(table_data, colWidths=[0.7 * inch, 4 * inch, 1 * inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.pdf_styles.COLORS['accent']),
            ('TEXTCOLOR', (0, 0), (-1, 0), self.pdf_styles.COLORS['white']),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('TOPPADDING', (0, 0), (-1, 0), 10),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('TEXTCOLOR', (0, 1), (-1, -1), self.pdf_styles.COLORS['body']),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#ECFDF5')),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            ('ROWBACKGROUNDS', (0, 2), (-1, -1), [self.pdf_styles.COLORS['white'], self.pdf_styles.COLORS['light_gray']]),
            ('BOX', (0, 0), (-1, -1), 1, self.pdf_styles.COLORS['border']),
            ('LINEBELOW', (0, 0), (-1, 0), 1, self.pdf_styles.COLORS['border']),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (2, 0), (2, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(summary_table)
        
        return elements
    
    def _build_references_section(self, components_data: List[Dict[str, Any]]) -> List[Any]:
        """Build references section with data sources."""
        elements = []
        
        if not REPORTLAB_AVAILABLE:
            return elements
        
        elements.extend(self.section_builder.create_section_header("6. References & Notes"))
        
        elements.append(Paragraph(
            "This section documents the technical justifications and source data supporting "
            "the scoring decisions in this trade study.",
            self.pdf_styles.styles['body']
        ))
        elements.append(Spacer(1, 0.2 * inch))
        
        # Data Sources
        elements.append(Paragraph("Data Sources:", self.pdf_styles.styles['subsection_heading']))
        
        source_entries = []
        source_num = 1
        for comp in components_data:
            manufacturer = comp.get('manufacturer', '')
            part_number = comp.get('part_number', '')
            desc = comp.get('description', '')
            
            if desc or (manufacturer and part_number):
                source_entry = (
                    f"<b>[S{source_num}]</b> {manufacturer or 'Unknown'}, "
                    f"\"<i>{part_number or 'N/A'} Technical Datasheet</i>,\" "
                    f"Manufacturer Documentation. "
                )
                if desc:
                    source_entry += f"Summary: {desc[:80]}{'...' if len(desc) > 80 else ''}"
                source_entries.append((source_num, source_entry))
                source_num += 1
        
        if source_entries:
            elements.append(Paragraph(
                "Component specifications obtained from the following sources:",
                self.pdf_styles.styles['body']
            ))
            elements.append(Spacer(1, 0.1 * inch))
            
            for num, entry in source_entries:
                elements.append(Paragraph(
                    entry,
                    ParagraphStyle(name=f'Source_{num}', parent=self.pdf_styles.styles['body'],
                        fontSize=9, leftIndent=10, spaceBefore=2, spaceAfter=4)
                ))
        else:
            elements.append(Paragraph(
                "Component data sourced from manufacturer datasheets and technical specifications.",
                self.pdf_styles.styles['body']
            ))
        
        return elements
    
    def _add_page_decorations(self, canvas, doc, project_name: str, is_cover: bool = False):
        """Add headers and footers to each page."""
        canvas.saveState()
        
        page_width, page_height = letter
        
        if not is_cover:
            # Header line
            canvas.setStrokeColor(self.pdf_styles.COLORS['border'])
            canvas.setLineWidth(0.5)
            canvas.line(1 * inch, page_height - 0.7 * inch, page_width - 1 * inch, page_height - 0.7 * inch)
            
            # Header text
            canvas.setFont('Helvetica', 8)
            canvas.setFillColor(self.pdf_styles.COLORS['muted'])
            canvas.drawString(1 * inch, page_height - 0.6 * inch, project_name[:50])
            canvas.drawRightString(page_width - 1 * inch, page_height - 0.6 * inch, "Trade Study Report")
        
        # Footer line
        canvas.setStrokeColor(self.pdf_styles.COLORS['border'])
        canvas.line(1 * inch, 0.7 * inch, page_width - 1 * inch, 0.7 * inch)
        
        # Footer text
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(self.pdf_styles.COLORS['muted'])
        
        page_num = canvas.getPageNumber()
        canvas.drawRightString(page_width - 1 * inch, 0.5 * inch, f"Page {page_num}")
        
        if not is_cover:
            canvas.drawString(1 * inch, 0.5 * inch, "Generated by TradeForm")
        
        canvas.restoreState()


# Singleton instance
_pdf_service: Optional["ProfessionalPDFService"] = None


def get_pdf_service() -> Optional["ProfessionalPDFService"]:
    """Get the PDF service singleton.
    
    Returns None if reportlab is not available.
    """
    if not REPORTLAB_AVAILABLE:
        return None
    
    global _pdf_service
    if _pdf_service is None:
        _pdf_service = ProfessionalPDFService()
    return _pdf_service
