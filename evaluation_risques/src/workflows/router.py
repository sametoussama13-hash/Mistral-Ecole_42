"""
router.py — TPRA Use Case 2
Risk levels are recalculated by scorer and returned explicitly.
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
        from workflows.analyzer import analyze_risks
        from workflows.scorer import score_responses
        from workflows.reporter import generate_text_report, export_excel

        # Step 1: Extract
        text = await extract_text(input.source_type, input.content)

        # Step 2: Analyze (identifies risks + related_question_ids, no levels yet)
        analysis = await analyze_risks(text, input.vendor, input.project)
        analysis_dict = analysis.model_dump()

        # Step 3: Score + recalculate risk levels (returned explicitly in ScoringResult)
        scoring = await score_responses(text, input.vendor, analysis_dict)

        # Use updated values from scorer
        final_decision    = scoring.final_decision
        overall_score     = scoring.overall_score
        executive_summary = scoring.executive_summary
        updated_risks     = scoring.updated_risks

        # Step 4: Generate text report
        report_analysis = {
            **analysis_dict,
            "risks":             updated_risks,
            "overall_score":     overall_score,
            "final_decision":    final_decision,
            "executive_summary": executive_summary,
        }
        text_report = await generate_text_report(
            report_analysis, scoring, input.vendor, input.project, input.analyst
        )

        # Step 5: Human validation ⏸️
        await workflows_mistralai.send_assistant_message(
            f"TPRA Report ready for {input.vendor}.\n\n"
            f"Decision: {final_decision} | "
            f"Score: {scoring.global_score:.1f}/4.0 | "
            f"Showstoppers: {scoring.showstopper_count}\n\n"
            f"{text_report}"
        )

        # Step 6: Export Excel
        excel_path = await export_excel(
            report_analysis, scoring,
            input.vendor, input.project, input.analyst,
        )

        return json.dumps({
            "status":            "approved",
            "final_decision":    final_decision,
            "overall_score":     overall_score,
            "vendor":            input.vendor,
            "project":           input.project,
            "analyst":           input.analyst,
            "excel_path":        excel_path,
            "executive_summary": executive_summary,
            "showstoppers":      analysis_dict.get("showstoppers", []),
            "risks":             updated_risks,
            "exceptions":        analysis_dict.get("exceptions", []),
            "derogations":       analysis_dict.get("derogations", []),
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
                    "piece_jointe":       q.piece_jointe,
                }
                for q in scoring.question_scores
            ],
        })