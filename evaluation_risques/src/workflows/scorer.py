"""
scorer.py
=========
Scores questions (1-4) AND recalculates risk levels from actual scores.
Returns both ScoringResult AND updated analysis dict.
"""

import json
import os
import re

import mistralai.workflows as wfk
from pydantic import BaseModel


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
    # Updated analysis fields — returned explicitly so router can use them
    updated_risks: list[dict]
    overall_score: str
    final_decision: str
    executive_summary: str


def _parse_questions(text: str) -> list[dict]:
    questions = []
    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue
        if re.match(r"^\d+\.\d+", line):
            parts = line.split("\t")
            if len(parts) >= 3:
                questions.append({
                    "question_id": parts[0].replace("*", "").strip(),
                    "question":    parts[1].strip(),
                    "response":    parts[2].strip(),
                })
            elif len(parts) == 2:
                questions.append({
                    "question_id": parts[0].replace("*", "").strip(),
                    "question":    parts[1].strip(),
                    "response":    "No response provided.",
                })
    return questions


def _fallback_parse(text: str) -> list[dict]:
    questions = []
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    for i, para in enumerate(paragraphs):
        questions.append({
            "question_id": f"P{i+1:03d}",
            "question":    para[:200],
            "response":    para[200:700] if len(para) > 200 else "See question.",
        })
    return questions


def _score_to_level(avg_score: float) -> str:
    if avg_score <= 1.5: return "Critical"
    if avg_score <= 2.5: return "High"
    if avg_score <= 3.5: return "Medium"
    return "Low"


def _build_batch_prompt(batch: list[dict], vendor: str, risks_summary: str) -> str:
    questions_text = "\n\n".join(
        f"ID: {q['question_id']}\n"
        f"Question: {q['question'][:300]}\n"
        f"Response: {q['response'][:500]}"
        for q in batch
    )
    return f"""
You are a cybersecurity auditor scoring a TPRA questionnaire.

Vendor: {vendor}

Identified risks context:
{risks_summary if risks_summary else "No specific risks identified."}

Score each question-response pair (1-4):
- 1 = Non-compliant: Missing, off-topic, or critically incomplete
- 2 = Partially compliant: Present but vague, without proof
- 3 = Compliant: Complete and detailed but without concrete evidence
- 4 = Mature: Complete, detailed, with evidence (certificates, audits)

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
      "score": 2,
      "justification": "Short explanation (max 100 chars)",
      "is_showstopper": false,
      "flag_reason": "Why flagged, or empty string",
      "follow_up_question": "Follow-up if needed, or empty string"
    }}
  ]
}}

Rules:
- Score MUST be 1, 2, 3, or 4 only.
- is_showstopper = true if score <= 2 AND topic is critical.
- Process EVERY question, skip none.
- Respond ONLY with JSON.
"""


@wfk.activity()
async def score_responses(text: str, vendor: str, analysis: dict) -> ScoringResult:
    """
    1. Scores every question (1-4)
    2. Recalculates risk levels from actual question scores
    3. Returns everything in ScoringResult (including updated risks)
    """
    from mistralai.client import Mistral

    client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

    risks_summary = "\n".join(
        f"- {r['title']}: {r['description'][:120]}"
        for r in analysis.get("risks", [])
    )

    questions = _parse_questions(text)
    if not questions:
        questions = _fallback_parse(text)

    batch_size = 25
    batches = [questions[i:i+batch_size] for i in range(0, len(questions), batch_size)]
    all_scores = []

    for batch in batches:
        if not batch:
            continue
        prompt = _build_batch_prompt(batch, vendor, risks_summary)
        response = client.chat.complete(
            model="mistral-large-latest",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        data = json.loads(response.choices[0].message.content)
        all_scores.extend(data.get("question_scores", []))

    # Deduplicate
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

    # Build lookup: question_id → score
    scores_by_id = {s["question_id"]: s["score"] for s in unique_scores}

    # Recalculate risk levels from linked question scores
    risks = analysis.get("risks", [])
    for risk in risks:
        related_ids = risk.get("related_question_ids", [])
        related_scores = [scores_by_id[qid] for qid in related_ids if qid in scores_by_id]

        if related_scores:
            avg = sum(related_scores) / len(related_scores)
        elif scores_by_id:
            # No linked questions → use global average
            avg = sum(scores_by_id.values()) / len(scores_by_id)
        else:
            avg = 2.0

        risk["level"] = _score_to_level(avg)

    # Recalculate overall_score
    level_order = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
    if risks:
        overall = max(risks, key=lambda r: level_order.get(r["level"], 0))["level"]
    else:
        overall = "Low"

    # Recalculate final_decision
    showstoppers = analysis.get("showstoppers", [])
    if showstoppers or overall == "Critical":
        final_decision = "Rejected"
    elif overall == "High":
        final_decision = "Approved with conditions"
    else:
        final_decision = "Approved"

    # Generate executive summary
    summary_prompt = f"""
Write a 3-4 sentence executive summary for vendor {vendor}.
Decision: {final_decision} | Overall risk: {overall}
Showstoppers: {len(showstoppers)}
Top risks: {', '.join(f'[{r["level"]}] {r["title"]}' for r in risks[:5])}
Respond with ONLY the summary text.
"""
    sr = client.chat.complete(
        model="mistral-large-latest",
        messages=[{"role": "user", "content": summary_prompt}],
        temperature=0.2,
    )
    executive_summary = sr.choices[0].message.content.strip()

    # Stats
    global_score = round(sum(s["score"] for s in unique_scores) / len(unique_scores), 2) if unique_scores else 0.0
    low_score_count = sum(1 for s in unique_scores if s["score"] <= 2)
    showstopper_count = sum(1 for s in unique_scores if s["is_showstopper"])

    return ScoringResult(
        global_score=global_score,
        low_score_count=low_score_count,
        showstopper_count=showstopper_count,
        question_scores=[QuestionScore(**s) for s in unique_scores],
        # Return updated analysis fields explicitly
        updated_risks=risks,
        overall_score=overall,
        final_decision=final_decision,
        executive_summary=executive_summary,
    )