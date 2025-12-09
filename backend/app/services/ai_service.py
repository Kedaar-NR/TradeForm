"""
AI Service for TradeForm using Anthropic Claude API.

Provides component discovery, scoring, optimization, and report generation
for aerospace trade studies.
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
from uuid import UUID

from app.utils.ai_helpers import extract_response_text, clean_json_response
from app.services.ai_prompts import (
    DISCOVER_COMPONENTS_PROMPT,
    SCORE_COMPONENT_PROMPT,
    OPTIMIZE_PROJECT_PROMPT,
    OPTIMIZE_CRITERIA_PROMPT,
    TRADE_STUDY_REPORT_PROMPT,
    CHAT_SYSTEM_PROMPT,
)

logger = logging.getLogger(__name__)

# Try to import Anthropic client
ANTHROPIC_AVAILABLE = False
try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError as e:
    logger.warning(f"anthropic not available: {e}")
    anthropic = None  # type: ignore

# Try to import context builder for user documents
try:
    from app.utils.ai_context_builder import AIContextBuilder
    CONTEXT_BUILDER_AVAILABLE = True
except ImportError:
    CONTEXT_BUILDER_AVAILABLE = False
    AIContextBuilder = None  # type: ignore


class AIService:
    """Service for AI-powered trade study operations using Claude."""
    
    MODEL = "claude-sonnet-4-20250514"
    MAX_TOKENS = 8192
    
    def __init__(self):
        """Initialize AI service with Anthropic client."""
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
        
        if not ANTHROPIC_AVAILABLE or anthropic is None:
            raise RuntimeError("anthropic package is not installed")
        
        # Type checker doesn't know anthropic is not None here, so we assert it
        assert anthropic is not None
        self.client = anthropic.Anthropic(api_key=api_key)
        self.context_builder = AIContextBuilder() if CONTEXT_BUILDER_AVAILABLE and AIContextBuilder is not None else None
    
    def _call_claude(self, system: str, user: str, max_tokens: Optional[int] = None) -> str:
        """Make a call to Claude API and extract response text."""
        message = self.client.messages.create(
            model=self.MODEL,
            max_tokens=max_tokens or self.MAX_TOKENS,
            system=system,
            messages=[{"role": "user", "content": user}]
        )
        return extract_response_text(message)
    
    def _get_context_section(self, user_id: Optional[UUID], query: str, context_type: str = "full") -> str:
        """Get context from user documents if available."""
        if not self.context_builder or not user_id:
            return ""
        
        try:
            if context_type == "criteria":
                return self.context_builder.get_criteria_context(user_id, query)
            elif context_type == "rating":
                return self.context_builder.get_rating_context(user_id, query)
            elif context_type == "report":
                return self.context_builder.get_report_context(user_id, query)
            else:
                full_context = self.context_builder.get_full_context(user_id, query)
                # Convert dict to string by joining all values
                return "\n\n".join(full_context.values()) if full_context else ""
        except Exception as e:
            logger.warning(f"Failed to get context: {e}")
            return ""
    
    def discover_components(
        self,
        project_name: str,
        component_type: str,
        description: Optional[str] = None,
        criteria_names: Optional[List[str]] = None,
        location_preference: Optional[str] = None,
        number_of_components: int = 5,
        user_id: Optional[UUID] = None
    ) -> List[Dict[str, Any]]:
        """
        Discover components using AI.
        
        Args:
            project_name: Name of the project
            component_type: Type of component to discover
            description: Optional project description
            criteria_names: Optional list of criteria to consider
            location_preference: Optional location/region preference
            number_of_components: Number of components to discover
            user_id: Optional user ID for context
            
        Returns:
            List of component dictionaries
        """
        description_section = f"Description: {description}" if description else ""
        criteria_section = f"Key Criteria: {', '.join(criteria_names)}" if criteria_names else ""
        location_section = f"Preferred Region: {location_preference}" if location_preference else ""
        
        context = self._get_context_section(user_id, f"{component_type} components for {project_name}")
        context_section = f"\n\nREFERENCE INFORMATION:\n{context}" if context else ""
        
        prompt = DISCOVER_COMPONENTS_PROMPT.format(
            project_name=project_name,
            component_type=component_type,
            description_section=description_section,
            criteria_section=criteria_section,
            location_section=location_section,
            num_components=number_of_components
        )
        
        if context_section:
            prompt += context_section
        
        response = self._call_claude(
            system="You are an expert aerospace component researcher. Return only valid JSON.",
            user=prompt
        )
        
        return self._parse_json_array(response)
    
    def score_component(
        self,
        component_manufacturer: str,
        component_part_number: str,
        component_description: Optional[str],
        component_datasheet_url: Optional[str],
        criterion_name: str,
        criterion_description: Optional[str],
        criterion_unit: Optional[str],
        criterion_higher_is_better: bool,
        criterion_min_req: Optional[float] = None,
        criterion_max_req: Optional[float] = None,
        user_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """
        Score a component against a criterion using AI.
        
        Returns:
            Dictionary with score, raw_value, rationale, and confidence
        """
        description = component_description or "No description available"
        datasheet_section = f"Datasheet URL: {component_datasheet_url}" if component_datasheet_url else ""
        
        unit = criterion_unit or "N/A"
        direction = "Higher is better" if criterion_higher_is_better else "Lower is better"
        
        requirements_parts = []
        if criterion_min_req is not None:
            requirements_parts.append(f"Minimum: {criterion_min_req} {unit}")
        if criterion_max_req is not None:
            requirements_parts.append(f"Maximum: {criterion_max_req} {unit}")
        requirements_section = "\n".join(requirements_parts) if requirements_parts else ""
        
        context = self._get_context_section(user_id, f"{criterion_name} rating for {component_manufacturer}", "rating")
        
        prompt = SCORE_COMPONENT_PROMPT.format(
            manufacturer=component_manufacturer,
            part_number=component_part_number,
            description=description,
            datasheet_section=datasheet_section,
            criterion_name=criterion_name,
            criterion_description=criterion_description or "No description",
            unit=unit,
            direction=direction,
            requirements_section=requirements_section
        )
        
        if context:
            prompt += f"\n\nRATING GUIDELINES:\n{context}"
        
        response = self._call_claude(
            system="You are an aerospace engineer evaluating components. Return only valid JSON.",
            user=prompt,
            max_tokens=1024
        )
        
        return self._parse_score_response(response)
    
    def optimize_project(
        self,
        project_name: str,
        user_id: Optional[UUID] = None
    ) -> Dict[str, str]:
        """
        Suggest component type and description for a project.
        
        Returns:
            Dictionary with component_type and description
        """
        context = self._get_context_section(user_id, project_name)
        context_section = f"\n\nREFERENCE:\n{context}" if context else ""
        
        prompt = OPTIMIZE_PROJECT_PROMPT.format(
            project_name=project_name,
            context_section=context_section
        )
        
        response = self._call_claude(
            system="You are an aerospace systems engineer. Return only valid JSON.",
            user=prompt,
            max_tokens=1024
        )
        
        result = self._parse_json_object(response)
        return {
            "component_type": result.get("component_type", "Component"),
            "description": result.get("description", "")
        }
    
    def optimize_criteria(
        self,
        project_name: str,
        component_type: str,
        description: Optional[str] = None,
        user_id: Optional[UUID] = None
    ) -> List[Dict[str, Any]]:
        """
        Suggest evaluation criteria for a project.
        
        Returns:
            List of criteria dictionaries with name, description, weight, unit, higher_is_better
        """
        context = self._get_context_section(user_id, f"{component_type} evaluation criteria", "criteria")
        context_section = f"\n\nUSER CRITERIA PREFERENCES:\n{context}" if context else ""
        
        prompt = OPTIMIZE_CRITERIA_PROMPT.format(
            project_name=project_name,
            component_type=component_type,
            description=description or "No description",
            context_section=context_section
        )
        
        response = self._call_claude(
            system="You are an aerospace systems engineer. Return only valid JSON.",
            user=prompt
        )
        
        return self._parse_json_array(response)
    
    def generate_trade_study_report(
        self,
        project_name: str,
        project_description: Optional[str],
        component_type: str,
        criteria: List[Dict[str, Any]],
        components: List[Dict[str, Any]],
        user_id: Optional[UUID] = None
    ) -> str:
        """
        Generate a comprehensive trade study report.
        
        Args:
            project_name: Name of the project
            project_description: Project description
            component_type: Type of components evaluated
            criteria: List of criteria with weights
            components: List of components with scores and rankings
            user_id: Optional user ID for context
            
        Returns:
            Markdown-formatted report text
        """
        criteria_text = self._format_criteria_text(criteria)
        components_text = self._format_components_text(components)
        
        context = self._get_context_section(user_id, f"{project_name} trade study report", "report")
        context_section = f"\n\nREPORT STYLE GUIDELINES:\n{context}" if context else ""
        
        prompt = TRADE_STUDY_REPORT_PROMPT.format(
            project_name=project_name,
            component_type=component_type,
            description=project_description or "No description",
            context_section=context_section,
            criteria_text=criteria_text,
            components_text=components_text
        )
        
        return self._call_claude(
            system="You are an aerospace systems engineer writing formal technical reports.",
            user=prompt
        )
    
    def chat(self, question: str) -> str:
        """
        General chat about trade studies.

        Args:
            question: User's question

        Returns:
            Response text
        """
        return self._call_claude(
            system=CHAT_SYSTEM_PROMPT,
            user=question,
            max_tokens=2048
        )

    def generate_text(self, prompt: str, system: Optional[str] = None, max_tokens: Optional[int] = None) -> str:
        """
        Generate text from a prompt using AI.

        Args:
            prompt: The user prompt
            system: Optional system prompt (defaults to generic assistant)
            max_tokens: Optional max tokens override

        Returns:
            Generated text response
        """
        system_prompt = system or "You are a helpful AI assistant that provides accurate, concise responses."
        return self._call_claude(
            system=system_prompt,
            user=prompt,
            max_tokens=max_tokens or self.MAX_TOKENS
        )
    
    def _format_criteria_text(self, criteria: List[Dict[str, Any]]) -> str:
        """Format criteria list for prompt."""
        lines = []
        for c in criteria:
            direction = "higher is better" if c.get("higher_is_better", True) else "lower is better"
            unit_str = f" ({c.get('unit')})" if c.get("unit") else ""
            lines.append(
                f"- {c.get('name', 'N/A')}: {c.get('description', '')} "
                f"[Weight: {c.get('weight', 0)}%, {direction}]{unit_str}"
            )
        return "\n".join(lines)
    
    def _format_components_text(self, components: List[Dict[str, Any]]) -> str:
        """Format components list with scores for prompt."""
        lines = []
        sorted_components = sorted(components, key=lambda x: x.get("rank", 999))
        
        for comp in sorted_components:
            lines.append(f"\n### Rank #{comp.get('rank', 'N/A')}: {comp.get('manufacturer', 'N/A')} {comp.get('part_number', 'N/A')}")
            lines.append(f"Total Weighted Score: {comp.get('total_score', 0):.2f}")
            if comp.get("description"):
                lines.append(f"Description: {comp.get('description')}")
            
            scores = comp.get("scores", [])
            if scores:
                lines.append("\nCriteria Scores:")
                for s in scores:
                    raw_str = f" (Raw: {s.get('raw_value')})" if s.get("raw_value") is not None else ""
                    lines.append(f"  - {s.get('criterion_name', 'N/A')}: {s.get('score', 'N/A')}/10{raw_str}")
                    if s.get("rationale"):
                        lines.append(f"    Rationale: {s.get('rationale')[:200]}")
        
        return "\n".join(lines)
    
    def _parse_json_array(self, response: str) -> List[Dict[str, Any]]:
        """Parse JSON array from response, with fallback."""
        try:
            cleaned = clean_json_response(response)
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            return []
    
    def _parse_json_object(self, response: str) -> Dict[str, Any]:
        """Parse JSON object from response, with fallback."""
        try:
            cleaned = clean_json_response(response)
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            return {}
    
    def _parse_score_response(self, response: str) -> Dict[str, Any]:
        """Parse scoring response with defaults and validation."""
        result = self._parse_json_object(response)
        
        # Validate and clamp score to 1-10 range
        raw_score = result.get("score", 5)
        try:
            score = max(1, min(10, int(raw_score)))
        except (ValueError, TypeError):
            score = 5  # Default if conversion fails
        
        # Validate confidence to 0-1 range
        raw_confidence = result.get("confidence", 0.5)
        try:
            confidence = max(0.0, min(1.0, float(raw_confidence)))
        except (ValueError, TypeError):
            confidence = 0.5
        
        return {
            "score": score,
            "raw_value": result.get("raw_value"),
            "rationale": result.get("rationale", ""),
            "confidence": confidence
        }
    
    def score_component_batch(
        self,
        component: Dict[str, Any],
        criteria: List[Dict[str, Any]],
        user_id: Optional[UUID] = None
    ) -> List[Dict[str, Any]]:
        """
        Score a single component against ALL criteria in one AI call.
        Much faster than individual calls.
        
        Args:
            component: Component dict with manufacturer, part_number, description
            criteria: List of criterion dicts
            
        Returns:
            List of score dicts, one per criterion
        """
        criteria_text = "\n".join([
            f"- {c['name']}: {c.get('description', '')} (Unit: {c.get('unit', 'N/A')}, {'Higher is better' if c.get('higher_is_better', True) else 'Lower is better'})"
            for c in criteria
        ])
        
        prompt = f"""Score this component against ALL criteria below.

COMPONENT:
- Manufacturer: {component.get('manufacturer', 'Unknown')}
- Part Number: {component.get('part_number', 'Unknown')}
- Description: {component.get('description', 'No description')}

CRITERIA TO EVALUATE:
{criteria_text}

Return a JSON array with one score object per criterion:
[
  {{
    "criterion_name": "exact criterion name",
    "score": <1-10>,
    "raw_value": "<value with units>",
    "rationale": "brief explanation",
    "confidence": <0-1>
  }}
]

IMPORTANT: Include ALL {len(criteria)} criteria. Return ONLY valid JSON."""

        response = self._call_claude(
            system="You are an aerospace engineer. Score components quickly and accurately. Return only valid JSON array.",
            user=prompt,
            max_tokens=4096
        )
        
        results = self._parse_json_array(response)
        
        # Validate and normalize results
        validated = []
        for r in results:
            try:
                score = max(1, min(10, int(r.get("score", 5))))
            except (ValueError, TypeError):
                score = 5
            try:
                confidence = max(0.0, min(1.0, float(r.get("confidence", 0.5))))
            except (ValueError, TypeError):
                confidence = 0.5
                
            validated.append({
                "criterion_name": r.get("criterion_name", ""),
                "score": score,
                "raw_value": r.get("raw_value"),
                "rationale": r.get("rationale", "")[:500],  # Limit rationale length
                "confidence": confidence
            })
        
        return validated


# Singleton instance
_ai_service: Optional["AIService"] = None


def get_ai_service() -> "AIService":
    """Get or create AI service singleton."""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service
