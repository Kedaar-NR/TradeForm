"""
AI prompt templates for Anthropic Claude API.

Centralizes all prompt templates used by AIService for component discovery,
scoring, optimization, and report generation.
"""

# Component Discovery Prompt Template
DISCOVER_COMPONENTS_PROMPT = """You are an expert aerospace engineer helping to identify {component_type} components for a trade study.

Project Name: {project_name}
Component Type: {component_type}
{description_section}
{criteria_section}
{location_section}

Find {num_components} real, commercially available components from reputable manufacturers.
Focus on actual products with verifiable specifications.

Return a JSON array with this structure:
[
  {{
    "manufacturer": "Company Name",
    "part_number": "Exact Model/Part Number",
    "description": "Brief technical description with key specs",
    "datasheet_url": "Direct URL to PDF datasheet (must end in .pdf if possible)",
    "availability": "in_stock" or "lead_time" or "limited"
  }}
]

IMPORTANT:
- Only include real, existing products
- Include accurate manufacturer names and part numbers
- Provide specific technical descriptions
- For datasheet_url: STRONGLY prefer direct PDF links ending in .pdf from manufacturer websites
- If no direct PDF available, use the manufacturer product page URL
- Return ONLY valid JSON, no markdown formatting"""


# Component Scoring Prompt Template  
SCORE_COMPONENT_PROMPT = """You are an aerospace engineer evaluating a component for a trade study.

Component:
- Manufacturer: {manufacturer}
- Part Number: {part_number}
- Description: {description}
{datasheet_section}

Criterion to evaluate:
- Name: {criterion_name}
- Description: {criterion_description}
- Unit: {unit}
- Direction: {direction}
{requirements_section}

Based on typical specifications for this type of component from this manufacturer:
1. Estimate the likely raw value for this criterion
2. Score from 1-10 based on how well it meets requirements
3. Provide technical rationale

Return JSON:
{{
  "score": <1-10>,
  "raw_value": <estimated value with units if applicable>,
  "rationale": "Technical explanation for the score",
  "confidence": <0-1 confidence in accuracy>
}}

IMPORTANT: Return ONLY valid JSON, no markdown."""


# Project Optimization Prompt Template
OPTIMIZE_PROJECT_PROMPT = """You are an aerospace systems engineer helping to optimize a trade study project.

Project Name: {project_name}
{context_section}

Based on the project name, suggest:
1. The most appropriate component type/category to evaluate
2. A comprehensive project description covering key requirements

Return JSON:
{{
  "component_type": "Specific component category name",
  "description": "Detailed project description including technical requirements, constraints, and objectives"
}}

IMPORTANT: Return ONLY valid JSON, no markdown formatting."""


# Criteria Optimization Prompt Template
OPTIMIZE_CRITERIA_PROMPT = """You are an aerospace systems engineer creating evaluation criteria for a trade study.

Project: {project_name}
Component Type: {component_type}
Description: {description}
{context_section}

Suggest 5-8 weighted evaluation criteria. Total weights must sum to 100%.

Return a JSON array:
[
  {{
    "name": "Criterion Name",
    "description": "What this criterion measures",
    "weight": <percentage as number>,
    "unit": "measurement unit or null",
    "higher_is_better": true/false
  }}
]

Include both technical and programmatic criteria (e.g., cost, reliability, TRL).
IMPORTANT: Return ONLY valid JSON, no markdown."""


# Trade Study Report Prompt Template
TRADE_STUDY_REPORT_PROMPT = """You are an aerospace systems engineer writing a comprehensive trade study report.

Project: {project_name}
Component Type: {component_type}
Description: {description}
{context_section}

CRITERIA EVALUATED:
{criteria_text}

COMPONENT RESULTS:
{components_text}

Write a professional trade study report with these sections:

## Executive Summary
Brief overview of the study and key recommendation.

## Methodology  
Explain the weighted scoring approach and evaluation criteria.

## Component Analysis
Detailed analysis of each component's performance. Include specific scores and comparisons.

## Trade-Off Discussion
Compare top candidates. Discuss strengths, weaknesses, and key differentiators.

## Recommendation
Clear recommendation with supporting rationale based on weighted scores.

## Conclusion
Summary and suggested next steps.

Write in formal technical style. Reference specific scores and rankings.
Be thorough but concise. Focus on actionable insights."""


# Chat System Prompt
CHAT_SYSTEM_PROMPT = """You are a helpful assistant for TradeForm, a trade study automation platform.
You help users with:
- Understanding trade study methodology
- Interpreting component scores and rankings
- Explaining evaluation criteria
- Providing aerospace/engineering knowledge

Keep responses concise and technical. Reference specific features when relevant."""

