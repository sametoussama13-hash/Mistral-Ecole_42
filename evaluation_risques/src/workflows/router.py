"""
router.py
=========
TPRA workflow — Use Case 2.
Flow:
  1. extract_text
  2. analyze_risks      → identifies risks + related_question_ids
  3. score_responses    → scores questions + recalculates risk levels
  4. generate_text_report
  5. ⏸️ human validation
  6. export_excel
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
    workflow_description="TPRA Use Case 2 — scores 1-4, risk levels from scores, Excel export.",
)
class TPRAWorkflow(wfk.InteractiveWorkflow):

    @wfk.workflow.entrypoint
    async def run(self, input: TPRAInput) -> str:
        import json
        from workflows.extractor import extract_text
        from workflows.analyzer import analyze_risks, RiskAnalysis
        from workflows.scorer import score_responses
        from workflows.reporter import generate_text_report, export_excel

        # Step 1: Extract text
        text = await extract_text(input.source_type, input.content)

        # Step 2: Analyze risks (returns risks with related_question_ids, no levels yet)
        analysis = await analyze_risks(text, input.vendor, input.project)

        # Step 3: Score questions + recalculate risk levels from scores
        # analysis_dict is modified IN PLACE by scorer (levels + summary updated)
        analysis_dict = analysis.model_dump()
        scoring = await score_responses(text, input.vendor, analysis_dict)

        # Rebuild analysis with updated levels/summary from scorer
        analysis = RiskAnalysis(**analysis_dict)

        # Step 4: Generate text report for human review
        text_report = await generate_text_report(
            analysis_dict, scoring, input.vendor, input.project, input.analyst
        )

        # Step 5: Human validation ⏸️
        await workflows_mistralai.send_assistant_message(
            f"TPRA Report ready for {input.vendor}.\n\n"
            f"Decision: {analysis.final_decision} | "
            f"Score: {scoring.global_score:.1f}/4.0 | "
            f"Showstoppers: {scoring.showstopper_count}\n\n"
            f"{text_report}"
        )
        confirmation = await self.wait_for_input(
            workflows_mistralai.AcceptDeclineConfirmation(
                description=(
                    f"Review TPRA for {input.vendor} — "
                    f"Decision: {analysis.final_decision} | "
                    f"Score: {scoring.global_score:.1f}/4.0 | "
                    f"Showstoppers: {scoring.showstopper_count}. "
                    f"Approve to generate the Excel report."
                ),
                accept_label="Approve & Generate Excel",
                decline_label="Reject",
            )
        )

        if not workflows_mistralai.is_accepted(confirmation):
            return json.dumps({
                "status":         "rejected_by_analyst",
                "vendor":         input.vendor,
                "project":        input.project,
                "analyst":        input.analyst,
                "final_decision": analysis.final_decision,
                "overall_score":  analysis.overall_score,
                "global_score":   scoring.global_score,
                "message":        f"Report manually rejected by {input.analyst}.",
            })

        # Step 6: Export Excel triggered by human approval
        excel_path = await export_excel(
            analysis_dict, scoring,
            input.vendor, input.project, input.analyst,
        )

        return json.dumps({
            "status":          "approved",
            "final_decision":  analysis.final_decision,
            "overall_score":   analysis.overall_score,
            "vendor":          input.vendor,
            "project":         input.project,
            "analyst":         input.analyst,
            "excel_path":      excel_path,
            "executive_summary": analysis.executive_summary,
            "showstoppers":    analysis.showstoppers,
            "risks": [
                {
                    "title":                r.title,
                    "level":               r.level,
                    "description":         r.description,
                    "recommendation":      r.recommendation,
                    "related_question_ids": r.related_question_ids,
                }
                for r in analysis.risks
            ],
            "exceptions":        analysis.exceptions,
            "derogations":       analysis.derogations,
            "global_score":      scoring.global_score,
            "low_score_count":   scoring.low_score_count,
            "showstopper_count": scoring.showstopper_count,
            "question_scores": [
                {
                    "question_id":        q.question_id,
                    "question":           q.question,
                    "response":           q.response,
                    "score":              q.score,
                    "justification":      q.justification,
                    "is_showstopper":     q.is_showstopper,
                    "flag_reason":        q.flag_reason,
                    "follow_up_question": q.follow_up_question,
                }
                for q in scoring.question_scores
            ],
        })