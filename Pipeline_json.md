Étape 1 — Ingestion Agent
Objectif

Normaliser toutes les données entrantes :

Questionnaire TPRA
Réponses fournisseur
Pièces jointes
Métadonnées fournisseur

Détection de langue et traduction éventuelle.

Input
{
  "vendor": {
    "name": "Acme Cloud",
    "country": "Germany",
    "industry": "SaaS"
  },
  "questions": [
    {
      "question_id": "Q12",
      "topic": "Encryption",
      "question": "How do you encrypt sensitive data?",
      "answer": "We use encryption."
    }
  ],
  "attachments": [
    {
      "attachment_id": "ATT01",
      "filename": "soc2.png"
    }
  ]
}
Output
{
  "vendor": {
    "name": "Acme Cloud",
    "country": "Germany",
    "industry": "SaaS",
    "assessment_date": "2026-06-02"
  },
  "normalized_questions": [
    {
      "question_id": "Q12",
      "topic": "Encryption",
      "question": "How do you encrypt sensitive data?",
      "answer_original": "We use encryption.",
      "answer_translated": "Nous utilisons du chiffrement.",
      "language": "en"
    }
  ],
  "normalized_attachments": [
    {
      "attachment_id": "ATT01",
      "filename": "soc2.png",
      "file_type": "png"
    }
  ]
}
Étape 2 — Translation Agent
Objectif

Créer une version bilingue exploitable par tous les agents.

Input
{
  "question_id": "Q12",
  "answer": "Wir verwenden AES-256."
}
Output
{
  "question_id": "Q12",
  "detected_language": "de",
  "answer_original": "Wir verwenden AES-256.",
  "answer_fr": "Nous utilisons AES-256.",
  "answer_en": "We use AES-256."
}
Étape 3 — Attachment Analyzer
Objectif

OCR + classification + extraction de métadonnées.

Input
{
  "attachment_id": "ATT01",
  "filename": "soc2.png"
}
Output
{
  "attachment_id": "ATT01",
  "filename": "soc2.png",
  "file_type": "png",
  "classification": "certificate",
  "is_relevant": true,
  "is_valid": true,
  "extracted_data": {
    "certificate_type": "SOC 2 Type II",
    "issuer": "AICPA",
    "valid_from": "2025-01-01",
    "valid_until": "2027-01-01",
    "detected_language": "en"
  },
  "issues": [],
  "summary": "SOC2 certificate valid until 2027."
}
Étape 4 — Response Challenger Agent
Objectif

Évaluer la qualité de la réponse.

Input
{
  "question": "How do you encrypt sensitive data?",
  "answer": "We use encryption.",
  "attachments": []
}
Output
{
  "question_id": "Q12",
  "topic": "Encryption",
  "question": "How do you encrypt sensitive data?",
  "answer": "We use encryption.",
  "score": 2,
  "flags": [
    "generic_answer",
    "missing_evidence"
  ],
  "reasoning": "Encryption is mentioned but no algorithm or proof is provided.",
  "follow_up_questions": [
    "Which encryption algorithm is used?",
    "Do you use AES-256 or equivalent?",
    "Can you provide evidence?"
  ],
  "evidence_linked": [],
  "confidence": 0.92
}
Étape 5 — Evidence Matcher
Objectif

Associer les pièces jointes aux questions.

Input
{
  "question_id": "Q22",
  "question": "Provide your SOC2 report.",
  "attachments": [
    "ATT01"
  ]
}
Output
{
  "question_id": "Q22",
  "linked_evidence": [
    "ATT01"
  ],
  "coverage_score": 0.95,
  "missing_evidence": []
}
Étape 6 — Contradiction Detector
Objectif

Détecter les incohérences.

Input
{
  "question": "Have you suffered a breach?",
  "answer": "No incidents.",
  "attachment": "Incident Report 2025"
}
Output
{
  "contradiction_id": "CONT01",
  "severity": "critical",
  "question_id": "Q44",
  "description": "Supplier claims no incidents but attached report mentions a security breach in 2025.",
  "evidence_ids": [
    "ATT05"
  ]
}
Étape 7 — Security Rating Agent
Objectif

Enrichissement externe.

Input
{
  "domain": "acmecloud.com"
}
Output
{
  "provider": "SecurityScorecard",
  "overall_score": "C",
  "critical_vulnerabilities": 7,
  "incidents_last_12_months": 2,
  "risk_level": "high"
}
Étape 8 — Showstopper Engine
Objectif

Détecter les risques bloquants.

Input
{
  "question_id": "Q12",
  "topic": "Encryption",
  "score": 1
}
Output
{
  "showstopper_id": "SHOW01",
  "topic": "Encryption",
  "question_id": "Q12",
  "severity": "critical",
  "reason": "No evidence of encryption controls.",
  "recommendation": "Provide encryption architecture and technical controls."
}
Étape 9 — Recommendation Generator
Objectif

Construire les actions correctives.

Input
{
  "showstoppers": [
    "SHOW01"
  ],
  "contradictions": [
    "CONT01"
  ]
}
Output
[
  {
    "recommendation_id": "REC01",
    "priority": "critical",
    "topic": "Encryption",
    "action": "Provide encryption standards, key management process and evidence."
  },
  {
    "recommendation_id": "REC02",
    "priority": "high",
    "topic": "Incident Management",
    "action": "Clarify breach history and provide incident response documentation."
  }
]
Étape 10 — Topic Score Calculator
Objectif

Calculer la maturité par domaine.

Input
[
  {
    "topic": "Encryption",
    "score": 2
  },
  {
    "topic": "Encryption",
    "score": 3
  },
  {
    "topic": "Encryption",
    "score": 4
  }
]
Output
{
  "topic": "Encryption",
  "average_score": 3.0,
  "question_count": 3,
  "showstopper_count": 1
}
Étape 11 — Executive Summary Agent
Objectif

Créer une synthèse directionnelle.

Output
{
  "strengths": [
    "Valid SOC2 certificate",
    "Good GDPR maturity"
  ],
  "weaknesses": [
    "Weak encryption evidence",
    "Missing incident process details"
  ],
  "key_risks": [
    "Potential non-compliance",
    "Insufficient technical documentation"
  ]
}
Étape 12 — Final Decision Agent
Objectif

Produire la décision finale.

Input
{
  "overall_score": 2.8,
  "showstopper_count": 2,
  "critical_contradictions": 1
}
Output
{
  "status": "approved_with_conditions",
  "overall_score": 2.8,
  "showstopper_count": 2,
  "summary": "Supplier demonstrates acceptable controls but remediation is required before approval."
}
Sortie finale du pipeline

L'orchestrateur assemble alors tous les résultats dans l'objet final :

{
  "vendor": {...},
  "executive_summary": {...},
  "questions": [...],
  "attachments": [...],
  "contradictions": [...],
  "showstoppers": [...],
  "recommendations": [...],
  "topic_scores": [...],
  "security_rating": {...},
  "final_decision": {...}
}

Ce JSON final correspond exactement à ton modèle TPRAAssessment et peut être directement envoyé vers :

un dashboard React/Plotly,
un export PDF,
une API REST,
un workflow ServiceNow/Jira,
ou un agent de validation final ("Judge Agent").



┌─────────────────────┐
                    │ TPRA Questionnaire  │
                    │ + Attachments       │
                    └──────────┬──────────┘
                               │
                               ▼
                 ┌─────────────────────────┐
                 │ Agent 1 - Ingestion     │
                 │ Parsing + Translation   │
                 └──────────┬──────────────┘
                            │
                            ▼
                 ┌─────────────────────────┐
                 │ Agent 2 - Attachment    │
                 │ Analyzer                │
                 │ OCR / EML / Validation  │
                 └──────────┬──────────────┘
                            │
                            ▼
                 ┌─────────────────────────┐
                 │ Agent 3 - Response      │
                 │ Challenger              │
                 │ Score 1→4               │
                 └──────────┬──────────────┘
                            │
                            ▼
                 ┌─────────────────────────┐
                 │ Agent 4 - Contradiction │
                 │ Detector                │
                 └──────────┬──────────────┘
                            │
                            ▼
                 ┌─────────────────────────┐
                 │ Agent 5 - Risk Engine   │
                 │ Showstopper Detection   │
                 └──────────┬──────────────┘
                            │
                            ▼
                 ┌─────────────────────────┐
                 │ Agent 6 - Security      │
                 │ Scorecard Enrichment    │
                 └──────────┬──────────────┘
                            │
                            ▼
                 ┌─────────────────────────┐
                 │ Agent 7 - Report Agent  │
                 │ Executive Summary       │
                 └──────────┬──────────────┘
                            │
                            ▼
                     TPRAAssessment