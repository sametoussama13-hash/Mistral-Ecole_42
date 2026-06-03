"""
scorer.py
=========
Step 2: Score each question-response pair in the document.
Returns a ScoringResult with a score per question and a global score.
Runs after analyze_risks, independently.
"""

import json
import os

import mistralai.workflows as wfk
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

class QuestionScore(BaseModel):
    question_id: str    # e.g. "2.1 AAC-01"
    question: str       # Full question text
    response: str       # Vendor's response
    score: int          # 0 (very risky) → 100 (fully compliant)
    justification: str  # Why this score


class ScoringResult(BaseModel):
    global_score: int              # Weighted average of all question scores
    question_scores: list[QuestionScore]


# ---------------------------------------------------------------------------
# Activity
# ---------------------------------------------------------------------------

@wfk.activity()
async def score_responses(text: str, vendor: str) -> ScoringResult:
    """
    Scores each question-response pair independently.
    Simple focused prompt — only scoring, no risk analysis.
    """
    from mistralai.client import Mistral

    client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

    prompt = f"""
You are a cybersecurity auditor scoring a security questionnaire.

Vendor: {vendor}

Security questionnaire (format: ID | Question | Response):
---
{text[:8000]}
---

For EACH question-response pair, assign a compliance score:
- 0   = Critical non-compliance
- 25  = High risk, major gaps
- 50  = Medium risk, partial compliance
- 75  = Low risk, mostly compliant
- 100 = Fully compliant

Then compute global_score as the average of all scores.

Respond ONLY with valid JSON:
{{
  "global_score": 65,
  "question_scores": [
    {{
      "question_id": "2.1 AAC-01",
      "question": "Full question text from the document",
      "response": "The vendor's exact response",
      "score": 75,
      "justification": "Short explanation of the score"
    }}
  ]
}}

Rules:
- Use the EXACT question ID from the document (e.g. "2.1 AAC-01").
- Every question must have a score.
- If response is missing or vague, score it 25.
- Respond ONLY with the JSON, no text before or after.
"""

    response = client.chat.complete(
        model="mistral-large-latest",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.2,
    )

    data = json.loads(response.choices[0].message.content)
    return ScoringResult(**data)
