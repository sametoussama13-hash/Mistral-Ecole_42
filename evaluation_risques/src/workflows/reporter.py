"""
reporter.py
===========
Responsible for two things:
  1. Generating a readable text summary for the analyst to review
  2. Exporting the final validated report as a PDF
 
It never calls Mistral — it only formats and presents data.
The human validation pause (wait_for_input) lives in router.py, not here.
"""

import os
import tempfile
from datetime import datetime

import mistralai.workflows as workflows
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from workflows.analyzer import RiskAnalysis

# --------------------------------##
# Shared constants
# --------------------------------##

LEVEL_COLORS = {
    "Critical": colors.HexColor("#C0392B"),
    "Hight": colors.HexColor("#E67E22"),
    "Medium": colors.HexColor("#F1C40F"),
    "Low": colors.HexColor("#27AE60")
}

LEVEL_EMOJI = {
    "Critical": "🔴",
    "Hight": "🟠",
    "Medium":  "🟡",
    "Low": "🟢"
}

# --------------------------------##
# Activity 1 — Text summary for human validation
# --------------------------------##


@workflows.activity()
async def generate_text_report(
    analysis: RiskAnalysis,
    vendor: str,
    project: str,
    analyst: str
) -> str:
    """Generates a plain text summary of the risk analysis."""
    emoji = LEVEL_EMOJI.get(analysis.overall_score, "⚪")

    lines = [
        f"=== TPRA REPORT - {vendor} ===",
        f"Project  : {project}",
        f"Score    : {emoji} {analysis.overall_score}",
        f"Date     : {datetime.now().strftime('%Y-%m-%d')}",
        "",
        "--- EXECUTIVE SUMMARY ---",
        analysis.executive_summary,
        "",
        f"--- IDENTIFIED RISKS ({len(analysis.risks)}) ---",
    ]

    for i, risk in enumerate(analysis.risks, 1):
        e = LEVEL_EMOJI.get(risk.level, "⚪")
        lines += [
            f"{i}. [{e} {risk.level}] {risk.title}",
            f"   → {risk.description}",
            f"   ✅ Recommendation: {risk.recommendation}",
            "",
        ]

    if analysis.exceptions:
        lines += ["--- EXCEPTIONS ---"]
        lines += [f"• {ex}" for ex in analysis.exceptions]
        lines.append("")
 
    if analysis.derogations:
        lines += ["--- DEROGATIONS ---"]
        lines += [f"• {dg}" for dg in analysis.derogations]
        lines.append("")
 
    lines.append(f"Prepared for validation by: {analyst}")
    return "\n".join(lines)

# --------------------------------##
# Activity 2 — PDF export (called only after analyst approval)
# --------------------------------##


@workflows.activity()
async def export_pdf(
    analysis: RiskAnalysis,
    vendor: str,
    project: str,
    analyst: str,
    analyst_comments: str
) -> str:
    """Generates the final PDF report using reportlab."""
    # --- File path ---
    filename = f"TPRA_{vendor.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
    filepath = os.path.join(tempfile.gettempdir(), filename)

    # --- Document setup ---
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2 * cm,  bottomMargin=2 * cm,
    )

    # --- Styles ---
    styles = _build_styles()
    story = []

    # --- Header ---
    story += _build_header(vendor, project, analyst, styles)

    # --- Overall score badge ---
    story += _build_score_badge(analysis.overall_score)

    # --- Executive summary ---
    story.append(Paragraph("Executive Summary", styles["h2"]))
    story.append(Paragraph(analysis.executive_summary, styles["body"]))

    # --- Risk cards ---
    story.append(Paragraph(f"Identified Risks ({len(analysis.risks)})", styles["h2"]))
    for risk in analysis.risks:
        story += _build_risk_card(risk, styles)

    # --- Exceptions ---
    if analysis.exceptions:
        story.append(Paragraph("Identified Exceptions", styles["h2"]))
        for ex in analysis.exceptions:
            story.append(Paragraph(f"• {ex}", styles["body"]))

    # --- Derogations ---
    if analysis.derogations:
        story.append(Paragraph("Derogations", styles["h2"]))
        for dg in analysis.derogations:
            story.append(Paragraph(f"• {dg}", styles["body"]))

    # --- Analyst validation block ---
    story += _build_validation_block(analyst, analyst_comments, styles)

    # --- Build the PDF ---
    doc.build(story)
    return filepath

# ---------------------------------------------------------------------------
# Private helpers — each builds one section of the PDF
# Breaking into small functions makes each section easy to read and modify
# ---------------------------------------------------------------------------


def _build_styles() -> dict:
    """Returns all paragraph styles used in the PDF."""
    return {
        "title": ParagraphStyle(
            "title", fontSize=20, fontName="Helvetica-Bold",
            textColor=colors.HexColor("#1A252F"), spaceAfter=6,
        ),
        "subtitle": ParagraphStyle(
            "subtitle", fontSize=11, fontName="Helvetica",
            textColor=colors.HexColor("#555555"), spaceAfter=4,
        ),
        "h2": ParagraphStyle(
            "h2", fontSize=13, fontName="Helvetica-Bold",
            textColor=colors.HexColor("#1A252F"), spaceBefore=14, spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body", fontSize=10, fontName="Helvetica",
            textColor=colors.HexColor("#2C3E50"), spaceAfter=4, leading=14,
        ),
        "small": ParagraphStyle(
            "small", fontSize=9, fontName="Helvetica",
            textColor=colors.HexColor("#7F8C8D"), spaceAfter=2,
        ),
    }
 
 
def _build_header(vendor, project, analyst, styles) -> list:
    """Builds the top header section of the PDF."""
    return [
        Paragraph("Third Party Risk Assessment Report", styles["title"]),
        Paragraph(
            f"Vendor: <b>{vendor}</b> &nbsp;|&nbsp; Project: <b>{project}</b>",
            styles["subtitle"]
        ),
        Paragraph(
            f"Date: {datetime.now().strftime('%Y-%m-%d')} &nbsp;|&nbsp; Analyst: {analyst}",
            styles["small"]
        ),
        HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1A252F"), spaceAfter=12),
    ]


def _build_score_badge(overall_score: str) -> list:
    """Builds the colored overall score badge."""
    score_color = LEVEL_COLORS.get(overall_score, colors.grey)
    table = Table([["Overall Risk Score", overall_score]], colWidths=[13 * cm, 4 * cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#ECF0F1")),
        ("BACKGROUND", (1, 0), (1, 0), score_color),
        ("TEXTCOLOR",  (1, 0), (1, 0), colors.white),
        ("FONTNAME",   (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE",   (0, 0), (-1, -1), 11),
        ("ALIGN",      (1, 0), (1, 0), "CENTER"),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("BOX",        (0, 0), (-1, -1), 1, colors.HexColor("#BDC3C7")),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return [table, Spacer(1, 10)]


def _build_risk_card(risk, styles) -> list:
    """
    Builds a single risk card as a table with 3 rows:
      Row 1: risk title + colored level badge
      Row 2: description
      Row 3: recommendation
    """
    color = LEVEL_COLORS.get(risk.level, colors.grey)
    level_style = ParagraphStyle(
        "level", fontSize=9, fontName="Helvetica-Bold", textColor=colors.white
    )
    data = [
        [Paragraph(f"<b>{risk.title}</b>", styles["body"]),
         Paragraph(risk.level, level_style)],
        [Paragraph(risk.description, styles["body"]), ""],
        [Paragraph(f"<b>Recommendation:</b> {risk.recommendation}", styles["small"]), ""],
    ]
    table = Table(data, colWidths=[14 * cm, 3 * cm])
    table.setStyle(TableStyle([
        ("SPAN",        (0, 1), (1, 1)),
        ("SPAN",        (0, 2), (1, 2)),
        ("BACKGROUND",  (1, 0), (1, 0), color),
        ("BACKGROUND",  (0, 0), (0, 0), colors.HexColor("#F8F9FA")),
        ("BACKGROUND",  (0, 1), (-1, 1), colors.white),
        ("BACKGROUND",  (0, 2), (-1, 2), colors.HexColor("#FAFAFA")),
        ("ALIGN",       (1, 0), (1, 0), "CENTER"),
        ("VALIGN",      (0, 0), (-1, -1), "TOP"),
        ("BOX",         (0, 0), (-1, -1), 0.5, colors.HexColor("#BDC3C7")),
        ("LINEBELOW",   (0, 0), (-1, 0), 0.5, colors.HexColor("#BDC3C7")),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
    ]))
    return [table, Spacer(1, 6)]


def _build_validation_block(analyst, comments, styles) -> list:
    """Builds the analyst validation section at the bottom of the PDF."""
    items = [
        Paragraph("Analyst Validation", styles["h2"]),
        Paragraph(f"<b>Analyst:</b> {analyst}", styles["body"]),
        Paragraph("<b>Status:</b> Approved", styles["body"]),
    ]
    if comments:
        items.append(Paragraph(f"<b>Comments:</b> {comments}", styles["body"]))
    items.append(Paragraph(
        f"<b>Validation date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        styles["body"]
    ))
    return items
