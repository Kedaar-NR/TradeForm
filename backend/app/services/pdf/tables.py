"""
PDF table generation for trade study reports.

Provides scoring matrices, trade-off tables, and criteria weight visualizations.
"""

from typing import List, Dict, Any

from app.services.pdf.styles import REPORTLAB_AVAILABLE, PDFStyles

if REPORTLAB_AVAILABLE:
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    from reportlab.platypus import Table, TableStyle, Paragraph
    from reportlab.lib.styles import ParagraphStyle


class PDFTableBuilder:
    """Builds tables for PDF reports."""
    
    def __init__(self, pdf_styles: PDFStyles):
        """
        Initialize table builder with styles.
        
        Args:
            pdf_styles: PDFStyles instance for colors and styles
        """
        self.pdf_styles = pdf_styles
        self.colors = pdf_styles.COLORS
        self.styles = pdf_styles.styles
    
    def build_scoring_matrix(
        self,
        components_data: List[Dict[str, Any]],
        criteria: List[Dict[str, Any]],
    ) -> List[Any]:
        """
        Build comprehensive weighted scoring matrix with color-coded cells.
        
        Args:
            components_data: List of component dicts with scores
            criteria: List of criteria dicts
            
        Returns:
            List of flowable elements for the PDF
        """
        elements = []
        
        if not REPORTLAB_AVAILABLE or not components_data or not criteria:
            return elements
        
        sorted_components = sorted(components_data, key=lambda x: x.get('rank', 999))
        
        # Build header rows
        header_row_1 = ['Component']
        header_row_2 = ['(Rank)']
        for c in criteria:
            header_row_1.append(c.get('name', 'N/A')[:12])
            header_row_2.append(f"({c.get('weight', 0):.0f}%)")
        header_row_1.append('Weighted')
        header_row_2.append('Total')
        
        # Build data rows
        table_data = []
        for comp in sorted_components:
            rank = comp.get('rank', '-')
            comp_name = f"{comp.get('manufacturer', '')[:8]} {comp.get('part_number', '')[:8]}"
            row = [f"{comp_name}\n(#{rank})"]
            
            scores_dict = {}
            raw_values_dict = {}
            for s in comp.get('scores', []):
                scores_dict[s.get('criterion_name')] = s.get('score', '-')
                raw_values_dict[s.get('criterion_name')] = s.get('raw_value')
            
            for crit in criteria:
                crit_name = crit.get('name')
                score = scores_dict.get(crit_name, '-')
                raw_val = raw_values_dict.get(crit_name)
                unit = crit.get('unit', '')
                
                if score != '-':
                    cell_text = f"{score}/10"
                    if raw_val is not None:
                        if isinstance(raw_val, float):
                            cell_text += f"\n({raw_val:.2g} {unit})" if unit else f"\n({raw_val:.2g})"
                        else:
                            cell_text += f"\n({raw_val} {unit})" if unit else f"\n({raw_val})"
                    row.append(cell_text)
                else:
                    row.append('-')
            
            row.append(f"{comp.get('total_score', 0):.2f}")
            table_data.append(row)
        
        # Calculate column widths
        num_criteria = len(criteria)
        available_width = 6.5 * inch
        first_col_width = 1.3 * inch
        last_col_width = 0.7 * inch
        middle_width = available_width - first_col_width - last_col_width
        crit_col_width = middle_width / num_criteria if num_criteria > 0 else 0.8 * inch
        
        col_widths = [first_col_width] + [crit_col_width] * num_criteria + [last_col_width]
        
        # Combine headers and data
        full_table_data = [header_row_1, header_row_2] + table_data
        
        matrix_table = Table(full_table_data, colWidths=col_widths)
        
        # Build style commands
        style_commands = [
            ('BACKGROUND', (0, 0), (-1, 0), self.colors['header']),
            ('TEXTCOLOR', (0, 0), (-1, 0), self.colors['white']),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#374151')),
            ('TEXTCOLOR', (0, 1), (-1, 1), colors.HexColor('#D1D5DB')),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Oblique'),
            ('FONTSIZE', (0, 1), (-1, 1), 7),
            ('ALIGN', (0, 1), (-1, 1), 'CENTER'),
            ('FONTNAME', (0, 2), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 2), (-1, -1), 7),
            ('TEXTCOLOR', (0, 2), (-1, -1), self.colors['body']),
            ('ALIGN', (1, 2), (-1, -1), 'CENTER'),
            ('ALIGN', (0, 2), (0, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('BOX', (0, 0), (-1, -1), 1.5, self.colors['header']),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, self.colors['border']),
            ('LINEBELOW', (0, 1), (-1, 1), 1, self.colors['header']),
            ('FONTNAME', (0, 2), (-1, 2), 'Helvetica-Bold'),
            ('BACKGROUND', (-1, 2), (-1, -1), colors.HexColor('#F0F9FF')),
            ('FONTNAME', (-1, 2), (-1, -1), 'Helvetica-Bold'),
        ]
        
        # Add color-coding for score cells
        for row_idx, comp in enumerate(sorted_components):
            scores_dict = {s.get('criterion_name'): s.get('score', 0) for s in comp.get('scores', [])}
            for col_idx, crit in enumerate(criteria):
                score = scores_dict.get(crit.get('name'), 0)
                if isinstance(score, (int, float)) and score > 0:
                    cell_color = self.pdf_styles.get_score_color(score)
                    style_commands.append(
                        ('BACKGROUND', (col_idx + 1, row_idx + 2), (col_idx + 1, row_idx + 2), cell_color)
                    )
        
        matrix_table.setStyle(TableStyle(style_commands))
        
        elements.append(matrix_table)
        elements.append(Paragraph(
            "Table 1: Weighted Scoring Matrix - Scores shown as (Score/10) with raw values where available. "
            "Cell colors: Green (8-10), Yellow (6-7), Orange (4-5), Red (1-3).",
            self.styles['caption']
        ))
        
        return elements
    
    def build_tradeoff_table(
        self,
        components_data: List[Dict[str, Any]],
        criteria: List[Dict[str, Any]],
    ) -> List[Any]:
        """
        Build side-by-side trade-off comparison table for top components.
        
        Args:
            components_data: List of component dicts with scores
            criteria: List of criteria dicts
            
        Returns:
            List of flowable elements for the PDF
        """
        elements = []
        
        if not REPORTLAB_AVAILABLE or not components_data or len(components_data) < 2 or not criteria:
            return elements
        
        # Take top 3 components
        top_components = sorted(components_data, key=lambda x: x.get('rank', 999))[:3]
        
        elements.append(Paragraph("3.2 Trade-Off Comparison", self.styles['subsection_heading']))
        
        # Build header
        header = ['Criterion', 'Weight']
        for comp in top_components:
            header.append(f"{comp.get('manufacturer', '')[:10]}")
        header.append('Best')
        
        table_data = [header]
        
        for crit in criteria:
            crit_name = crit.get('name', 'N/A')
            weight = crit.get('weight', 0)
            row = [crit_name[:15], f"{weight:.0f}%"]
            
            best_score = 0
            best_comp_idx = -1
            scores_for_crit = []
            
            for idx, comp in enumerate(top_components):
                scores_dict = {s.get('criterion_name'): s.get('score', 0) for s in comp.get('scores', [])}
                score = scores_dict.get(crit_name, 0)
                scores_for_crit.append(score)
                if score > best_score:
                    best_score = score
                    best_comp_idx = idx
            
            for idx, score in enumerate(scores_for_crit):
                if idx == best_comp_idx and best_score > 0:
                    row.append(f"{score}/10 *")
                else:
                    row.append(f"{score}/10" if score > 0 else '-')
            
            if best_comp_idx >= 0:
                row.append(top_components[best_comp_idx].get('manufacturer', '')[:8])
            else:
                row.append('-')
            
            table_data.append(row)
        
        # Add totals row
        totals_row = ['TOTAL SCORE', '-']
        for comp in top_components:
            totals_row.append(f"{comp.get('total_score', 0):.2f}")
        totals_row.append(top_components[0].get('manufacturer', '')[:8] if top_components else '-')
        table_data.append(totals_row)
        
        # Calculate column widths
        num_comps = len(top_components)
        available_width = 6.5 * inch
        first_col = 1.5 * inch
        weight_col = 0.6 * inch
        best_col = 0.8 * inch
        remaining = available_width - first_col - weight_col - best_col
        comp_col = remaining / num_comps if num_comps > 0 else 1 * inch
        
        col_widths = [first_col, weight_col] + [comp_col] * num_comps + [best_col]
        
        tradeoff_table = Table(table_data, colWidths=col_widths)
        
        style_commands = [
            ('BACKGROUND', (0, 0), (-1, 0), self.colors['accent']),
            ('TEXTCOLOR', (0, 0), (-1, 0), self.colors['white']),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('TEXTCOLOR', (0, 1), (-1, -1), self.colors['body']),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#EFF6FF')),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('LINEABOVE', (0, -1), (-1, -1), 1.5, self.colors['accent']),
            ('BACKGROUND', (-1, 1), (-1, -2), colors.HexColor('#ECFDF5')),
            ('FONTNAME', (-1, 1), (-1, -1), 'Helvetica-Bold'),
            ('TEXTCOLOR', (-1, 1), (-1, -1), self.colors['success']),
            ('BOX', (0, 0), (-1, -1), 1, self.colors['border']),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, self.colors['border']),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-2, -2), [self.colors['white'], self.colors['light_gray']]),
        ]
        
        tradeoff_table.setStyle(TableStyle(style_commands))
        
        elements.append(tradeoff_table)
        elements.append(Paragraph(
            "Table 2: Trade-Off Comparison - Asterisk (*) indicates best performer per criterion.",
            self.styles['caption']
        ))
        
        return elements
    
    def build_criteria_weights_visual(self, criteria: List[Dict[str, Any]]) -> List[Any]:
        """
        Build visual representation of criteria weights using horizontal bars.
        
        Args:
            criteria: List of criteria dicts with name and weight
            
        Returns:
            List of flowable elements for the PDF
        """
        elements = []
        
        if not REPORTLAB_AVAILABLE or not criteria:
            return elements
        
        sorted_criteria = sorted(criteria, key=lambda x: x.get('weight', 0), reverse=True)
        total_weight = sum(c.get('weight', 0) for c in sorted_criteria) or 100
        
        max_bar_width = 3.5 * inch
        table_data = []
        
        for c in sorted_criteria:
            name = c.get('name', 'N/A')[:20]
            weight = c.get('weight', 0)
            pct = (weight / total_weight) * 100 if total_weight > 0 else 0
            
            bar_width = (weight / total_weight) * max_bar_width if total_weight > 0 else 0
            bar_width = max(bar_width, 0.1 * inch)
            
            # Determine bar color based on weight
            if weight >= 25:
                bar_color = self.colors['accent']
            elif weight >= 15:
                bar_color = colors.HexColor('#60A5FA')
            else:
                bar_color = colors.HexColor('#93C5FD')
            
            bar_table = Table([['']],colWidths=[bar_width], rowHeights=[14])
            bar_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), bar_color),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            
            table_data.append([name, f"{weight:.1f}%", bar_table, f"({pct:.0f}% of total)"])
        
        weights_table = Table(
            table_data,
            colWidths=[1.5 * inch, 0.7 * inch, 3.6 * inch, 1 * inch],
        )
        weights_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (-1, -1), self.colors['body']),
            ('TEXTCOLOR', (-1, 0), (-1, -1), self.colors['muted']),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('ALIGN', (-1, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [self.colors['white'], self.colors['light_gray']]),
        ]))
        
        elements.append(weights_table)
        elements.append(Paragraph(
            "Figure: Criteria Weight Distribution - Bar length proportional to weight percentage.",
            self.styles['caption']
        ))
        
        return elements

