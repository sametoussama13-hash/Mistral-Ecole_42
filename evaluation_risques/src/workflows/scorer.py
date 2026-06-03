"""
scorer.py
=========
Scores questions (1-4) AND recalculates risk levels from actual scores.
Added: asyncio.sleep between batches to avoid rate limiting.
"""

import asyncio
import json
import os

import mistralai.workflows as wfk
from pydantic import BaseModel

from workflows.utils import parse_questions, fallback_parse, score_to_level


class QuestionScore(BaseModel):
    question_id: str
    question: str
    response: str
    score: int
    justification: str
    is_showstopper: bool
    flag_reason: str
    follow_up_question: str


class ScoringResult(BaseModel):
    global_score: float
    low_score_count: int
    showstopper_count: int
    question_scores: list[QuestionScore]
    updated_risks: list[dict]
    overall_score: str
    final_decision: str
    executive_summary: str


def _build_batch_prompt(batch: list[dict], vendor: str, risks_summary: str) -> str:
    questions_text = "\n\n".join(
        f"ID: {q['question_id']}\n"
        f"Question: {q['question'][:300]}\n"
        f"Response: {q['response'][:500]}"
        for q in batch
    )
    return f"""
You are a cybersecurity auditor scoring a TPRA questionnaire. Be fair and calibrated.

Vendor: {vendor}

Identified risks context:
{risks_summary if risks_summary else "No specific risks identified."}

Score each question-response pair (1-4):
- 1 = Non-compliant: Missing, off-topic, or one-liner with no substance
- 2 = Partially compliant: Vague, generic, no named tools or processes
- 3 = Compliant: Detailed, names tools/standards/processes (no proof needed)
- 4 = Mature: Complete + references verifiable evidence (certs, audits, SLAs)

Rules:
- Names specific tools/standards → minimum score 3
- is_showstopper = true ONLY if score <= 2 AND topic is critical
- Process EVERY question, skip none

Questions:
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
      "flag_reason": "",
      "follow_up_question": ""
    }}
  ]
}}
"""


@wfk.activity()
async def score_responses(text: str, vendor: str, analysis: dict) -> ScoringResult:
    """
    Scores every question (1-4), recalculates risk levels.
    Adds 3s delay between batches to avoid rate limiting.
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
    batches = [questions[i:i+batch_size] for i in range(0, len(questions), batch_size)]
    all_scores = []

    for i, batch in enumerate(batches):
        if not batch:
            continue

        # Wait between batches to avoid rate limiting (except first batch)
        if i > 0:
            await asyncio.sleep(3)

        prompt = _build_batch_prompt(batch, vendor, risks_summary)

        # Retry once on rate limit
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

    # Deduplicate by question_id
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
            unique_scores.append(s)

    # Build lookup
    scores_by_id = {s["question_id"]: s["score"] for s in unique_scores}

    # Recalculate risk levels
    risks = analysis.get("risks", [])
    for risk in risks:
        related_ids = risk.get("related_question_ids", [])
        related_scores = [scores_by_id[qid] for qid in related_ids if qid in scores_by_id]
        avg = sum(related_scores) / len(related_scores) if related_scores \
              else (sum(scores_by_id.values()) / len(scores_by_id) if scores_by_id else 2.0)
        risk["level"] = score_to_level(avg)

    # Overall score + final decision
    level_order = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
    overall = max(risks, key=lambda r: level_order.get(r["level"], 0))["level"] if risks else "Low"
    showstoppers = analysis.get("showstoppers", [])

    if showstoppers or overall == "Critical":
        final_decision = "Rejected"
    elif overall == "High":
        final_decision = "Approved with conditions"
    else:
        final_decision = "Approved"

    # Executive summary — also with rate limit protection
    await asyncio.sleep(2)
    for attempt in range(2):
        try:
            sr = client.chat.complete(
                model="mistral-large-latest",
                messages=[{"role": "user", "content": f"""
Write a 3-4 sentence executive summary for vendor {vendor}.
Decision: {final_decision} | Overall risk: {overall}
Showstoppers: {len(showstoppers)}
Top risks: {', '.join(f'[{r["level"]}] {r["title"]}' for r in risks[:5])}
Respond with ONLY the summary text.
"""}],
                temperature=0.2,
            )
            executive_summary = sr.choices[0].message.content.strip()
            break
        except Exception as e:
            if "429" in str(e) and attempt == 0:
                await asyncio.sleep(10)
            else:
                executive_summary = f"{vendor} — {final_decision}. Overall risk: {overall}."

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