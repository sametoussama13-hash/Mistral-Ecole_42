"""
analyzer.py
===========
Step 1: Analyze cyber risks from the document.
Returns a structured RiskAnalysis with risks, exceptions, derogations.
Does NOT score individual lines — that is done by scorer.py.
"""

import json
import os

import mistralai.workflows as wfk
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

class Risk(BaseModel):
    title: str
    level: str            # Critical / High / Medium / Low
    description: str
    recommendation: str


class RiskAnalysis(BaseModel):
    executive_summary: str
    risks: list[Risk]
    exceptions: list[str]
    derogations: list[str]
    overall_score: str    # Critical / High / Medium / Low


# ---------------------------------------------------------------------------
# Activity
# ---------------------------------------------------------------------------

@wfk.activity()
async def analyze_risks(text: str, vendor: str, project: str) -> RiskAnalysis:
    """Identifies risks in the document. Simple focused prompt."""
    from mistralai.client import Mistral

    client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

    prompt = f"""
You are a cybersecurity expert performing a Third Party Risk Assessment (TPRA).

Vendor: {vendor}
Project: {project}

Document:
---
{text[:8000]}
---

Identify the main cybersecurity risks in this document.
Respond ONLY with valid JSON:
{{
  "executive_summary": "3-4 sentence summary of the vendor's risk posture",
  "risks": [
    {{
      "title": "Short risk name",
      "level": "Critical|High|Medium|Low",
      "description": "What the risk is and why it matters",
      "recommendation": "Concrete action to mitigate this risk"
    }}
  ],
  "exceptions": ["Exception found in the document"],
  "derogations": ["Derogation found in the document"],
  "overall_score": "Critical|High|Medium|Low"
}}

Rules:
- overall_score = highest risk level found.
- Respond ONLY with the JSON, no text before or after.
"""

    response = client.chat.complete(
        model="mistral-large-latest",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.2,
    )

    data = json.loads(response.choices[0].message.content)

    # Normalize field names in case Mistral uses slightly different keys
    normalized_risks = []
    for r in data.get("risks", []):
        normalized_risks.append({
            "title":          r.get("title", ""),
            "level":          r.get("level", "Medium"),
            "description":    r.get("description", r.get("descreption", "")),
            "recommendation": r.get("recommendation", r.get("mitigation", "")),
        })
    data["risks"] = normalized_risks

    return RiskAnalysis(**data)
