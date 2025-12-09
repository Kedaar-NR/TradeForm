"""CAD file analysis endpoints using AI."""

from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session
import pandas as pd
import io
import os
import logging
from typing import List, Dict, Any
import json
from pydantic import BaseModel

from app.database import get_db
from app.services.ai_service import get_ai_service

router = APIRouter(tags=["cad"])
logger = logging.getLogger(__name__)


class ComponentTiming(BaseModel):
    """Component timing estimation"""
    id: str
    name: str
    description: str | None = None
    quantity: int
    leadTimeDays: float
    buildTimeDays: float
    totalDays: float


class CADAnalysisResponse(BaseModel):
    """CAD analysis result"""
    components: List[ComponentTiming]
    summary: Dict[str, Any]


def parse_excel_or_csv(file_content: bytes, filename: str) -> pd.DataFrame:
    """Parse Excel or CSV file into DataFrame"""
    try:
        if filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(file_content))
        elif filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(file_content))
        else:
            raise ValueError(f"Unsupported file type: {filename}")

        return df
    except Exception as e:
        logger.error(f"Failed to parse file {filename}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Could not parse file: {str(e)}")


def analyze_with_ai(df: pd.DataFrame) -> List[ComponentTiming]:
    """Use AI to analyze components and estimate timing"""
    ai_service = get_ai_service()

    # Convert DataFrame to a readable format for AI
    data_summary = f"""
Analyze this CAD component data and provide accurate procurement lead time and build time estimates for each component.

Data columns: {', '.join(df.columns.tolist())}
Number of rows: {len(df)}

Sample data (first 5 rows):
{df.head(5).to_string()}

For each component, estimate:
1. Lead time (procurement time in days) - Consider component complexity, availability, supplier lead times
2. Build/fabrication time (in days) - Consider manufacturing complexity, assembly requirements

Return a JSON array with this exact structure for each row:
[
  {{
    "name": "component name from data",
    "description": "brief description if available",
    "quantity": quantity as number,
    "leadTimeDays": estimated lead time as number,
    "buildTimeDays": estimated build time as number,
    "reasoning": "brief reasoning for the estimate"
  }}
]

Be realistic with estimates. Standard components: 3-7 days lead, 1-2 days build.
Complex/custom components: 14-30 days lead, 3-7 days build.
"""

    try:
        # Use AI service to analyze
        response = ai_service.generate_text(data_summary)

        # Extract JSON from response
        # Find JSON array in the response
        json_start = response.find('[')
        json_end = response.rfind(']') + 1

        if json_start == -1 or json_end == 0:
            raise ValueError("No JSON array found in AI response")

        json_str = response[json_start:json_end]
        ai_estimates = json.loads(json_str)

        # Convert to ComponentTiming objects
        components = []
        for idx, estimate in enumerate(ai_estimates):
            component_id = f"cad-{idx}-{hash(estimate.get('name', str(idx)))}"
            components.append(ComponentTiming(
                id=component_id,
                name=estimate.get('name', f'Component {idx + 1}'),
                description=estimate.get('description'),
                quantity=int(estimate.get('quantity', 1)),
                leadTimeDays=float(estimate.get('leadTimeDays', 7)),
                buildTimeDays=float(estimate.get('buildTimeDays', 2)),
                totalDays=float(estimate.get('leadTimeDays', 7)) + float(estimate.get('buildTimeDays', 2))
            ))

        return components

    except Exception as e:
        logger.error(f"AI analysis failed: {str(e)}")
        # Fallback to rule-based parsing
        return fallback_parsing(df)


def fallback_parsing(df: pd.DataFrame) -> List[ComponentTiming]:
    """Fallback parsing when AI fails"""
    components = []

    # Normalize column names
    df.columns = [col.lower().strip() for col in df.columns]

    # Find relevant columns
    name_col = next((col for col in df.columns if any(x in col for x in ['component', 'part', 'item', 'name', 'description'])), None)
    qty_col = next((col for col in df.columns if any(x in col for x in ['qty', 'quantity', 'count'])), None)
    lead_col = next((col for col in df.columns if any(x in col for x in ['lead', 'procurement'])), None)
    build_col = next((col for col in df.columns if any(x in col for x in ['build', 'fab', 'make', 'assembly'])), None)

    for idx, row in df.iterrows():
        name = str(row[name_col]) if name_col and pd.notna(row.get(name_col)) else f'Component {idx + 1}'
        quantity = int(row[qty_col]) if qty_col and pd.notna(row.get(qty_col)) else 1
        lead_time = float(row[lead_col]) if lead_col and pd.notna(row.get(lead_col)) else 7.0
        build_time = float(row[build_col]) if build_col and pd.notna(row.get(build_col)) else 2.0

        components.append(ComponentTiming(
            id=f"cad-{idx}",
            name=name,
            description=None,
            quantity=max(1, quantity),
            leadTimeDays=max(0.1, lead_time),
            buildTimeDays=max(0.1, build_time),
            totalDays=max(0.1, lead_time) + max(0.1, build_time)
        ))

    return components


@router.post("/api/cad/analyze", response_model=CADAnalysisResponse)
async def analyze_cad_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Analyze a CAD file (Excel/CSV) and provide component timing estimates using AI.

    Works with both local and Railway deployments.
    Uses Gemini or Anthropic API based on availability.
    """
    try:
        # Read file content
        content = await file.read()

        # Parse file
        if file.filename.endswith('.stl'):
            # For STL files, we'd need a 3D model parser - for now, return error
            raise HTTPException(
                status_code=400,
                detail="STL file analysis coming soon. Please use Excel or CSV with component list."
            )

        df = parse_excel_or_csv(content, file.filename)

        # Analyze with AI or fallback
        components = analyze_with_ai(df)

        # Calculate summary
        longest_component = max(components, key=lambda c: c.totalDays) if components else None
        average_time = sum(c.totalDays for c in components) / len(components) if components else 0

        # Project total: longest lead time + sum of all build times (assuming parallel procurement)
        max_lead_time = max((c.leadTimeDays for c in components), default=0)
        total_build_time = sum(c.buildTimeDays for c in components)
        project_total = max_lead_time + total_build_time

        summary = {
            "totalComponents": len(components),
            "averageTime": average_time,
            "projectTotal": project_total,
            "longestComponent": {
                "name": longest_component.name if longest_component else None,
                "totalDays": longest_component.totalDays if longest_component else 0
            } if longest_component else None
        }

        return CADAnalysisResponse(
            components=components,
            summary=summary
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CAD analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
