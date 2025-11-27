"""
PDF section builders for trade study reports.

Provides builders for cover page, ToC, executive summary, methodology,
component analysis, conclusion, references, and appendix sections.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

from app.services.pdf.styles import REPORTLAB_AVAILABLE, PDFStyles
from app.services.pdf.tables import PDFTableBuilder
from app.services.pdf.charts import PDFChartBuilder

if REPORTLAB_AVAILABLE:
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.platypus import (
        Paragraph, Spacer, Table, TableStyle, HRFlowable
    )


class PDFSectionBuilder:
    """Builds report sections for PDF generation."""
    
    def __init__(self, pdf_styles: PDFStyles):
        """
        Initialize section builder with styles.
        
        Args:
            pdf_styles: PDFStyles instance for colors and styles
        """
        self.pdf_styles = pdf_styles
        self.colors = pdf_styles.COLORS
        self.styles = pdf_styles.styles
        self.table_builder = PDFTableBuilder(pdf_styles)
        self.chart_builder = PDFChartBuilder(pdf_styles)
        self.citation_counter = 0
        self.citations: List[Dict[str, Any]] = []
    
    def reset_citations(self) -> None:
        """Reset citation tracking for a new report."""
        self.citations = []
        self.citation_counter = 0
    
    def create_section_header(self, title: str, level: int = 1) -> List[Any]:
        """Create a styled section header with background."""
        elements = []
        
        if not REPORTLAB_AVAILABLE:
            return elements
        
        if level == 1:
            header_table = Table(
                [[Paragraph(title, self.styles['section_heading'])]],
                colWidths=[6.5 * inch],
                rowHeights=[36],
            )
            header_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), self.colors['header']),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (0, 0), (-1, -1), 15),
                ('RIGHTPADDING', (0, 0), (-1, -1), 15),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ]))
            elements.append(header_table)
            elements.append(Spacer(1, 0.15 * inch))
        else:
            subsection_style = ParagraphStyle(
                name=f'SubsectionStyled_{title[:10]}',
                parent=self.styles['subsection_heading'],
                borderColor=self.colors['accent'],
                borderWidth=3,
                borderPadding=8,
                leftIndent=12,
            )
            elements.append(Paragraph(title, subsection_style))
        
        return elements
    
    def build_cover_page(
        self,
        project_name: str,
        component_type: str,
        description: Optional[str],
    ) -> List[Any]:
        """Build the cover page."""
        elements = []
        
        if not REPORTLAB_AVAILABLE:
            return elements
        
        elements.append(Spacer(1, 2 * inch))
        elements.append(Paragraph(f"{project_name}", self.styles['cover_title']))
        elements.append(Spacer(1, 0.3 * inch))
        elements.append(Paragraph("Trade Study Report", self.styles['cover_subtitle']))
        elements.append(Spacer(1, 0.5 * inch))
        
        elements.append(HRFlowable(
            width="60%", thickness=2, color=self.colors['accent'],
            spaceBefore=10, spaceAfter=30, hAlign='CENTER',
        ))
        
        cover_category_style = ParagraphStyle(
            name='CoverCategory', parent=self.styles['body'],
            fontSize=12, alignment=TA_CENTER, textColor=self.colors['body'],
        )
        elements.append(Paragraph(f"<b>Component Category:</b> {component_type}", cover_category_style))
        
        if description:
            cover_desc_style = ParagraphStyle(
                name='CoverDesc', parent=self.styles['body'],
                fontSize=10, alignment=TA_CENTER, textColor=self.colors['muted'],
            )
            desc_text = description[:300] + ('...' if len(description) > 300 else '')
            elements.append(Spacer(1, 0.3 * inch))
            elements.append(Paragraph(desc_text, cover_desc_style))
        
        elements.append(Spacer(1, 2.5 * inch))
        
        cover_date_style = ParagraphStyle(
            name='CoverDate', parent=self.styles['body'],
            fontSize=11, alignment=TA_CENTER, textColor=self.colors['muted'],
        )
        elements.append(Paragraph(datetime.now().strftime("%B %d, %Y"), cover_date_style))
        
        elements.append(Spacer(1, 0.5 * inch))
        
        cover_brand_style = ParagraphStyle(
            name='CoverBrand', parent=self.styles['body'],
            fontSize=10, alignment=TA_CENTER, textColor=self.colors['accent'],
            fontName='Helvetica-Bold',
        )
        elements.append(Paragraph("Prepared by TradeForm", cover_brand_style))
        
        return elements
    
    def build_table_of_contents(self) -> List[Any]:
        """Build table of contents page."""
        elements = []
        
        if not REPORTLAB_AVAILABLE:
            return elements
        
        elements.append(Paragraph("Table of Contents", self.styles['toc_heading']))
        elements.append(Spacer(1, 0.3 * inch))
        
        toc_entries = [
            ("1. Executive Summary", 3),
            ("2. Methodology", 4),
            ("    2.1 Evaluation Criteria", 4),
            ("    2.2 Criteria Weights Visualization", 4),
            ("    2.3 Scoring Methodology", 5),
            ("3. Component Analysis", 6),
            ("    3.1 Weighted Scoring Matrix", 6),
            ("    3.2 Trade-Off Comparison", 6),
            ("    3.3 Rankings Summary", 7),
            ("    3.4 Detailed Evaluations", 7),
            ("4. Visual Analysis", 8),
            ("    4.1 Score Comparison Chart", 8),
            ("    4.2 Criteria Radar Chart", 8),
            ("5. Conclusion & Recommendation", 9),
            ("6. References & Notes", 10),
            ("7. Appendix", 11),
            ("    7.1 Raw Data Matrix", 11),
            ("    7.2 Project Metadata", 11),
        ]
        
        for entry, page in toc_entries:
            indent = 20 if entry.startswith("    ") else 0
            entry_text = entry.strip()
            elements.append(Paragraph(
                f'<font name="Helvetica">{entry_text}</font>'
                f'<font name="Helvetica" color="#9CA3AF"> {"." * (50 - len(entry_text))} </font>'
                f'<font name="Helvetica">{page}</font>',
                ParagraphStyle(name=f'TOC_{entry_text[:10]}', parent=self.styles['toc_entry'], leftIndent=indent)
            ))
        
        return elements
    
    def build_executive_summary(
        self,
        project_name: str,
        components_data: List[Dict[str, Any]],
        criteria: List[Dict[str, Any]],
        ai_sections: Optional[Dict[str, str]] = None,
    ) -> List[Any]:
        """Build executive summary section."""
        elements = []
        
        if not REPORTLAB_AVAILABLE:
            return elements
        
        elements.extend(self.create_section_header("1. Executive Summary"))
        
        sorted_components = sorted(components_data, key=lambda x: x.get('rank', 999))
        top_component = sorted_components[0] if sorted_components else None
        
        ai_summary = (ai_sections or {}).get('executive_summary', '')
        if ai_summary and len(ai_summary) > 50:
            for para in ai_summary.split('\n\n'):
                if para.strip():
                    elements.append(Paragraph(para.strip(), self.styles['body']))
            elements.append(Spacer(1, 0.15 * inch))
        else:
            num_components = len(components_data)
            num_criteria = len(criteria)
            summary_text = (
                f"This trade study evaluates <b>{num_components}</b> candidate components "
                f"against <b>{num_criteria}</b> weighted criteria to identify the optimal "
                f"solution for the {project_name} project."
            )
            elements.append(Paragraph(summary_text, self.styles['body']))
        
        if top_component:
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
                        ParagraphStyle(name='RecScore', parent=self.styles['body'],
                            alignment=TA_RIGHT, fontName='Helvetica-Bold', textColor=self.colors['success'])
                    ),
                ]],
                colWidths=[4.5 * inch, 1.5 * inch],
            )
            rec_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#EFF6FF')),
                ('BOX', (0, 0), (-1, -1), 1, self.colors['accent']),
                ('LEFTPADDING', (0, 0), (-1, -1), 15),
                ('RIGHTPADDING', (0, 0), (-1, -1), 15),
                ('TOPPADDING', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            elements.append(rec_table)
        
        elements.append(Spacer(1, 0.3 * inch))
        elements.append(Paragraph("Key Findings:", self.styles['subsection_heading']))
        
        findings = []
        if top_component:
            findings.append(
                f"The {top_component.get('manufacturer', '')} {top_component.get('part_number', '')} "
                f"achieves the highest weighted score of {top_component.get('total_score', 0):.2f}."
            )
        if len(sorted_components) >= 2 and top_component:
            runner_up = sorted_components[1]
            score_diff = top_component.get('total_score', 0) - runner_up.get('total_score', 0)
            findings.append(f"Score differential of {score_diff:.2f} points separates the top two candidates.")
        if criteria:
            top_criterion = max(criteria, key=lambda x: x.get('weight', 0))
            findings.append(
                f"'{top_criterion.get('name', 'N/A')}' carries the highest weight "
                f"({top_criterion.get('weight', 0):.1f}%) in the evaluation."
            )
        
        for finding in findings:
            elements.append(Paragraph(f"• {finding}", self.styles['body']))
        
        return elements
    
    def build_methodology_section(
        self,
        criteria: List[Dict[str, Any]],
        ai_sections: Optional[Dict[str, str]] = None,
    ) -> List[Any]:
        """Build methodology section with criteria and scoring explanation."""
        elements = []
        
        if not REPORTLAB_AVAILABLE:
            return elements
        
        elements.extend(self.create_section_header("2. Methodology"))
        
        ai_methodology = (ai_sections or {}).get('methodology', '')
        if ai_methodology and len(ai_methodology) > 50:
            for para in ai_methodology.split('\n\n')[:2]:
                if para.strip():
                    elements.append(Paragraph(para.strip(), self.styles['body']))
            elements.append(Spacer(1, 0.15 * inch))
        else:
            elements.append(Paragraph(
                "This trade study employs a weighted multi-criteria decision analysis (MCDA) "
                "approach to systematically evaluate candidate components.",
                self.styles['body']
            ))
        
        elements.append(Spacer(1, 0.2 * inch))
        elements.append(Paragraph("2.1 Evaluation Criteria", self.styles['subsection_heading']))
        
        if criteria:
            table_data = [['Criterion', 'Weight', 'Unit', 'Description']]
            sorted_criteria = sorted(criteria, key=lambda x: x.get('weight', 0), reverse=True)
            
            for c in sorted_criteria:
                desc = c.get('description', '') or ''
                table_data.append([
                    c.get('name', 'N/A'),
                    f"{c.get('weight', 0):.1f}%",
                    c.get('unit', '-') or '-',
                    (desc[:50] + '...') if len(desc) > 50 else desc or '-',
                ])
            
            criteria_table = Table(table_data, colWidths=[1.5*inch, 0.8*inch, 0.8*inch, 3*inch])
            criteria_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), self.colors['header']),
                ('TEXTCOLOR', (0, 0), (-1, 0), self.colors['white']),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('TOPPADDING', (0, 0), (-1, 0), 10),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('TEXTCOLOR', (0, 1), (-1, -1), self.colors['body']),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
                ('TOPPADDING', (0, 1), (-1, -1), 8),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [self.colors['white'], self.colors['light_gray']]),
                ('BOX', (0, 0), (-1, -1), 1, self.colors['border']),
                ('LINEBELOW', (0, 0), (-1, 0), 1, self.colors['border']),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (1, 0), (2, -1), 'CENTER'),
            ]))
            elements.append(criteria_table)
        
        elements.append(Spacer(1, 0.3 * inch))
        elements.append(Paragraph("2.2 Criteria Weights Visualization", self.styles['subsection_heading']))
        elements.extend(self.table_builder.build_criteria_weights_visual(criteria))
        
        elements.append(Spacer(1, 0.3 * inch))
        elements.append(Paragraph("2.3 Scoring Methodology", self.styles['subsection_heading']))
        elements.append(Paragraph("Components are evaluated on a 1-10 scale:", self.styles['body']))
        
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
                ParagraphStyle(name=f'Score_{score_range}', parent=self.styles['body'], leftIndent=20, fontSize=10)
            ))
        
        return elements
    
    def build_charts_section(
        self,
        components_data: List[Dict[str, Any]],
        criteria: List[Dict[str, Any]],
    ) -> List[Any]:
        """Build visual analysis section with charts."""
        import logging
        elements = []
        
        if not REPORTLAB_AVAILABLE:
            return elements
        
        elements.extend(self.create_section_header("4. Visual Analysis"))
        elements.append(Paragraph("4.1 Score Comparison Chart", self.styles['subsection_heading']))
        
        if components_data:
            try:
                bar_chart = self.chart_builder.create_bar_chart(components_data)
                if bar_chart:
                    elements.append(bar_chart)
                    elements.append(Paragraph("Figure 1: Weighted total scores by component", self.styles['caption']))
            except Exception as e:
                logging.warning(f"Failed to create bar chart: {e}")
                elements.append(Paragraph("Chart unavailable - see scoring table.", self.styles['body']))
        
        elements.append(Spacer(1, 0.4 * inch))
        elements.append(Paragraph("4.2 Criteria Performance Radar", self.styles['subsection_heading']))
        
        if components_data and criteria:
            try:
                spider_chart = self.chart_builder.create_spider_chart(components_data, criteria)
                if spider_chart:
                    elements.append(spider_chart)
                    elements.append(Paragraph("Figure 2: Criteria scores comparison", self.styles['caption']))
            except Exception as e:
                logging.warning(f"Failed to create spider chart: {e}")
                elements.append(Paragraph("Chart unavailable - see detailed evaluations.", self.styles['body']))
        
        return elements
    
    def build_conclusion(
        self,
        components_data: List[Dict[str, Any]],
        project_name: str,
    ) -> List[Any]:
        """Build conclusion and recommendation section."""
        elements = []
        
        if not REPORTLAB_AVAILABLE:
            return elements
        
        elements.extend(self.create_section_header("5. Conclusion & Recommendation"))
        
        sorted_components = sorted(components_data, key=lambda x: x.get('rank', 999))
        
        if sorted_components:
            winner = sorted_components[0]
            elements.append(Paragraph("Final Rankings:", self.styles['subsection_heading']))
            
            for comp in sorted_components:
                rank = comp.get('rank', '-')
                name = f"{comp.get('manufacturer', 'N/A')} {comp.get('part_number', '')}"
                score = comp.get('total_score', 0)
                prefix = "(1st)" if rank == 1 else "(2nd)" if rank == 2 else "(3rd)" if rank == 3 else f"#{rank}"
                
                elements.append(Paragraph(
                    f"<b>{prefix}</b> {name} - Score: {score:.2f}",
                    ParagraphStyle(name=f'Rank_{rank}', parent=self.styles['body'], leftIndent=10,
                        fontName='Helvetica-Bold' if rank == 1 else 'Helvetica')
                ))
            
            elements.append(Spacer(1, 0.3 * inch))
            elements.append(Paragraph("Recommendation:", self.styles['subsection_heading']))
            
            rec_content = Paragraph(
                f"Based on the weighted multi-criteria analysis, "
                f"<b>{winner.get('manufacturer', 'N/A')} {winner.get('part_number', '')}</b> "
                f"is recommended as the optimal solution. "
                f"Score: <b>{winner.get('total_score', 0):.2f}</b>.",
                ParagraphStyle(name='RecText', parent=self.styles['body'], textColor=self.colors['header'])
            )
            
            rec_box = Table([[rec_content]], colWidths=[6 * inch])
            rec_box.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F0FDF4')),
                ('BOX', (0, 0), (-1, -1), 2, self.colors['success']),
                ('LEFTPADDING', (0, 0), (-1, -1), 15),
                ('RIGHTPADDING', (0, 0), (-1, -1), 15),
                ('TOPPADDING', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ]))
            elements.append(rec_box)
        
        return elements
    
    def build_appendix(
        self,
        components_data: List[Dict[str, Any]],
        criteria: List[Dict[str, Any]],
        project_name: str,
    ) -> List[Any]:
        """Build appendix with raw data and metadata."""
        elements = []
        
        if not REPORTLAB_AVAILABLE:
            return elements
        
        elements.extend(self.create_section_header("7. Appendix"))
        elements.append(Paragraph("7.1 Raw Data Matrix", self.styles['subsection_heading']))
        
        if components_data and criteria:
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
            
            num_cols = len(header)
            first_col_width = 1.2 * inch
            other_col_width = (6 * inch - first_col_width) / (num_cols - 1)
            col_widths = [first_col_width] + [other_col_width] * (num_cols - 1)
            
            matrix_table = Table(table_data, colWidths=col_widths)
            matrix_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), self.colors['header']),
                ('TEXTCOLOR', (0, 0), (-1, 0), self.colors['white']),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 7),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [self.colors['white'], self.colors['light_gray']]),
                ('BOX', (0, 0), (-1, -1), 1, self.colors['border']),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, self.colors['border']),
                ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            elements.append(matrix_table)
        
        elements.append(Spacer(1, 0.3 * inch))
        elements.append(Paragraph("7.2 Project Metadata", self.styles['subsection_heading']))
        
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
            ('TEXTCOLOR', (0, 0), (-1, -1), self.colors['body']),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [self.colors['white'], self.colors['light_gray']]),
            ('BOX', (0, 0), (-1, -1), 1, self.colors['border']),
        ]))
        elements.append(meta_table)
        
        return elements



