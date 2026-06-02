"""
router.py
=========
Entry point of the TPRA workflow.
Third Party Risk Assessment
Receives the document and orchestrates the calls to:
  - extractor.py  (text extraction)
  - analyzer.py   (risk analysis)
  - reporter.py   (report generation + human validation + PDF export)
"""
from enum import Enum
from typing import Optional
from datetime import datetime

import mistralai.workflows as workflows
import mistralai.workflows.plugins.mistralai as workflows_mistralai
from pydantic import BaseModel

# --------------------------------##
# Modéles de données
# --------------------------------##


class SourceType(str, Enum):
    PDF = "pdf"
    EMAIL = "email"


class TPRAInput(BaseModel):
    """Init input data workflows."""
    vendor: str
    source_type: SourceType
    content: str
    project: Optional[str] = "Not specified"
    analyst: Optional[str] = "Analyst"


class ValidationInput(BaseModel):
    """What the analyst sends back to validate."""
    approved: bool
    comments: Optional[str] = ""


# -------------------------------- #
# Main worflows
# -------------------------------- #

@workflows.workflow.define(
    name="tpra-evaluation",
    workflow_display_name="Third Party Risk Assessement (TPRA)",
    workflow_description="Automated cyber risk analysis with human validation and PDF export.",
)
class TPRAWorkflow(workflows.InteractiveWorkflow):

    @workflows.workflow.entrypoint
    async def run(self, input: TPRAInput) -> str:
        from workflows.extractor import extract_text
        from workflows.analyzer import analyze_risks
        from workflows.reporter import generate_text_report, export_pdf

        # --- Step 1: Extract text from the document ---
        text = await extract_text(input.source_type, input.content)

        # --- Step 2: Analyze risks with Mistral AI ---
        analysis = await analyze_risks(text, input.vendor, input.project)

        # --- Step 3: Generate a readable text summary for the analyst ---
        text_report = await generate_text_report(analysis, input.vendor, input.project, input.analyst)

        # --- Step 4: Pause — wait for human validation ---
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
            return f"TPRA report rejected by {input.analyst}."

        # --- Step 5: Export the final validated PDF ---
        pdf_path = await export_pdf(
            analysis,
            input.vendor,
            input.project,
            input.analyst,
            "",
        )

        return f"TPRA report validated and exported: {pdf_path}"
