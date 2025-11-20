"""
AI client for datasheet Q&A and suggestions using Google Gemini API.
"""

import os
import json
import re
from typing import Dict, Any, List, Optional

try:
    from google import genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


def _get_gemini_client():
    """Initialize and return Gemini client"""
    if not GEMINI_AVAILABLE:
        raise RuntimeError(
            "google-genai package not installed. "
            "Install it with: pip install -q -U google-genai"
        )
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY environment variable not set. "
            "Please set it in your .env file or environment variables."
        )
    
    try:
        # New SDK: Create client directly with API key
        client = genai.Client(api_key=api_key)
        return client
    except Exception as e:
        raise RuntimeError(
            f"Failed to initialize Gemini client: {str(e)}. "
            "Please check that your GEMINI_API_KEY is valid."
        )


def ask_datasheet_ai(
    context: Dict[str, Any],
    question: str,
    mode: str = "qa",
) -> Dict[str, Any]:
    """
    Query datasheet using Gemini API.
    
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
    """
    
    if not GEMINI_AVAILABLE:
        return _fallback_response(mode, context=context, question=question)
    
    try:
        client = _get_gemini_client()
        
        if mode == "qa":
            prompt = _build_qa_prompt(context, question)
            # New SDK API: use models.generate_content
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            
            # Parse response - new SDK returns response.text directly
            answer_text = response.text.strip()
            
            # Try to extract JSON from response
            citations = []
            confidence = 0.8  # Default confidence
            
            # Look for JSON in the response
            json_match = re.search(r'\{[^{}]*"answer"[^{}]*\}', answer_text, re.DOTALL)
            if json_match:
                try:
                    parsed = json.loads(json_match.group(0))
                    answer_text = parsed.get("answer", answer_text)
                    citations = parsed.get("citations", [])
                    confidence = parsed.get("confidence", 0.8)
                except json.JSONDecodeError:
                    pass
            
            # If no citations found, try to extract page numbers from answer
            if not citations:
                citations = _extract_citations_from_text(answer_text, context.get("datasheet_chunks", []))
            
            return {
                "answer": answer_text,
                "citations": citations,
                "confidence": confidence
            }
        
        elif mode == "suggestions":
            prompt = _build_suggestions_prompt(context)
            # New SDK API: use models.generate_content
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            
            suggestions_text = response.text.strip()
            
            # Try to extract JSON
            json_match = re.search(r'\{[^{}]*"suggestions"[^{}]*\}', suggestions_text, re.DOTALL)
            if json_match:
                try:
                    parsed = json.loads(json_match.group(0))
                    suggestions = parsed.get("suggestions", [])
                    if suggestions:
                        return {"suggestions": suggestions[:8]}
                except json.JSONDecodeError:
                    pass
            
            # Fallback: extract questions from text
            suggestions = _extract_questions_from_text(suggestions_text)
            if not suggestions:
                # Use default suggestions
                suggestions = _generate_default_suggestions(context)
            
            return {
                "suggestions": suggestions[:8]
            }
        
        else:
            raise ValueError(f"Invalid mode: {mode}. Must be 'qa' or 'suggestions'")
    
    except RuntimeError as e:
        # RuntimeError indicates package missing, API key missing, or initialization failure
        error_msg = str(e)
        print(f"Gemini API configuration error: {error_msg}")
        return _fallback_response(mode)
    except Exception as e:
        # Catch API errors (authentication, rate limits, etc.)
        error_msg = str(e)
        error_type = type(e).__name__
        print(f"Gemini API error ({error_type}): {error_msg}")
        
        # Check for common API errors
        if "API_KEY" in error_msg.upper() or "AUTHENTICATION" in error_msg.upper():
            return {
                "answer": f"Authentication error: Invalid GEMINI_API_KEY. Please check your API key in the .env file.",
                "citations": [],
                "confidence": 0.0,
            } if mode == "qa" else _fallback_response(mode)
        elif "QUOTA" in error_msg.upper() or "RATE_LIMIT" in error_msg.upper():
            return {
                "answer": f"Rate limit exceeded: {error_msg}. Please try again later.",
                "citations": [],
                "confidence": 0.0,
            } if mode == "qa" else _fallback_response(mode, context=context)
        else:
            return _fallback_response(mode, context=context, question=question)


def _extract_citations_from_text(text: str, chunks: List[Dict]) -> List[Dict]:
    """Extract citations from answer text by finding page references"""
    citations = []
    
    # Look for page number patterns
    page_pattern = r'[Pp]age\s+(\d+)'
    matches = re.finditer(page_pattern, text)
    
    for match in matches:
        page_num = int(match.group(1))
        # Find corresponding chunk
        for chunk in chunks:
            if chunk.get("page_number") == page_num:
                # Extract snippet (first 200 chars of chunk text)
                snippet = chunk.get("text", "")[:200]
                if snippet:
                    citations.append({
                        "page_number": page_num,
                        "snippet": snippet
                    })
                break
    
    return citations


def _extract_questions_from_text(text: str) -> List[str]:
    """Extract questions from AI response text"""
    questions = []
    
    # Look for lines ending with ?
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        if line.endswith('?') and len(line) > 10:
            # Remove numbering/bullets
            line = re.sub(r'^[\d\-•\.]\s*', '', line)
            questions.append(line)
    
    return questions


def _extract_metric_candidates(chunks: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """Extract candidate metric names + units from datasheet text."""
    metrics: List[Dict[str, str]] = []
    metric_pattern = re.compile(
        r"([A-Za-z][A-Za-z0-9\s\-/]{3,40})[:\-]\s*([+-]?\d[\d\s\.,/-]*(?:[A-Za-z°/%]+)?)"
    )
    unit_pattern = re.compile(r"(dB|GHz|MHz|kHz|Hz|V|mV|A|mA|W|mW|°C|%)", re.IGNORECASE)
    seen = set()

    for chunk in chunks:
        text = (chunk.get("text") or "").splitlines()
        for line in text:
            clean = line.strip()
            if not clean or len(clean) > 90:
                continue
            match = metric_pattern.search(clean)
            if not match:
                continue
            name = match.group(1).strip(" :-")
            value = match.group(2).strip()
            key = name.lower()
            if key in seen:
                continue
            unit_match = unit_pattern.search(value)
            unit = unit_match.group(0) if unit_match else ""
            metrics.append({"name": name, "unit": unit})
            seen.add(key)
            if len(metrics) >= 8:
                break
        if len(metrics) >= 8:
            break
    return metrics


def _generate_default_suggestions(context: Dict[str, Any]) -> List[str]:
    """Generate default suggestions based on datasheet chunks or criteria."""
    suggestions = []
    datasheet_chunks = context.get("datasheet_chunks") or []
    metrics = _extract_metric_candidates(datasheet_chunks)

    if metrics:
        for metric in metrics[:6]:
            metric_name = metric.get("name", "").strip()
            unit = metric.get("unit", "").strip()
            if not metric_name:
                continue
            if unit:
                suggestions.append(
                    f"What does the datasheet list for {metric_name.lower()} in {unit}?"
                )
            else:
                suggestions.append(
                    f"What value does the datasheet specify for {metric_name.lower()}?"
                )
        if suggestions:
            return suggestions
    
    criteria = context.get("criteria", [])
    component_type = context.get("project", {}).get("component_type", "component")
    
    if criteria:
        for criterion in criteria[:5]:
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
        suggestions = [
            f"What is the nominal operating voltage for this {component_type}?",
            f"What is the power consumption at typical operating conditions?",
            f"What are the key performance specifications?",
            f"What is the operating temperature range?",
            f"What are the physical dimensions and weight?",
        ]
    
    return suggestions


def _fallback_response(
    mode: str,
    context: Optional[Dict[str, Any]] = None,
    question: str = "",
) -> Dict[str, Any]:
    """Fallback response using simple keyword search when Gemini is unavailable."""
    if mode == "qa":
        snippet, page, relevance = _simple_chunk_search(context or {}, question)
        if snippet:
            # Boost confidence if the snippet has multiple keyword hits
            confidence = min(0.9, max(0.45, 0.35 + (relevance * 0.12)))
            return {
                "answer": snippet,
                "citations": [
                    {
                        "page_number": page or 0,
                        "snippet": snippet[:200],
                    }
                ]
                if page is not None
                else [],
                "confidence": confidence,
            }
        return {
            "answer": "I couldn't find that information in the datasheet text. Try rephrasing or check the datasheet manually.",
            "citations": [],
            "confidence": 0.1,
        }
    return {
        "suggestions": _generate_default_suggestions(context or {}),
    }


def _simple_chunk_search(context: Dict[str, Any], question: str):
    chunks = context.get("datasheet_chunks") or []
    if not chunks:
        return None, None, 0

    keywords = [
        word
        for word in re.findall(r"\w+", question.lower())
        if len(word) > 3
    ]
    if not keywords:
        keywords = question.lower().split()

    best_chunk = None
    best_score = 0
    for chunk in chunks:
        text = chunk.get("text", "")
        lower_text = text.lower()
        score = sum(lower_text.count(keyword) for keyword in keywords)
        if score > best_score and text.strip():
            best_score = score
            best_chunk = chunk

    if best_chunk:
        snippet = best_chunk.get("text", "").strip()
        page = best_chunk.get("page_number")
        if len(snippet) > 600:
            snippet = snippet[:600] + "..."
        return snippet, page, best_score
    return None, None, 0


def _build_qa_prompt(context: Dict[str, Any], question: str) -> str:
    """
    Build a structured prompt for Q&A using Gemini.
    """
    project = context.get("project", {})
    component = context.get("component", {})
    criteria = context.get("criteria", [])
    datasheet_chunks = context.get("datasheet_chunks", [])
    primary_criterion = context.get("primary_criterion")
    
    # Build prompt sections
    prompt_parts = [
        "You are an expert engineer assistant analyzing a component datasheet.",
        "Your task is to answer questions using ONLY the datasheet content provided below.",
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
    prompt_parts.append("IMPORTANT: Only use information from the datasheet chunks below. Do not make up or assume values.")
    prompt_parts.append("")
    
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
        "2. Include specific page number references in your answer (e.g., 'According to page 3...')",
        "3. Quote exact snippets from the datasheet when providing specific values",
        "4. If the information is not in the datasheet, explicitly say 'Information not found in datasheet'",
        "5. Do NOT invent or assume values that are not explicitly stated",
        "6. Be precise and cite page numbers for all claims",
        "",
        "# User Question",
        question,
        "",
        "Provide a clear, accurate answer based on the datasheet content above:",
    ])
    
    return "\n".join(prompt_parts)


def _build_suggestions_prompt(context: Dict[str, Any]) -> str:
    """
    Build a structured prompt for generating suggestions using Gemini.
    """
    project = context.get("project", {})
    component = context.get("component", {})
    criteria = context.get("criteria", [])
    datasheet_chunks = context.get("datasheet_chunks", [])
    
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
        "Provide the questions as a simple list, one per line, each ending with a question mark.",
    ])

    if datasheet_chunks:
        prompt_parts.append("")
        prompt_parts.append("# Datasheet Highlights")
        for chunk in datasheet_chunks[:4]:
            label = chunk.get("section_title") or f"Page {chunk.get('page_number')}"
            snippet = (chunk.get("text", "") or "").replace("\n", " ").strip()
            if not snippet:
                continue
            prompt_parts.append(f"- {label}: {snippet[:180]}")
    
    return "\n".join(prompt_parts)
