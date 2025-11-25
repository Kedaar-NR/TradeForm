"""
PDF chart generation for trade study reports.

Provides bar charts and spider/radar charts for visual analysis.
"""

from typing import List, Dict, Any, Optional
import logging

from app.services.pdf.styles import REPORTLAB_AVAILABLE, PDFStyles

if REPORTLAB_AVAILABLE:
    from reportlab.lib import colors
    from reportlab.graphics.shapes import Drawing, String, Rect
    from reportlab.graphics.charts.barcharts import VerticalBarChart
    from reportlab.graphics.charts.spider import SpiderChart


class PDFChartBuilder:
    """Builds charts for PDF reports."""
    
    def __init__(self, pdf_styles: PDFStyles):
        """
        Initialize chart builder with styles.
        
        Args:
            pdf_styles: PDFStyles instance for colors
        """
        self.styles = pdf_styles
        self.colors = pdf_styles.COLORS
    
    def create_bar_chart(
        self,
        components_data: List[Dict[str, Any]],
        max_components: int = 8
    ) -> Optional["Drawing"]:
        """
        Create a bar chart comparing component scores.
        
        Args:
            components_data: List of component dicts with total_score and manufacturer
            max_components: Maximum number of components to show
            
        Returns:
            Drawing object with bar chart, or None if no data
        """
        if not REPORTLAB_AVAILABLE or not components_data:
            return None
        
        sorted_components = sorted(
            components_data,
            key=lambda x: x.get('rank', 999)
        )[:max_components]
        
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
        bc.bars[0].fillColor = self.colors['accent']
        bc.barWidth = 20
        bc.groupSpacing = 10
        
        drawing.add(bc)
        
        return drawing
    
    def create_spider_chart(
        self,
        components_data: List[Dict[str, Any]],
        criteria: List[Dict[str, Any]],
        max_components: int = 3
    ) -> Optional["Drawing"]:
        """
        Create a spider/radar chart comparing criteria scores.
        
        Args:
            components_data: List of component dicts with scores
            criteria: List of criteria dicts
            max_components: Maximum number of components to compare
            
        Returns:
            Drawing object with spider chart, or None if insufficient data
        """
        if not REPORTLAB_AVAILABLE or not components_data or not criteria:
            return None
        
        # Take top components for comparison
        top_components = sorted(
            components_data,
            key=lambda x: x.get('rank', 999)
        )[:max_components]
        
        drawing = Drawing(400, 250)
        
        # Build data matrix
        data = []
        criteria_names = [
            c.get('name', f'C{i+1}')[:15]
            for i, c in enumerate(criteria)
        ]
        
        for comp in top_components:
            comp_scores = []
            scores_dict = {
                s.get('criterion_name'): s.get('score', 5)
                for s in comp.get('scores', [])
            }
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
            self.colors['accent'],
            self.colors['success'],
            self.colors['warning'],
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
            legend_color = chart_colors[i] if i < len(chart_colors) else self.colors['muted']
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
            label.fillColor = self.colors['body']
            drawing.add(label)
        
        return drawing


