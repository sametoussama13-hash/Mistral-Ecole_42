"""
scorer.py
=========
Architecture parallèle par groupe de 5 questions.

Pour chaque groupe de 5 questions, 3 workers LLM lancés simultanément :
  asyncio.gather(
    _score_group()       — scoring 1-4 + justification + flag_reason + follow_up
    _analyze_group()     — risks + showstoppers du groupe
    _piece_jointe_group() — détection des pièces jointes attendues
  )

Concurrence globale limitée à 10 appels simultanés via asyncio.Semaphore.
Pour 70 questions → 14 groupes × 3 workers = 42 slots, max 10 en parallèle.

Activités exposées au workflow :
  score_questions()       — Agent 1 : scores bruts parallélisés
  evaluate_showstoppers() — Agent 2 : décision finale + résumé exécutif
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


class RawScoresResult(BaseModel):
    """Résultat intermédiaire : scores + risks + pièces jointes agrégés."""
    unique_scores: list[dict]
    scores_by_id: dict[str, int]
    aggregated_risks: list[dict]
    aggregated_showstoppers: list[str]
    global_score: float
    low_score_count: int


class ScoringResult(BaseModel):
    """Résultat final complet, consommé par router.py et reporter."""
    global_score: float
    low_score_count: int
    showstopper_count: int
    question_scores: list[QuestionScore]
    updated_risks: list[dict]
    overall_score: str
    final_decision: str
    executive_summary: str


# ---------------------------------------------------------------------------
# Helpers — troncature + découpage
# ---------------------------------------------------------------------------

_Q_MAX_CHARS = 600
_R_MAX_CHARS = 1_200
_GROUP_SIZE  = 5    # → 14 groupes pour 70 questions
_MAX_CONCURRENT_CALLS = 10  # Semaphore : max appels LLM simultanés


def _smart_truncate(text: str, max_chars: int) -> str:
    """Conserve début ET fin pour ne pas perdre certifications/audits en fin de réponse."""
    if len(text) <= max_chars:
        return text
    keep = max_chars - 7
    half = keep // 2
    return text[:half] + " [...] " + text[-half:]


def _make_groups(questions: list[dict], group_size: int = _GROUP_SIZE) -> list[list[dict]]:
    """Découpe la liste en groupes de taille fixe."""
    return [questions[i:i + group_size] for i in range(0, len(questions), group_size)]


# ---------------------------------------------------------------------------
# Prompts système — fixes, identiques pour tous les groupes
# ---------------------------------------------------------------------------

# Scoring pur : 1-4 + justification + flag + follow_up.
# piece_jointe retiré → délégué à _piece_jointe_group.
_SCORING_SYSTEM_PROMPT = """You are a cybersecurity auditor scoring TPRA questionnaire responses. Be fair and calibrated.

Score each question-response pair using this scale:
- 1 = Non-compliant: Response is missing, off-topic, one word ("Yes.", "We comply."), or has critical gaps with no explanation whatsoever.
- 2 = Partially compliant: Response exists but is vague or generic. No named tools, no process details, no concrete measures. Could apply to any company.
- 3 = Compliant: Response is detailed and specific. Names tools, standards, or processes (e.g. "We use AES-256", "We follow OWASP ASVS", "Our MDM pushes patches via X"). No attached proof required.
- 4 = Mature: Response is complete, specific AND references verifiable evidence (audit reports, named certifications with scope, documented SLAs, test results).

Calibration rules:
- A response naming specific tools, standards or concrete processes → minimum score 3.
- Only score 2 if the response is genuinely vague despite being present.
- Only score 1 if the response is absent, one-liner, or completely off-topic.

Process EVERY question, skip none.
Respond ONLY with valid JSON — no preamble, no markdown fences."""


# Analyse des risques par groupe.
_ANALYSIS_SYSTEM_PROMPT = """You are a cybersecurity expert performing a TPRA analysis.
Identify REAL cybersecurity risks strictly based on what the vendor actually said.
Only raise a risk if the response reveals an actual gap or weakness.
Do NOT invent risks. Do NOT include a "level" field — it will be computed later.
Respond ONLY with valid JSON — no preamble, no markdown fences."""


# Détection des pièces jointes — prompt minimal, tâche unique et ciblée.
# Ne fait QUE détecter si une pièce jointe est attendue ou manquante.
_PIECE_JOINTE_SYSTEM_PROMPT = """You are a document compliance reviewer.
For each question-response pair, determine if an attachment is expected or missing.

Rules:
- Set "piece_jointe" to the expected document name if the question explicitly asks for
  evidence, certificates, reports, or attachments (e.g. ISO certificate, pentest report,
  audit results, SLA document, certification scope).
- If the vendor mentions providing a document but has not attached it, name that document.
- If no attachment is needed or already provided, set "piece_jointe" to "".

Respond ONLY with valid JSON — no preamble, no markdown fences."""


# ---------------------------------------------------------------------------
# Builders de prompts dynamiques (partie user)
# ---------------------------------------------------------------------------

def _build_scoring_prompt(group: list[dict], vendor: str, risks_summary: str) -> str:
    questions_text = "\n\n".join(
        f"ID: {q['question_id']}\n"
        f"Question: {_smart_truncate(q['question'], _Q_MAX_CHARS)}\n"
        f"Response: {_smart_truncate(q['response'], _R_MAX_CHARS)}"
        for q in group
    )
    return f"""Vendor: {vendor}

Identified risks context:
{risks_summary if risks_summary else "No specific risks identified."}

Questions to score:
---
{questions_text}
---

Return this JSON structure:
{{
  "question_scores": [
    {{
      "question_id": "2.1 AAC-01",
      "question": "Full question text",
      "response": "Vendor response (max 200 chars)",
      "score": 3,
      "justification": "Short explanation (max 100 chars)",
      "flag_reason": "Why flagged, or empty string",
      "follow_up_question": "Follow-up question if needed, or empty string"
    }}
  ]
}}"""


def _build_analysis_prompt(group: list[dict], vendor: str, project: str) -> str:
    available_ids  = [q["question_id"] for q in group]
    questions_text = "\n\n".join(
        f"ID: {q['question_id']}\n"
        f"Question: {_smart_truncate(q['question'], _Q_MAX_CHARS)}\n"
        f"Response: {_smart_truncate(q['response'], _R_MAX_CHARS)}"
        for q in group
    )
    return f"""Vendor: {vendor} | Project: {project}
Available question IDs in this group: {available_ids}

Questions:
---
{questions_text}
---

Return this JSON structure:
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
  "exceptions": [],
  "derogations": []
}}"""


def _build_piece_jointe_prompt(group: list[dict]) -> str:
    """Prompt minimal : uniquement les IDs, questions et réponses. Pas de vendor/risks."""
    questions_text = "\n\n".join(
        f"ID: {q['question_id']}\n"
        f"Question: {_smart_truncate(q['question'], _Q_MAX_CHARS)}\n"
        f"Response: {_smart_truncate(q['response'], _R_MAX_CHARS)}"
        for q in group
    )
    return f"""Questions:
---
{questions_text}
---

Return this JSON structure:
{{
  "piece_jointes": [
    {{
      "question_id": "2.1 AAC-01",
      "piece_jointe": "Expected document name, or empty string if none"
    }}
  ]
}}"""


# ---------------------------------------------------------------------------
# Helper LLM — appel atomique avec semaphore + retry 429
# ---------------------------------------------------------------------------

async def _call_llm(
    client,
    sem: asyncio.Semaphore,
    system: str,
    user: str,
    temperature: float = 0.1,
) -> dict:
    """
    Appel LLM protégé par semaphore (max _MAX_CONCURRENT_CALLS simultanés)
    et retry automatique sur erreur 429.
    """
    async with sem:
        for attempt in range(2):
            try:
                response = client.chat.complete(
                    model="mistral-large-latest",
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user",   "content": user},
                    ],
                    response_format={"type": "json_object"},
                    temperature=temperature,
                )
                return json.loads(response.choices[0].message.content)
            except Exception as e:
                if "429" in str(e) and attempt == 0:
                    await asyncio.sleep(10)
                else:
                    raise
    return {}


# ---------------------------------------------------------------------------
# Workers par groupe — 3 appels parallèles par groupe
# ---------------------------------------------------------------------------

async def _score_group(
    client,
    sem: asyncio.Semaphore,
    group: list[dict],
    vendor: str,
    risks_summary: str,
) -> list[dict]:
    """Scores 1-4 + justification + flag_reason + follow_up pour 5 questions."""
    prompt = _build_scoring_prompt(group, vendor, risks_summary)
    data   = await _call_llm(client, sem, _SCORING_SYSTEM_PROMPT, prompt, temperature=0.1)
    return data.get("question_scores", [])


async def _analyze_group(
    client,
    sem: asyncio.Semaphore,
    group: list[dict],
    vendor: str,
    project: str,
) -> dict:
    """Risks + showstoppers + exceptions + derogations pour 5 questions."""
    prompt = _build_analysis_prompt(group, vendor, project)
    data   = await _call_llm(client, sem, _ANALYSIS_SYSTEM_PROMPT, prompt, temperature=0.2)
    return {
        "risks":        data.get("risks", []),
        "showstoppers": data.get("showstoppers", []),
        "exceptions":   data.get("exceptions", []),
        "derogations":  data.get("derogations", []),
    }


async def _piece_jointe_group(
    client,
    sem: asyncio.Semaphore,
    group: list[dict],
) -> dict[str, str]:
    """
    Détecte les pièces jointes attendues ou manquantes pour 5 questions.
    Retourne un dict { question_id → piece_jointe }.
    Prompt minimal : pas de vendor, pas de risks — uniquement les Q/R.
    """
    prompt = _build_piece_jointe_prompt(group)
    data   = await _call_llm(client, sem, _PIECE_JOINTE_SYSTEM_PROMPT, prompt, temperature=0.0)
    return {
        item["question_id"]: item.get("piece_jointe", "")
        for item in data.get("piece_jointes", [])
        if "question_id" in item
    }


# ---------------------------------------------------------------------------
# Agent 1 — score_questions : 3 workers parallèles par groupe
# ---------------------------------------------------------------------------

@wfk.activity()
async def score_questions(
    text: str,
    vendor: str,
    analysis: dict,
) -> RawScoresResult:
    """
    Agent 1 : découpe les questions en groupes de 5, puis pour chaque groupe
    lance en parallèle via asyncio.gather :
      - _score_group()        → scores 1-4
      - _analyze_group()      → risks + showstoppers
      - _piece_jointe_group() → pièces jointes attendues

    Concurrence globale limitée à _MAX_CONCURRENT_CALLS via Semaphore.
    Pour 70 questions :
      14 groupes × 3 workers = 42 appels, max 10 simultanés.
    """
    from mistralai.client import Mistral

    client  = Mistral(api_key=os.environ["MISTRAL_API_KEY"])
    sem     = asyncio.Semaphore(_MAX_CONCURRENT_CALLS)
    project = analysis.get("project", "Not specified")

    risks_summary = "\n".join(
        f"- {r['title']}: {r['description'][:120]}"
        for r in analysis.get("risks", [])
    )

    questions = parse_questions(text)
    if not questions:
        questions = fallback_parse(text)

    groups = _make_groups(questions, _GROUP_SIZE)

    # Lance tous les groupes en parallèle — chaque groupe = 3 appels simultanés.
    tasks = [
        asyncio.gather(
            _score_group(client, sem, group, vendor, risks_summary),
            _analyze_group(client, sem, group, vendor, project),
            _piece_jointe_group(client, sem, group),
        )
        for group in groups
    ]
    results = await asyncio.gather(*tasks)

    # Agrégation
    all_scores:       list[dict]      = []
    all_risks:        list[dict]      = []
    all_showstoppers: list[str]       = []
    piece_jointes_map: dict[str, str] = {}   # question_id → piece_jointe

    for scores, analysis_result, pj_map in results:
        all_scores.extend(scores)
        for r in analysis_result["risks"]:
            all_risks.append({
                "title":                r.get("title", ""),
                "level":               "Medium",   # placeholder, recalculé par Agent 2
                "description":         r.get("description", ""),
                "recommendation":      r.get("recommendation", ""),
                "related_question_ids": r.get("related_question_ids", []),
            })
        all_showstoppers.extend(analysis_result["showstoppers"])
        piece_jointes_map.update(pj_map)

    # Déduplication des scores + injection piece_jointe depuis le worker dédié
    seen = set()
    unique_scores: list[dict] = []
    for s in all_scores:
        qid = s.get("question_id", "")
        if qid not in seen:
            seen.add(qid)
            s["score"]              = max(1, min(4, int(s.get("score", 2))))
            s["is_showstopper"]     = False   # calculé de façon déterministe par Agent 2
            s["flag_reason"]        = s.get("flag_reason", "")
            s["follow_up_question"] = s.get("follow_up_question", "")
            s["piece_jointe"]       = piece_jointes_map.get(qid, "")  # ← worker dédié
            unique_scores.append(s)

    # Déduplication des risks par titre
    seen_titles: set[str] = set()
    unique_risks: list[dict] = []
    for r in all_risks:
        if r["title"] not in seen_titles:
            seen_titles.add(r["title"])
            unique_risks.append(r)

    scores_by_id    = {s["question_id"]: s["score"] for s in unique_scores}
    global_score    = round(sum(s["score"] for s in unique_scores) / len(unique_scores), 2) if unique_scores else 0.0
    low_score_count = sum(1 for s in unique_scores if s["score"] <= 2)

    return RawScoresResult(
        unique_scores=unique_scores,
        scores_by_id=scores_by_id,
        aggregated_risks=unique_risks,
        aggregated_showstoppers=list(dict.fromkeys(all_showstoppers)),
        global_score=global_score,
        low_score_count=low_score_count,
    )


# ---------------------------------------------------------------------------
# Agent 2 — evaluate_showstoppers : décision finale déterministe
# ---------------------------------------------------------------------------

_CRITICAL_TOPICS = (
    "encrypt",         # data encryption at rest / in transit
    "gdpr",            # GDPR compliance
    "breach",          # personal data breach notification
    "access control",  # data access control / authentication
    "data residen",    # data residency / sovereignty
    "data sovereign",
)


def _is_critical_topic(question_text: str) -> bool:
    q_lower = question_text.lower()
    return any(kw in q_lower for kw in _CRITICAL_TOPICS)


@wfk.activity()
async def evaluate_showstoppers(
    vendor: str,
    analysis: dict,
    raw_scores: RawScoresResult,
) -> ScoringResult:
    """
    Agent 2 : consomme RawScoresResult et :
      1. Applique la règle showstopper DÉTERMINISTE (score==1 + topic critique)
      2. Fusionne les risks de l'analyzer initial + ceux collectés par score_questions
      3. Recalcule les niveaux de risque depuis les scores réels
      4. Détermine la décision finale
      5. Génère le résumé exécutif (1 appel LLM)
    """
    from mistralai.client import Mistral

    client        = Mistral(api_key=os.environ["MISTRAL_API_KEY"])
    unique_scores = raw_scores.unique_scores
    scores_by_id  = raw_scores.scores_by_id

    # 1. Règle showstopper déterministe
    for s in unique_scores:
        s["is_showstopper"] = (
            s["score"] == 1
            and _is_critical_topic(s.get("question", ""))
        )
    showstopper_count = sum(1 for s in unique_scores if s["is_showstopper"])

    # 2. Fusion risks : analyzer initial (priorité) + risks des groupes
    initial_risks   = analysis.get("risks", [])
    combined_risks  = list(initial_risks)
    existing_titles = {r["title"] if isinstance(r, dict) else r.title for r in initial_risks}
    for r in raw_scores.aggregated_risks:
        if r["title"] not in existing_titles:
            existing_titles.add(r["title"])
            combined_risks.append(r)

    # 3. Recalcul des niveaux de risque
    risks = []
    for r in combined_risks:
        r_dict         = r if isinstance(r, dict) else r.model_dump()
        related_ids    = r_dict.get("related_question_ids", [])
        related_scores = [scores_by_id[qid] for qid in related_ids if qid in scores_by_id]
        avg = (
            sum(related_scores) / len(related_scores)
            if related_scores
            else (sum(scores_by_id.values()) / len(scores_by_id) if scores_by_id else 2.0)
        )
        r_dict["level"] = score_to_level(avg)
        risks.append(r_dict)

    # 4. Décision finale
    level_order = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}
    overall = (
        max(risks, key=lambda r: level_order.get(r["level"], 0))["level"]
        if risks else "Low"
    )
    structural_showstoppers = list(dict.fromkeys(
        analysis.get("showstoppers", []) + raw_scores.aggregated_showstoppers
    ))
    total_showstoppers = len(structural_showstoppers) + showstopper_count

    if total_showstoppers > 0 or overall == "Critical":
        final_decision = "Rejected"
    elif overall == "High":
        final_decision = "Approved with conditions"
    else:
        final_decision = "Approved"

    # 5. Résumé exécutif — 1 seul appel LLM
    executive_summary = f"{vendor} — {final_decision}. Overall risk: {overall}."
    for attempt in range(2):
        try:
            top_risks_str = ", ".join(f"[{r['level']}] {r['title']}" for r in risks[:5])

            sr = client.chat.complete(
                model="mistral-large-latest",
                messages=[{"role": "user", "content": (
                    f"Write a 3-4 sentence executive summary for vendor {vendor}.\n"
                    f"Decision: {final_decision} | Overall risk: {overall}\n"
                    f"Showstoppers: {total_showstoppers}\n"
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

    return ScoringResult(
        global_score=raw_scores.global_score,
        low_score_count=raw_scores.low_score_count,
        showstopper_count=showstopper_count,
        question_scores=[QuestionScore(**s) for s in unique_scores],
        updated_risks=risks,
        overall_score=overall,
        final_decision=final_decision,
        executive_summary=executive_summary,
    )