"""
utils.py
========
Shared utilities — parsing and scoring helpers.
Used by both analyzer.py and scorer.py.
"""

import re


def parse_questions(text: str) -> list[dict]:
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


def fallback_parse(text: str) -> list[dict]:
    questions = []
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    for i, para in enumerate(paragraphs):
        questions.append({
            "question_id": f"P{i+1:03d}",
            "question":    para[:200],
            "response":    para[200:700] if len(para) > 200 else "See question.",
        })
    return questions


def score_to_level(avg: float) -> str:
    """
    Converts average score (1-4) to risk level.
    Called only when there are NO low scores (all related scores >= 3).
    In that case the only possible levels are 'Low' or 'Modéré'.
      - avg >= 3.5  → Low
      - 3.0 <= avg < 3.5 → Modéré
    """
    if avg >= 3.5:
        return "Low"
    return "Modéré"

