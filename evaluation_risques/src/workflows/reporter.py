"""
reporter.py
===========
Generates text report and PDF export.
All heavy imports are INSIDE the functions to avoid sandbox restrictions.
"""

import mistralai.workflows as wfk


LEVEL_EMOJI = {
    "Critical": "🔴",
    "High":     "🟠",
    "Medium":   "🟡",
    "Low":      "🟢",
}


@wfk.activity()
async def generate_text_report(
    analysis: dict,
    vendor: str,
    project: str,
    analyst: str,
) -> str:
    """Generates a plain text summary for human validation."""
    from datetime import datetime
    from workflows.analyzer import RiskAnalysis
    analysis = RiskAnalysis(**analysis) if isinstance(analysis, dict) else analysis

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
        lines += ["--- EXCEPTIONS ---"] + [f"• {ex}" for ex in analysis.exceptions] + [""]
    if analysis.derogations:
        lines += ["--- DEROGATIONS ---"] + [f"• {dg}" for dg in analysis.derogations] + [""]
    lines.append(f"Prepared for validation by: {analyst}")
    return "\n".join(lines)


@wfk.activity()
async def export_pdf(
    analysis: dict,
    vendor: str,
    project: str,
    analyst: str,
    analyst_comments: str,
) -> str:
    """Generates the final PDF report. All imports are inside to avoid sandbox issues."""
    import os
    import tempfile
    from datetime import datetime
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import (
        HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
    )
    from workflows.analyzer import RiskAnalysis
    analysis = RiskAnalysis(**analysis) if isinstance(analysis, dict) else analysis

    LEVEL_COLORS = {
        "Critical": colors.HexColor("#C0392B"),
        "High":     colors.HexColor("#E67E22"),
        "Medium":   colors.HexColor("#F1C40F"),
        "Low":      colors.HexColor("#27AE60"),
    }

    filename = f"TPRA_{vendor.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
    filepath = os.path.join(tempfile.gettempdir(), filename)

    doc = SimpleDocTemplate(
        filepath, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )

    styles = {
        "title": ParagraphStyle("title", fontSize=20, fontName="Helvetica-Bold",
            textColor=colors.HexColor("#1A252F"), spaceAfter=6),
        "subtitle": ParagraphStyle("subtitle", fontSize=11, fontName="Helvetica",
            textColor=colors.HexColor("#555555"), spaceAfter=4),
        "h2": ParagraphStyle("h2", fontSize=13, fontName="Helvetica-Bold",
            textColor=colors.HexColor("#1A252F"), spaceBefore=14, spaceAfter=6),
        "body": ParagraphStyle("body", fontSize=10, fontName="Helvetica",
            textColor=colors.HexColor("#2C3E50"), spaceAfter=4, leading=14),
        "small": ParagraphStyle("small", fontSize=9, fontName="Helvetica",
            textColor=colors.HexColor("#7F8C8D"), spaceAfter=2),
    }

    story = [
        Paragraph("Third Party Risk Assessment Report", styles["title"]),
        Paragraph(f"Vendor: <b>{vendor}</b> &nbsp;|&nbsp; Project: <b>{project}</b>", styles["subtitle"]),
        Paragraph(f"Date: {datetime.now().strftime('%Y-%m-%d')} &nbsp;|&nbsp; Analyst: {analyst}", styles["small"]),
        HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1A252F"), spaceAfter=12),
    ]

    # Score badge
    score_color = LEVEL_COLORS.get(analysis.overall_score, colors.grey)
    score_table = Table([["Overall Risk Score", analysis.overall_score]], colWidths=[13*cm, 4*cm])
    score_table.setStyle(TableStyle([
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
    story += [score_table, Spacer(1, 10)]

    # Executive summary
    story.append(Paragraph("Executive Summary", styles["h2"]))
    story.append(Paragraph(analysis.executive_summary, styles["body"]))

    # Risk cards
    story.append(Paragraph(f"Identified Risks ({len(analysis.risks)})", styles["h2"]))
    for risk in analysis.risks:
        color = LEVEL_COLORS.get(risk.level, colors.grey)
        level_style = ParagraphStyle("level", fontSize=9, fontName="Helvetica-Bold", textColor=colors.white)
        data = [
            [Paragraph(f"<b>{risk.title}</b>", styles["body"]), Paragraph(risk.level, level_style)],
            [Paragraph(risk.description, styles["body"]), ""],
            [Paragraph(f"<b>Recommendation:</b> {risk.recommendation}", styles["small"]), ""],
        ]
        t = Table(data, colWidths=[14*cm, 3*cm])
        t.setStyle(TableStyle([
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
        story += [t, Spacer(1, 6)]

    # Exceptions & Derogations
    if analysis.exceptions:
        story.append(Paragraph("Identified Exceptions", styles["h2"]))
        for ex in analysis.exceptions:
            story.append(Paragraph(f"• {ex}", styles["body"]))
    if analysis.derogations:
        story.append(Paragraph("Derogations", styles["h2"]))
        for dg in analysis.derogations:
            story.append(Paragraph(f"• {dg}", styles["body"]))

    # Validation block
    story += [
        Paragraph("Analyst Validation", styles["h2"]),
        Paragraph(f"<b>Analyst:</b> {analyst}", styles["body"]),
        Paragraph("<b>Status:</b> Approved", styles["body"]),
    ]
    if analyst_comments:
        story.append(Paragraph(f"<b>Comments:</b> {analyst_comments}", styles["body"]))
    story.append(Paragraph(
        f"<b>Validation date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        styles["body"]
    ))

    doc.build(story)
    return filepath
