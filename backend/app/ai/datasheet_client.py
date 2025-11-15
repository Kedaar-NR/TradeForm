"""
AI client for datasheet Q&A and suggestions.

This module provides a placeholder interface for AI-powered datasheet analysis.
The actual AI implementation can be plugged in here later.
"""

from typing import Dict, Any, List


def ask_datasheet_ai(
    context: Dict[str, Any],
    question: str,
    mode: str = "qa",
) -> Dict[str, Any]:
    """
    Placeholder for datasheet AI calls.
    
    Parameters:
        context: Dictionary containing:
            - project: Project information dict
            - component: Component information dict
            - criteria: List of criteria dicts
            - datasheet_chunks: List of relevant text chunks from datasheet
                Each chunk: {"page_number": int, "section_title": str | None, "text": str}
            - primary_criterion: Optional dict for a specific criterion being evaluated
            
        question: The user's question (ignored when mode == "suggestions")
        
        mode: "qa" for Q&A mode, "suggestions" for generating suggested questions
        
    Returns:
        For mode == "qa":
            {
                "answer": "string answer here",
                "citations": [
                    {"page_number": 3, "snippet": "excerpt from datasheet..."},
                    ...
                ],
                "confidence": 0.8  # 0.0 to 1.0
            }
            
        For mode == "suggestions":
            {
                "suggestions": [
                    "Suggested question 1",
                    "Suggested question 2",
                    ...
                ]
            }
    
    TODO: Implement this using your preferred LLM provider (OpenAI, Anthropic, etc.)
    
    Example implementation structure:
        1. Build a detailed prompt from the context
        2. Include anti-hallucination instructions
        3. For Q&A mode:
           - Emphasize: "Only answer using provided datasheet text"
           - Require explicit citations with page numbers
           - Instruct to say "not found" if information is missing
        4. For suggestions mode:
           - Ask AI to propose 5-10 relevant questions based on criteria
        5. Call your LLM API
        6. Parse and return structured response
    """
    
    # TODO: Replace this stub with real AI API call
    
    if mode == "qa":
        # Placeholder Q&A response
        return {
            "answer": "AI datasheet Q&A is not yet implemented. To enable this feature, please implement the ask_datasheet_ai function in app/ai/datasheet_client.py with your preferred LLM provider.",
            "citations": [],
            "confidence": 0.0,
        }
    
    elif mode == "suggestions":
        # Generate placeholder suggestions based on criteria if available
        suggestions = []
        
        criteria = context.get("criteria", [])
        component_type = context.get("project", {}).get("component_type", "component")
        
        if criteria:
            # Generate suggestions based on criteria
            for criterion in criteria[:5]:  # Take first 5 criteria
                criterion_name = criterion.get("name", "")
                unit = criterion.get("unit", "")
                
                if unit:
                    suggestions.append(
                        f"What is the {criterion_name.lower()} in {unit}?"
                    )
                else:
                    suggestions.append(
                        f"What is the {criterion_name.lower()} for this {component_type}?"
                    )
        else:
            # Default generic suggestions
            suggestions = [
                f"What is the nominal operating voltage for this {component_type}?",
                f"What is the power consumption at typical operating conditions?",
                f"What are the key performance specifications?",
                f"What is the operating temperature range?",
                f"What are the physical dimensions and weight?",
            ]
        
        return {
            "suggestions": suggestions[:8]  # Limit to 8 suggestions
        }
    
    else:
        raise ValueError(f"Invalid mode: {mode}. Must be 'qa' or 'suggestions'")


def _build_qa_prompt(context: Dict[str, Any], question: str) -> str:
    """
    Helper function to build a structured prompt for Q&A.
    
    This is an example of how you might structure the prompt when implementing
    the actual AI integration.
    
    Args:
        context: Context dictionary with project, component, criteria, and datasheet chunks
        question: User's question
        
    Returns:
        Formatted prompt string
    """
    project = context.get("project", {})
    component = context.get("component", {})
    criteria = context.get("criteria", [])
    datasheet_chunks = context.get("datasheet_chunks", [])
    primary_criterion = context.get("primary_criterion")
    
    # Build prompt sections
    prompt_parts = [
        "You are an expert engineer assistant analyzing a component datasheet.",
        "",
        "# Component Information",
        f"- Manufacturer: {component.get('manufacturer', 'N/A')}",
        f"- Part Number: {component.get('part_number', 'N/A')}",
        f"- Description: {component.get('description', 'N/A')}",
        "",
        "# Project Context",
        f"- Project: {project.get('name', 'N/A')}",
        f"- Component Type: {project.get('component_type', 'N/A')}",
    ]
    
    if criteria:
        prompt_parts.append("")
        prompt_parts.append("# Evaluation Criteria")
        for criterion in criteria:
            unit = f" ({criterion.get('unit')})" if criterion.get('unit') else ""
            prompt_parts.append(
                f"- {criterion.get('name')}{unit}: {criterion.get('description', '')}"
            )
    
    if primary_criterion:
        prompt_parts.append("")
        prompt_parts.append("# Primary Focus")
        prompt_parts.append(f"The user is particularly interested in: {primary_criterion.get('name')}")
    
    # Add datasheet content
    prompt_parts.append("")
    prompt_parts.append("# Datasheet Content")
    for i, chunk in enumerate(datasheet_chunks, 1):
        page_num = chunk.get("page_number", "?")
        section = chunk.get("section_title", "")
        text = chunk.get("text", "")
        
        prompt_parts.append(f"## Chunk {i} (Page {page_num})")
        if section:
            prompt_parts.append(f"Section: {section}")
        prompt_parts.append(text)
        prompt_parts.append("")
    
    # Add instructions and question
    prompt_parts.extend([
        "# Instructions",
        "1. Answer the question using ONLY the datasheet content provided above",
        "2. Include specific citations: reference page numbers and copy exact snippets",
        "3. If the information is not in the datasheet, explicitly say 'Information not found in datasheet'",
        "4. Do NOT invent or assume values that are not explicitly stated",
        "5. Provide a confidence score (0.0 to 1.0) for your answer",
        "",
        "# User Question",
        question,
        "",
        "# Required Response Format (JSON)",
        "{",
        '  "answer": "Your answer here",',
        '  "citations": [',
        '    {"page_number": N, "snippet": "exact text from datasheet"},',
        "    ...",
        "  ],",
        '  "confidence": 0.0-1.0',
        "}",
    ])
    
    return "\n".join(prompt_parts)


def _build_suggestions_prompt(context: Dict[str, Any]) -> str:
    """
    Helper function to build a structured prompt for generating suggestions.
    
    Args:
        context: Context dictionary with project, component, and criteria
        
    Returns:
        Formatted prompt string
    """
    project = context.get("project", {})
    component = context.get("component", {})
    criteria = context.get("criteria", [])
    
    prompt_parts = [
        "You are an expert engineer helping identify key datasheet parameters to check.",
        "",
        "# Component Information",
        f"- Manufacturer: {component.get('manufacturer', 'N/A')}",
        f"- Part Number: {component.get('part_number', 'N/A')}",
        f"- Component Type: {project.get('component_type', 'N/A')}",
        "",
        "# Evaluation Criteria",
    ]
    
    for criterion in criteria:
        unit = f" ({criterion.get('unit')})" if criterion.get('unit') else ""
        higher_better = "higher is better" if criterion.get("higher_is_better") else "lower is better"
        prompt_parts.append(
            f"- {criterion.get('name')}{unit}: {criterion.get('description', '')} ({higher_better})"
        )
    
    prompt_parts.extend([
        "",
        "# Task",
        "Generate 5-8 natural language questions that an engineer should ask about this component's datasheet.",
        "Focus on the evaluation criteria listed above.",
        "Make questions specific and actionable (e.g., 'What is the gain at 8.2 GHz?' not 'Tell me about gain').",
        "",
        "# Required Response Format (JSON)",
        "{",
        '  "suggestions": [',
        '    "Specific question 1?",',
        '    "Specific question 2?",',
        "    ...",
        "  ]",
        "}",
    ])
    
    return "\n".join(prompt_parts)

