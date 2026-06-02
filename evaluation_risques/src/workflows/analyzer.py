"""
analyzer.py
===========
Responsible for analyzing cyber risks in a document.
Takes plain text as input and returns a structured RiskAnalysis object.
 
This is the only file that calls the Mistral API directly.
"""

import json
import os

import mistralai.workflows as wfk
from pydantic import BaseModel

# --------------------------------##
# Data models
# --------------------------------##


class Risk(BaseModel):
    """Init risks."""
    title: str
    level: str
    description: str
    recommendation: str


class RiskAnalysis(BaseModel):
    """Init full Risks."""
    executive_summary: str
    risks: list[Risk]
    exceptions: list[str]
    derogations: list[str]
    overall_score: str


# --------------------------------##
# Activity called by router
# --------------------------------##

@wfk.activity()
async def analyze_risks(
    text: str,
    vendor: str,
    project: str
) -> RiskAnalysis:
    """Sends the extracted text to Mistral and gets back a structured risk analysis."""
    from mistralai.client import Mistral

    # --- Step 1: Connect to Mistral API ---
    client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

    # --- Step 2: Build the prompt ---
    prompt = _build_prompt(text, vendor, project)

    # --- Step 3: Call the Mistral API ---
    response = client.chat.complete(
        model="mistral-large-latest",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.2,
    )

    # --- Step 4: Parse the JSON response into a RiskAnalysis object ---
    raw = response.choices[0].message.content
    data: dict = json.loads(raw)

    return RiskAnalysis(**data)

# --------------------------------##
# Private helper
# --------------------------------##


def _build_prompt(text: str, vendor: str, project: str) -> str:
    """Build prompt for mistral."""
    return f"""
You are a cybersecurity expert performing a Third Party Risk Assessment (TPRA).

Vendor: {vendor}
Project: {project}

Document to analyze:
---
{text[:8000]}
---

For each line below analyze this document, assign a risk score from 0 to 100
and respond ONLY with valid JSON using this exact structure:
{{
  "executive_summary": "3-4 sentence summary of the vendor's overall risk
  posture",
  "risks": [
    {{
      "scores": [
        {{"score": 0}},
        {{"score": 75}},
        {{"score": 20}}
      ]
      "title": "Short risk name",
      "level": "Critical|High|Medium|Low",
      "description": "Detailed description of the identified risk",
      "recommendation": "Concrete action to mitigate this risk"
    }}
  ],
  "exceptions": ["Security exception 1", "Security exception 2"],
  "derogations": ["Derogation 1"],
  "overall_score": "Critical|High|Medium|Low"
}}

Rules:
- If the document lacks information on a point, state it clearly in that field.
- The overall_score must reflect the highest risk level found.
- Respond ONLY with the JSON object, no text before or after.
"""
