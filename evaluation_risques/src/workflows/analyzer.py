"""
analyzer.py
===========
Analyzes vendor responses — Use Case 2.
Returns risks WITH related_question_ids so scorer can recalculate levels.
Added: asyncio.sleep between batches to avoid rate limiting.
Added: not_applicable_question_ids — dev-specific questions answered "N/A"
       by non-developer companies are flagged so scorer forces a score of 4.
"""

import asyncio
import json
import os

import mistralai.workflows as wfk
from pydantic import BaseModel

from workflows.utils import parse_questions, fallback_parse


# Question IDs that are only relevant for companies with developers.
# If a non-dev vendor answers "Not applicable" (or equivalent), the scorer
# must assign a score of 4 instead of penalising them.
DEV_SPECIFIC_QUESTION_IDS = {
    "3.1 AIS-01",   # SecSDLC
    "2.1 AAC-01",   # Pentests
    "8.1 ICS-02",   # Vulnérabilités applicatives
    "8.2 ICS-03",   # Patch management
    "4.1 CCC-01",   # Reporting de bugs
}

NOT_APPLICABLE_PATTERNS = {
    "not applicable", "n/a", "na", "non applicable", "non concerné",
    "not concerned", "does not apply", "ne s'applique pas", "sans objet",
}


def _is_not_applicable(response: str) -> bool:
    """Returns True if the response is a clear N/A equivalent."""
    cleaned = response.strip().lower()
    return any(pat in cleaned for pat in NOT_APPLICABLE_PATTERNS)


class Risk(BaseModel):
    title: str
    level: str
    description: str
    recommendation: str
    related_question_ids: list[str]


class RiskAnalysis(BaseModel):
    executive_summary: str
    risks: list[Risk]
    exceptions: list[str]
    derogations: list[str]
    overall_score: str
    final_decision: str
    showstoppers: list[str]
    not_applicable_question_ids: list[str] = []


def _build_batch_prompt(batch: list[dict], vendor: str, project: str) -> str:
    available_ids = [q["question_id"] for q in batch]
    questions_text = "\n\n".join(
        f"ID: {q['question_id']}\n"
        f"Question: {q['question']}\n"
        f"Response: {q['response']}"
        for q in batch
    )
    return f"""
You are a cybersecurity expert performing a TPRA for vendor "{vendor}", project "{project}".

Analyze these question-response pairs and identify REAL cybersecurity risks.
Base every finding strictly on what the vendor actually said.

Available question IDs in this batch: {available_ids}

--- QUESTIONS ---
{questions_text}
---

Rules:
- Only raise a risk if the response reveals an actual gap or weakness.
- related_question_ids must contain ONLY IDs from the available list above.
- Showstoppers = genuine blocking issues only.
- Do NOT include a "level" field — it will be computed from question scores.
- Respond ONLY with JSON, no text before or after.

Respond ONLY with valid JSON:
{{
  "risks": [
    {{
      "title": "Short risk name",
      "description": "Risk based on actual vendor response",
      "recommendation": "Concrete mitigation action",
      "related_question_ids": ["2.1 AAC-01"]
    }}
  ],
  "showstoppers": ["Critical blocking issue — only if genuinely blocking"],
  "exceptions": ["Exception found in responses"],
  "derogations": ["Derogation found in responses"]
}}
"""


@wfk.activity()
async def analyze_risks(text: str, vendor: str, project: str) -> RiskAnalysis:
    """
    Identifies risks and links them to question IDs.
    Level is NOT set here — recalculated by scorer from actual scores.
    Adds 3s delay between batches to avoid rate limiting.

    Dev-specific questions (3.1 AIS-01, 2.1 AAC-01, 8.1 ICS-02, 8.2 ICS-03,
    4.1 CCC-01) answered with "Not applicable" by non-developer vendors are
    collected in not_applicable_question_ids so the scorer can force a score
    of 4 on those items.
    """
    from mistralai.client import Mistral

    client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

    questions = parse_questions(text)
    if not questions:
        questions = fallback_parse(text)

    # --- Detect N/A answers on dev-specific questions before LLM batching ---
    not_applicable_ids: list[str] = []
    for q in questions:
        qid = q.get("question_id", "")
        if qid in DEV_SPECIFIC_QUESTION_IDS and _is_not_applicable(q.get("response", "")):
            not_applicable_ids.append(qid)

    batch_size = 25
    batches = [questions[i:i+batch_size] for i in range(0, len(questions), batch_size)]

    all_risks = []
    all_showstoppers = []
    all_exceptions = []
    all_derogations = []

    for i, batch in enumerate(batches):
        if not batch:
            continue

        # Wait between batches to avoid rate limiting (except first batch)
        if i > 0:
            await asyncio.sleep(3)

        prompt = _build_batch_prompt(batch, vendor, project)

        # Retry once on rate limit
        for attempt in range(2):
            try:
                response = client.chat.complete(
                    model="mistral-large-latest",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    temperature=0.2,
                )
                break
            except Exception as e:
                if "429" in str(e) and attempt == 0:
                    await asyncio.sleep(10)  # wait 10s on rate limit then retry
                else:
                    raise

        data = json.loads(response.choices[0].message.content)

        for r in data.get("risks", []):
            all_risks.append({
                "title":                r.get("title", ""),
                "level":               "Medium",  # placeholder
                "description":         r.get("description", ""),
                "recommendation":      r.get("recommendation", ""),
                "related_question_ids": r.get("related_question_ids", []),
            })
        all_showstoppers.extend(data.get("showstoppers", []))
        all_exceptions.extend(data.get("exceptions", []))
        all_derogations.extend(data.get("derogations", []))

    # Deduplicate risks by title
    seen_titles = set()
    unique_risks = []
    for r in all_risks:
        if r["title"] not in seen_titles:
            seen_titles.add(r["title"])
            unique_risks.append(r)

    return RiskAnalysis(
        executive_summary="",
        risks=[Risk(**r) for r in unique_risks],
        exceptions=list(dict.fromkeys(all_exceptions)),
        derogations=list(dict.fromkeys(all_derogations)),
        overall_score="Medium",
        final_decision="Pending",
        showstoppers=list(dict.fromkeys(all_showstoppers)),
        not_applicable_question_ids=list(dict.fromkeys(not_applicable_ids)),
    )