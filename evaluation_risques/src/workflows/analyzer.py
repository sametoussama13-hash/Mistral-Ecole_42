"""
analyzer.py
===========
Analyzes vendor responses — Use Case 2.
Returns risks WITH related_question_ids so scorer can recalculate levels.
"""

import json
import os
import re

import mistralai.workflows as wfk
from pydantic import BaseModel


class Risk(BaseModel):
    title: str
    level: str                        # recalculated by scorer from question scores
    description: str
    recommendation: str
    related_question_ids: list[str]   # links risk → questions


class RiskAnalysis(BaseModel):
    executive_summary: str
    risks: list[Risk]
    exceptions: list[str]
    derogations: list[str]
    overall_score: str
    final_decision: str
    showstoppers: list[str]


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


def _build_batch_prompt(batch: list[dict], vendor: str, project: str) -> str:
    # List all available question IDs for this batch
    available_ids = [q["question_id"] for q in batch]
    questions_text = "\n\n".join(
        f"ID: {q['question_id']}\n"
        f"Question: {q['question'][:300]}\n"
        f"Response: {q['response'][:500]}"
        for q in batch
    )
    return f"""
You are a cybersecurity expert performing a TPRA for vendor "{vendor}", project "{project}".

Analyze these question-response pairs and identify cybersecurity risks.
READ THE ACTUAL RESPONSES carefully — base every finding on real content.

Available question IDs in this batch: {available_ids}

--- QUESTIONS ---
{questions_text}
---

For each risk, specify which question IDs it relates to (use ONLY IDs from the list above).

Respond ONLY with valid JSON:
{{
  "risks": [
    {{
      "title": "Short risk name",
      "description": "Risk based on actual vendor response",
      "recommendation": "Concrete mitigation action",
      "related_question_ids": ["2.1 AAC-01", "2.2 AAC-02"]
    }}
  ],
  "showstoppers": ["Critical blocking issue with question ID"],
  "exceptions": ["Exception found in responses"],
  "derogations": ["Derogation found in responses"]
}}

Rules:
- Base EVERY risk on actual vendor responses, not assumptions.
- related_question_ids must contain ONLY IDs from the available list above.
- Do NOT include a "level" field — it will be computed from question scores.
- Respond ONLY with JSON, no text before or after.
"""


@wfk.activity()
async def analyze_risks(text: str, vendor: str, project: str) -> RiskAnalysis:
    """
    Identifies risks and links them to question IDs.
    Level is NOT set here — it will be recalculated by scorer from actual scores.
    """
    from mistralai.client import Mistral

    client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

    questions = _parse_questions(text)
    if not questions:
        questions = _fallback_parse(text)

    batch_size = 25
    batches = [questions[i:i+batch_size] for i in range(0, len(questions), batch_size)]

    all_risks = []
    all_showstoppers = []
    all_exceptions = []
    all_derogations = []

    for batch in batches:
        if not batch:
            continue
        prompt = _build_batch_prompt(batch, vendor, project)
        response = client.chat.complete(
            model="mistral-large-latest",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        data = json.loads(response.choices[0].message.content)

        for r in data.get("risks", []):
            all_risks.append({
                "title":                r.get("title", ""),
                "level":               "Medium",  # placeholder — recalculated later
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

    unique_showstoppers = list(dict.fromkeys(all_showstoppers))
    unique_exceptions   = list(dict.fromkeys(all_exceptions))
    unique_derogations  = list(dict.fromkeys(all_derogations))

    # overall_score and final_decision are placeholders — recalculated after scoring
    return RiskAnalysis(
        executive_summary="",  # generated after scoring
        risks=[Risk(**r) for r in unique_risks],
        exceptions=unique_exceptions,
        derogations=unique_derogations,
        overall_score="Medium",      # placeholder
        final_decision="Pending",    # placeholder
        showstoppers=unique_showstoppers,
    )