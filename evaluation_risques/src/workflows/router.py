"""
router.py
=========
Entry point of the TPRA workflow.
Returns a structured JSON result usable by a dashboard.
"""

import mistralai.workflows as wfk
import mistralai.workflows.plugins.mistralai as workflows_mistralai
from pydantic import BaseModel
from enum import Enum
from typing import Optional


class SourceType(str, Enum):
    PDF = "pdf"
    EMAIL = "email"
    EXCEL = "excel"


class TPRAInput(BaseModel):
    vendor: str
    source_type: SourceType
    content: str
    project: Optional[str] = "Not specified"
    analyst: Optional[str] = "Analyst"


@wfk.workflow.define(
    name="tpra-evaluation",
    workflow_display_name="Third Party Risk Assessment (TPRA)",
    workflow_description="Automated cyber risk analysis with scoring and PDF export.",
)
class TPRAWorkflow(wfk.InteractiveWorkflow):

    @wfk.workflow.entrypoint
    async def run(self, input: TPRAInput) -> str:
        import json
        from workflows.extractor import extract_text
        from workflows.analyzer import analyze_risks
        from workflows.scorer import score_responses
        from workflows.reporter import generate_text_report, export_pdf

        # Step 1: Extract text
        text = await extract_text(input.source_type, input.content)

        # Step 2: Run analysis and scoring IN PARALLEL
        # Both call Mistral independently — faster than sequential
        analysis_task = analyze_risks(text, input.vendor, input.project)
        scoring_task = score_responses(text, input.vendor)

        analysis = await analysis_task
        scoring = await scoring_task

        # Step 3: Generate readable text report for the analyst
        text_report = await generate_text_report(
            analysis, scoring, input.vendor, input.project, input.analyst
        )

        # Step 4: Human validation pause
        await workflows_mistralai.send_assistant_message(
            f"TPRA Report ready for {input.vendor}.\n\n{text_report}"
        )
        confirmation = await self.wait_for_input(
            workflows_mistralai.AcceptDeclineConfirmation(
                description=f"Please review and validate the TPRA report for {input.vendor}.",
                accept_label="Approve report",
                decline_label="Reject report",
            )
        )
        if not workflows_mistralai.is_accepted(confirmation):
            return json.dumps({
                "status": "rejected",
                "vendor": input.vendor,
                "project": input.project,
                "analyst": input.analyst,
                "message": f"Report rejected by {input.analyst}.",
            })

        # Step 5: Export PDF
        pdf_path = await export_pdf(
            analysis, scoring, input.vendor, input.project, input.analyst, ""
        )

        # Step 6: Return structured JSON for the dashboard
        return json.dumps({
            "status": "approved",
            "vendor": input.vendor,
            "project": input.project,
            "analyst": input.analyst,
            "pdf_path": pdf_path,

            # --- Risk analysis ---
            "overall_score": analysis.overall_score,
            "executive_summary": analysis.executive_summary,
            "risks": [
                {
                    "title": r.title,
                    "level": r.level,
                    "description": r.description,
                    "recommendation": r.recommendation,
                }
                for r in analysis.risks
            ],
            "exceptions": analysis.exceptions,
            "derogations": analysis.derogations,

            # --- Scoring ---
            "global_score": scoring.global_score,
            "question_scores": [
                {
                    "question_id":   q.question_id,
                    "question":      q.question,
                    "response":      q.response,
                    "score":         q.score,
                    "justification": q.justification,
                }
                for q in scoring.question_scores
            ],
        })