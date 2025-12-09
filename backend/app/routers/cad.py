"""CAD file analysis endpoints using AI."""

from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session
import pandas as pd
import io
import logging
from typing import List, Dict, Any
import json
from pydantic import BaseModel
import trimesh

from app.database import get_db
from app.services.ai_service import get_ai_service

router = APIRouter(tags=["cad"])
logger = logging.getLogger(__name__)


class ComponentGeometry(BaseModel):
    """Lightweight geometry summary for visualization and reasoning"""
    bboxMin: List[float]
    bboxMax: List[float]
    dimensions: List[float]
    volume: float | None = None
    surfaceArea: float | None = None
    triangleCount: int | None = None


class ComponentTiming(BaseModel):
    """Component timing estimation"""
    id: str
    name: str
    description: str | None = None
    quantity: int
    leadTimeDays: float
    buildTimeDays: float
    totalDays: float
    reasoning: str | None = None
    geometry: ComponentGeometry | None = None


class CADAnalysisResponse(BaseModel):
    """CAD analysis result"""
    components: List[ComponentTiming]
    summary: Dict[str, Any]


def parse_excel_or_csv(file_content: bytes, filename: str) -> pd.DataFrame:
    """Parse Excel or CSV file into DataFrame"""
    try:
        filename_lower = filename.lower()
        if filename_lower.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(file_content))
        elif filename_lower.endswith('.csv'):
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
                totalDays=float(estimate.get('leadTimeDays', 7)) + float(estimate.get('buildTimeDays', 2)),
                reasoning=estimate.get('reasoning') or "AI-estimated from provided row context"
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
            totalDays=max(0.1, lead_time) + max(0.1, build_time),
            reasoning=(
                "Used provided lead/build columns" if lead_col or build_col
                else "Applied default timing assumptions for missing lead/build data"
            )
        ))

    return components


def _format_dimensions(dimensions: List[float]) -> str:
    """Format dimension list for human-readable reasoning"""
    if not dimensions:
        return "unknown"
    formatted = []
    for dim in dimensions:
        # Keep small parts precise, large parts rounded
        formatted.append(f"{dim:.1f}" if abs(dim) < 10 else f"{dim:.0f}")
    return " x ".join(formatted)


def summarize_mesh_geometry(mesh: trimesh.Trimesh) -> ComponentGeometry:
    """Extract a small geometry summary for timing reasoning and visualization"""
    bbox_min, bbox_max = mesh.bounds
    dimensions = (bbox_max - bbox_min).tolist()

    faces = getattr(mesh, "faces", None)
    triangle_count = int(faces.shape[0]) if faces is not None else 0

    try:
        volume = float(mesh.volume) if mesh.is_volume and mesh.volume is not None else None
    except Exception:
        volume = None

    try:
        surface_area = float(mesh.area) if mesh.area is not None else None
    except Exception:
        surface_area = None

    return ComponentGeometry(
        bboxMin=[float(x) for x in bbox_min],
        bboxMax=[float(x) for x in bbox_max],
        dimensions=[float(x) for x in dimensions],
        volume=volume,
        surfaceArea=surface_area,
        triangleCount=triangle_count
    )


def estimate_timing_from_geometry(geometry: ComponentGeometry) -> tuple[float, float, str]:
    """
    Estimate lead/build time from mesh geometry.

    Rough heuristic factors:
    - Larger bounding boxes drive longer procurement (material size) and build (machine time)
    - Higher triangle counts/surface area imply more complexity and finishing
    """
    dimensions = geometry.dimensions or []
    largest_dim = max(dimensions) if dimensions else 0.0
    triangle_count = geometry.triangleCount or 0
    surface_area = geometry.surfaceArea or 0.0

    # Size and complexity multipliers
    size_factor = 0.3
    if largest_dim >= 250:
        size_factor = 1.4
    elif largest_dim >= 120:
        size_factor = 1.0
    elif largest_dim >= 40:
        size_factor = 0.6

    tri_factor = 0.2
    if triangle_count >= 80000:
        tri_factor = 1.5
    elif triangle_count >= 60000:
        tri_factor = 1.2
    elif triangle_count >= 15000:
        tri_factor = 0.8
    elif triangle_count >= 2000:
        tri_factor = 0.6

    area_factor = 0.3
    if surface_area >= 60000:
        area_factor = 1.2
    elif surface_area >= 20000:
        area_factor = 0.8
    elif surface_area >= 5000:
        area_factor = 0.5

    complexity = 1.0 + size_factor + tri_factor + area_factor
    lead_time = max(3.0, min(28.0, round(4.0 + (complexity * 2.2), 1)))
    build_time = max(0.5, min(14.0, round(1.2 + (complexity * 1.6), 1)))

    if complexity < 3:
        complexity_label = "low"
    elif complexity < 4.5:
        complexity_label = "medium"
    else:
        complexity_label = "high"

    reasoning = (
        f"Size ~{_format_dimensions(dimensions)} (model units), "
        f"~{triangle_count:,} faces, surface area ~{surface_area:,.0f}. "
        f"Treated as {complexity_label}-complexity custom part; "
        f"lead time covers sourcing + vendor queue, build time covers fabrication + finishing."
    )

    return lead_time, build_time, reasoning


def analyze_3d_model_geometry(file_content: bytes, filename: str) -> List[ComponentTiming]:
    """
    Split a 3D model into components using geometry, then estimate timing.
    Returns an empty list if geometry parsing fails so the caller can fall back to AI.
    """
    file_ext = filename.split('.')[-1].lower()
    base_name = filename.rsplit('.', 1)[0]

    try:
        mesh_or_scene = trimesh.load(io.BytesIO(file_content), file_type=file_ext, force='scene')
    except Exception as e:
        logger.warning(f"Failed to load 3D file {filename}: {str(e)}")
        return []

    if isinstance(mesh_or_scene, trimesh.Scene):
        try:
            mesh = mesh_or_scene.dump(concatenate=True)
        except Exception as e:
            logger.warning(f"Failed to flatten 3D scene for {filename}: {str(e)}")
            return []
    else:
        mesh = mesh_or_scene

    if not isinstance(mesh, trimesh.Trimesh):
        return []

    try:
        sub_meshes = mesh.split(only_watertight=False)
    except Exception as e:
        logger.warning(f"Failed to split mesh components for {filename}: {str(e)}")
        sub_meshes = [mesh]

    if not sub_meshes:
        sub_meshes = [mesh]

    components: List[ComponentTiming] = []
    for idx, sub_mesh in enumerate(sub_meshes):
        geometry_summary = summarize_mesh_geometry(sub_mesh)
        lead_time, build_time, reasoning = estimate_timing_from_geometry(geometry_summary)

        component_id = f"3d-{idx}-{abs(hash((filename, idx, geometry_summary.triangleCount or idx)))}"
        name = None
        try:
            name = sub_mesh.metadata.get('name') if hasattr(sub_mesh, "metadata") else None
        except Exception:
            name = None

        components.append(ComponentTiming(
            id=component_id,
            name=name or f"{base_name}_part_{idx + 1}",
            description="Split from 3D model geometry",
            quantity=1,
            leadTimeDays=lead_time,
            buildTimeDays=build_time,
            totalDays=lead_time + build_time,
            reasoning=reasoning,
            geometry=geometry_summary
        ))

    return components


def analyze_3d_model_with_ai(file_content: bytes, filename: str) -> List[ComponentTiming]:
    """Analyze 3D model file and split into components using AI"""
    ai_service = get_ai_service()

    # Get file size for context
    file_size_kb = len(file_content) / 1024
    file_ext = filename.split('.')[-1].upper()

    prompt = f"""
Analyze this {file_ext} 3D model file ({file_size_kb:.1f} KB) and break it down into manufacturing components.

For each component you identify, provide:
1. Component name (e.g., "Base Plate", "Motor Mount", "Housing", etc.)
2. Brief description of the component
3. Estimated quantity needed
4. Procurement lead time in days (consider material availability, supplier lead times)
5. Build/fabrication time in days (consider manufacturing complexity)

Return a JSON array with this structure:
[
  {{
    "name": "component name",
    "description": "what this component is and its function",
    "quantity": 1,
    "leadTimeDays": 7,
    "buildTimeDays": 2,
    "reasoning": "brief explanation of time estimates"
  }}
]

Be realistic. Standard parts: 3-7 days lead, 1-2 days build.
Complex/custom parts: 14-30 days lead, 3-7 days build.
Critical path items may need expedited handling.
"""

    try:
        response = ai_service.generate_text(prompt)

        # Extract JSON from response
        json_start = response.find('[')
        json_end = response.rfind(']') + 1

        if json_start == -1 or json_end == 0:
            raise ValueError("No JSON array found in AI response")

        json_str = response[json_start:json_end]
        ai_estimates = json.loads(json_str)

        # Convert to ComponentTiming objects
        components = []
        for idx, estimate in enumerate(ai_estimates):
            component_id = f"3d-{idx}-{hash(estimate.get('name', str(idx)))}"
            components.append(ComponentTiming(
                id=component_id,
                name=estimate.get('name', f'Component {idx + 1}'),
                description=estimate.get('description'),
                quantity=int(estimate.get('quantity', 1)),
                leadTimeDays=float(estimate.get('leadTimeDays', 7)),
                buildTimeDays=float(estimate.get('buildTimeDays', 2)),
                totalDays=float(estimate.get('leadTimeDays', 7)) + float(estimate.get('buildTimeDays', 2)),
                reasoning=estimate.get('reasoning') or "AI-estimated from 3D model context"
            ))

        return components

    except Exception as e:
        logger.error(f"AI analysis of 3D model failed: {str(e)}")
        # Return a default component for the whole model
        return [
            ComponentTiming(
                id="3d-model-1",
                name=filename.replace('.' + file_ext.lower(), ''),
                description="Complete 3D model assembly",
                quantity=1,
                leadTimeDays=14.0,
                buildTimeDays=5.0,
                totalDays=19.0,
                reasoning="Fallback timing because AI and geometry parsing were unavailable"
            )
        ]


def analyze_3d_model(file_content: bytes, filename: str) -> List[ComponentTiming]:
    """Try geometry-based analysis first, then fall back to AI/default behavior."""
    geometry_components = analyze_3d_model_geometry(file_content, filename)
    if geometry_components:
        return geometry_components

    return analyze_3d_model_with_ai(file_content, filename)


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
        filename_lower = file.filename.lower()

        # Parse file
        if filename_lower.endswith(('.stl', '.step', '.stp', '.obj', '.fbx', '.3mf', '.iges', '.igs', '.dae', '.gltf', '.glb')):
            # For 3D model files, split by geometry first with AI as a fallback
            components = analyze_3d_model(content, file.filename)
        else:
            # Fallback to Excel/CSV parsing if provided
            df = parse_excel_or_csv(content, file.filename)
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
