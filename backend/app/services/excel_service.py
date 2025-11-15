"""
Excel service for import/export operations.

Handles Excel file generation and parsing for criteria, components, and results.
"""

import pandas as pd
import io
from typing import List, Dict, Any
from datetime import datetime


class ExcelService:
    """Service for Excel import/export operations."""
    
    @staticmethod
    def parse_criteria_excel(file_contents: bytes) -> List[Dict[str, Any]]:
        """
        Parse criteria from an Excel file.
        
        Args:
            file_contents: Raw bytes of Excel file
            
        Returns:
            List of criteria dictionaries
            
        Raises:
            ValueError: If required columns are missing
        """
        df = pd.read_excel(io.BytesIO(file_contents))
        
        required_columns = ['name', 'weight']
        if not all(col in df.columns for col in required_columns):
            raise ValueError(f"Excel file must contain columns: {', '.join(required_columns)}")
        
        criteria_list = []
        for _, row in df.iterrows():
            criterion_data = {
                'name': str(row['name']),
                'weight': float(row['weight']),
                'description': str(row.get('description', '')) if pd.notna(row.get('description')) else None,
                'unit': str(row.get('unit', '')) if pd.notna(row.get('unit')) else None,
                'higher_is_better': bool(row.get('higher_is_better', True)) if pd.notna(row.get('higher_is_better')) else True,
                'minimum_requirement': float(row.get('minimum_requirement')) if pd.notna(row.get('minimum_requirement')) else None,
                'maximum_requirement': float(row.get('maximum_requirement')) if pd.notna(row.get('maximum_requirement')) else None,
            }
            criteria_list.append(criterion_data)
        
        return criteria_list
    
    @staticmethod
    def export_criteria_excel(criteria: List[Any], project_name: str) -> io.BytesIO:
        """
        Export criteria to Excel file.
        
        Args:
            criteria: List of criterion model objects
            project_name: Name of project for filename
            
        Returns:
            BytesIO object with Excel file
        """
        data = []
        for criterion in criteria:
            data.append({
                'name': criterion.name,
                'description': criterion.description or '',
                'weight': criterion.weight,
                'unit': criterion.unit or '',
                'higher_is_better': criterion.higher_is_better,
                'minimum_requirement': criterion.minimum_requirement or '',
                'maximum_requirement': criterion.maximum_requirement or ''
            })
        
        df = pd.DataFrame(data)
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Criteria')
        
        output.seek(0)
        return output
    
    @staticmethod
    def parse_components_excel(file_contents: bytes) -> List[Dict[str, Any]]:
        """
        Parse components from an Excel file.
        
        Args:
            file_contents: Raw bytes of Excel file
            
        Returns:
            List of component dictionaries
            
        Raises:
            ValueError: If required columns are missing
        """
        df = pd.read_excel(io.BytesIO(file_contents))
        
        required_columns = ['manufacturer', 'part_number']
        if not all(col in df.columns for col in required_columns):
            raise ValueError(f"Excel file must contain columns: {', '.join(required_columns)}")
        
        components_list = []
        for _, row in df.iterrows():
            component_data = {
                'manufacturer': str(row['manufacturer']),
                'part_number': str(row['part_number']),
                'description': str(row.get('description', '')) if pd.notna(row.get('description')) else None,
                'datasheet_url': str(row.get('datasheet_url', '')) if pd.notna(row.get('datasheet_url')) else None,
                'availability': row.get('availability', 'in_stock') if pd.notna(row.get('availability')) else 'in_stock',
            }
            components_list.append(component_data)
        
        return components_list
    
    @staticmethod
    def export_components_excel(components: List[Any], project_name: str) -> io.BytesIO:
        """
        Export components to Excel file.
        
        Args:
            components: List of component model objects
            project_name: Name of project for filename
            
        Returns:
            BytesIO object with Excel file
        """
        data = []
        for component in components:
            data.append({
                'manufacturer': component.manufacturer,
                'part_number': component.part_number,
                'description': component.description or '',
                'datasheet_url': component.datasheet_url or '',
                'availability': component.availability.value,
                'source': component.source.value
            })
        
        df = pd.DataFrame(data)
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Components')
        
        output.seek(0)
        return output
    
    @staticmethod
    def export_full_trade_study(
        project: Any,
        components: List[Any],
        criteria: List[Any],
        results: List[Dict[str, Any]]
    ) -> io.BytesIO:
        """
        Export complete trade study to multi-sheet Excel file.
        
        Args:
            project: Project model object
            components: List of component model objects
            criteria: List of criterion model objects
            results: List of result dictionaries with scores
            
        Returns:
            BytesIO object with multi-sheet Excel file
        """
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            # Sheet 1: Project Summary
            summary_data = {
                'Field': ['Project Name', 'Component Type', 'Description', 'Status', 'Created Date', 'Total Components', 'Total Criteria'],
                'Value': [
                    project.name,
                    project.component_type,
                    project.description or '',
                    project.status.value,
                    project.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    len(components),
                    len(criteria)
                ]
            }
            df_summary = pd.DataFrame(summary_data)
            df_summary.to_excel(writer, sheet_name='Summary', index=False)
            
            # Sheet 2: Criteria
            if criteria:
                criteria_data = [
                    {
                        'Name': c.name,
                        'Description': c.description or '',
                        'Weight': c.weight,
                        'Unit': c.unit or '',
                        'Higher is Better': c.higher_is_better,
                        'Min Requirement': c.minimum_requirement or '',
                        'Max Requirement': c.maximum_requirement or ''
                    }
                    for c in criteria
                ]
                df_criteria = pd.DataFrame(criteria_data)
                df_criteria.to_excel(writer, sheet_name='Criteria', index=False)
            
            # Sheet 3: Components
            if components:
                components_data = [
                    {
                        'Manufacturer': c.manufacturer,
                        'Part Number': c.part_number,
                        'Description': c.description or '',
                        'Datasheet URL': c.datasheet_url or '',
                        'Availability': c.availability.value,
                        'Source': c.source.value
                    }
                    for c in components
                ]
                df_components = pd.DataFrame(components_data)
                df_components.to_excel(writer, sheet_name='Components', index=False)
            
            # Sheet 4: Detailed Scores Matrix
            if components and criteria and results:
                scores_matrix = []
                for result in results:
                    component = result["component"]
                    row_data = {
                        'Manufacturer': component.manufacturer,
                        'Part Number': component.part_number
                    }
                    
                    for criterion in criteria:
                        score = result["scores"].get(criterion.id)
                        row_data[f'{criterion.name} (Score)'] = score.score if score else 'N/A'
                        row_data[f'{criterion.name} (Rationale)'] = score.rationale if score and score.rationale else ''
                        if score and score.raw_value:
                            row_data[f'{criterion.name} (Raw Value)'] = score.raw_value
                    
                    row_data['Total Weighted Score'] = result["total_score"]
                    scores_matrix.append(row_data)
                
                if scores_matrix:
                    df_scores = pd.DataFrame(scores_matrix)
                    df_scores.to_excel(writer, sheet_name='Detailed Scores', index=False)
            
            # Sheet 5: Results Ranking
            if results:
                ranking_data = [
                    {
                        'Rank': rank,
                        'Manufacturer': result["component"].manufacturer,
                        'Part Number': result["component"].part_number,
                        'Total Weighted Score': result["total_score"],
                        'Availability': result["component"].availability.value
                    }
                    for rank, result in enumerate(results, 1)
                ]
                
                if ranking_data:
                    df_ranking = pd.DataFrame(ranking_data)
                    df_ranking.to_excel(writer, sheet_name='Rankings', index=False)
        
        output.seek(0)
        return output


# Singleton instance
_excel_service = ExcelService()


def get_excel_service() -> ExcelService:
    """Get the Excel service singleton."""
    return _excel_service

