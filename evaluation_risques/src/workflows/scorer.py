"""
scorer.py
=========
Single-agent version.
Scores questions (1-4), piece_jointe, showstoppers, recalculates risk levels.
"""

import asyncio
import json
import os

import mistralai.workflows as wfk
from pydantic import BaseModel

from workflows.utils import parse_questions, fallback_parse, score_to_level


# ---------------------------------------------------------------------------
# Modèles de données
# ---------------------------------------------------------------------------

class QuestionScore(BaseModel):
    question_id: str
    question: str
    response: str
    score: int
    justification: str
    is_showstopper: bool
    flag_reason: str
    follow_up_question: str
    piece_jointe: str = ""


class ScoringResult(BaseModel):
    global_score: float
    low_score_count: int
    showstopper_count: int
    question_scores: list[QuestionScore]
    updated_risks: list[dict]
    overall_score: str
    final_decision: str
    executive_summary: str


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------

def _build_batch_prompt(batch: list[dict], vendor: str, risks_summary: str) -> str:
    questions_text = "\n\n".join(
        f"ID: {q['question_id']}\n"
        f"Question: {q['question']}\n"
        f"Response: {q['response']}"
        for q in batch
    )
    return f"""
You are a cybersecurity auditor scoring a TPRA questionnaire. Be fair and calibrated.

Vendor: {vendor}

Identified risks context:
{risks_summary if risks_summary else "No specific risks identified."}

Score each question-response pair using this scale:
- 1 = Non-compliant: Response is missing, off-topic, one word ("Yes.", "We comply."),
      or has critical gaps with no explanation whatsoever.
- 2 = Partially compliant: Response exists but is vague or generic. No named tools,
      no process details, no concrete measures. Could apply to any company.
- 3 = Compliant: Response is detailed and specific. Names tools, standards, or processes
      (e.g. "We use AES-256", "We follow OWASP ASVS", "Our MDM pushes patches via X").
      No attached proof required to reach this score.
- 4 = Mature: Response is complete, specific AND references verifiable evidence
      (audit reports, named certifications with scope, documented SLAs, test results).

Calibration rules:
- A response naming specific tools, standards or concrete processes → minimum score 3.
- Only score 2 if the response is genuinely vague despite being present.
- Only score 1 if the response is absent, one-liner, or completely off-topic.

Showstopper rules — is_showstopper = true ONLY if BOTH conditions are met:
  1. Score is EXACTLY 1 (Non-compliant). Score 2, 3, or 4 → NEVER a showstopper.
  2. AND the topic is one of these specific critical areas only:
       - Data encryption at rest or in transit (absent or broken)
       - GDPR compliance (no process at all for personal data protection)
       - Personal data breach notification process (completely absent)
       - Data access control (no authentication or authorization at all)
       - Data residency / data sovereignty violation
Any other topic, even with score 1, is NOT a showstopper.
Score 2, 3, or 4 → NEVER a showstopper, no exceptions.

Piece jointe rules:
- "piece_jointe" is a TRACKING field only. It NEVER affects the score — do not lower
  the score because an attachment seems missing or has not been provided.
- Set "piece_jointe" to the name of the expected document if the question explicitly
  asks for evidence, certificates, reports, or attachments (e.g. "attach ISO certificate",
  "provide pentest report", "evidence of certification", "attach audit results").
- If the vendor's response mentions providing a document but has not attached it, name it.
- If no attachment is needed or already provided, set "piece_jointe" to "".
- Score the written response on its own merits, regardless of whether a document is attached.

Process EVERY question, skip none.

Questions to score:
---
{questions_text}
---

Respond ONLY with valid JSON:
{{
  "question_scores": [
    {{
      "question_id": "2.1 AAC-01",
      "question": "Full question text",
      "response": "Vendor response (max 200 chars)",
      "score": 3,
      "justification": "Short explanation (max 100 chars)",
      "is_showstopper": false,
      "flag_reason": "Why flagged, or empty string",
      "follow_up_question": "Follow-up if needed, or empty string",
      "piece_jointe": "Expected document name, or empty string if none"
    }}
  ]
}}
"""


# ---------------------------------------------------------------------------
# Activité unique
# ---------------------------------------------------------------------------

@wfk.activity()
async def score_responses(text: str, vendor: str, analysis: dict) -> ScoringResult:
    """
    Scores every question (1-4), recalculates risk levels.
    Adds 3s delay between batches to avoid rate limiting.

    Dev-specific questions (3.1 AIS-01, 2.1 AAC-01, 8.1 ICS-02, 8.2 ICS-03,
    4.1 CCC-01) answered "Not applicable" by non-developer vendors have their
    score forced to 4 (passed via not_applicable_question_ids from analyzer).
    """
    from mistralai.client import Mistral

    client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

    risks_summary = "\n".join(
        f"- {r['title']}: {r['description'][:120]}"
        for r in analysis.get("risks", [])
    )

    questions = parse_questions(text)
    if not questions:
        questions = fallback_parse(text)

    batch_size = 25
    batches    = [questions[i:i + batch_size] for i in range(0, len(questions), batch_size)]
    all_scores = []

    for i, batch in enumerate(batches):
        if not batch:
            continue

        if i > 0:
            await asyncio.sleep(3)

        prompt = _build_batch_prompt(batch, vendor, risks_summary)

        for attempt in range(2):
            try:
                response = client.chat.complete(
                    model="mistral-large-latest",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                )
                break
            except Exception as e:
                if "429" in str(e) and attempt == 0:
                    await asyncio.sleep(10)
                else:
                    raise

        data = json.loads(response.choices[0].message.content)
        all_scores.extend(data.get("question_scores", []))

    # Force score=4 for dev-specific questions answered "Not applicable"
    # (list provided by analyzer.py — empty for developer-company vendors)
    not_applicable_ids = set(analysis.get("not_applicable_question_ids", []))
    for s in all_scores:
        if s.get("question_id", "") in not_applicable_ids:
            s["score"]          = 4
            s["is_showstopper"] = False
            s["flag_reason"]    = ""
            s["justification"]  = "Not applicable for non-developer vendor — score set to 4."

    # Déduplication + normalisation
    seen = set()
    unique_scores = []
    for s in all_scores:
        qid = s.get("question_id", "")
        if qid not in seen:
            seen.add(qid)
            s["score"]              = max(1, min(4, int(s.get("score", 2))))
            s["is_showstopper"]     = bool(s.get("is_showstopper", False))
            s["flag_reason"]        = s.get("flag_reason", "")
            s["follow_up_question"] = s.get("follow_up_question", "")
            s["piece_jointe"]       = str(s.get("piece_jointe", ""))
            unique_scores.append(s)

    scores_by_id = {s["question_id"]: s["score"] for s in unique_scores}

    # Recalcul des niveaux de risque
    risks = analysis.get("risks", [])
    for risk in risks:
        related_ids    = risk.get("related_question_ids", [])
        related_scores = [scores_by_id[qid] for qid in related_ids if qid in scores_by_id]
        avg = (
            sum(related_scores) / len(related_scores)
            if related_scores
            else (sum(scores_by_id.values()) / len(scores_by_id) if scores_by_id else 2.0)
        )
        risk["level"] = score_to_level(avg)

    # Décision finale
    level_order = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
    overall      = max(risks, key=lambda r: level_order.get(r["level"], 0))["level"] if risks else "Low"
    showstoppers = analysis.get("showstoppers", [])

    if showstoppers or overall == "Critical":
        final_decision = "Rejected"
    elif overall == "High":
        final_decision = "Approved with conditions"
    else:
        final_decision = "Approved"

    # Résumé exécutif
    top_risks_str     = ", ".join(f'[{r["level"]}] {r["title"]}' for r in risks[:5])
    executive_summary = f"{vendor} — {final_decision}. Overall risk: {overall}."
    await asyncio.sleep(2)
    for attempt in range(2):
        try:
            sr = client.chat.complete(
                model="mistral-large-latest",
                messages=[{"role": "user", "content": (
                    f"Write a 3-4 sentence executive summary for vendor {vendor}.\n"
                    f"Decision: {final_decision} | Overall risk: {overall}\n"
                    f"Showstoppers: {len(showstoppers)}\n"
                    f"Top risks: {top_risks_str}\n"
                    f"Respond with ONLY the summary text."
                )}],
                temperature=0.2,
            )
            executive_summary = sr.choices[0].message.content.strip()
            break
        except Exception as e:
            if "429" in str(e) and attempt == 0:
                await asyncio.sleep(10)
            else:
                break

    global_score      = round(sum(s["score"] for s in unique_scores) / len(unique_scores), 2) if unique_scores else 0.0
    low_score_count   = sum(1 for s in unique_scores if s["score"] <= 2)
    showstopper_count = sum(1 for s in unique_scores if s["is_showstopper"])

    return ScoringResult(
        global_score=global_score,
        low_score_count=low_score_count,
        showstopper_count=showstopper_count,
        question_scores=[QuestionScore(**s) for s in unique_scores],
        updated_risks=risks,
        overall_score=overall,
        final_decision=final_decision,
        executive_summary=executive_summary,
    )