"""
reporter.py
===========
Generates text report and PDF export.
Now includes both risk analysis AND question scores.
All heavy imports are INSIDE functions to avoid sandbox restrictions.
"""

import mistralai.workflows as wfk

LEVEL_EMOJI = {
    "Critical": "🔴",
    "High":     "🟠",
    "Medium":   "🟡",
    "Low":      "🟢",
}

SCORE_EMOJI = {
    range(0,  26): "🔴",
    range(26, 51): "🟠",
    range(51, 76): "🟡",
    range(76, 101): "🟢",
}

def _score_emoji(score: int) -> str:
    if score <= 25:   return "🔴"
    if score <= 50:   return "🟠"
    if score <= 75:   return "🟡"
    return "🟢"


@wfk.activity()
async def generate_text_report(
    analysis: dict,
    scoring: dict,
    vendor: str,
    project: str,
    analyst: str,
) -> str:
    """Generates a plain text summary for human validation in Studio."""
    from datetime import datetime
    from workflows.analyzer import RiskAnalysis
    from workflows.scorer import ScoringResult

    analysis = RiskAnalysis(**analysis) if isinstance(analysis, dict) else analysis
    scoring = ScoringResult(**scoring) if isinstance(scoring, dict) else scoring

    lines = [
        f"=== TPRA REPORT - {vendor} ===",
        f"Project      : {project}",
        f"Risk Level   : {LEVEL_EMOJI.get(analysis.overall_score, '⚪')} {analysis.overall_score}",
        f"Global Score : {_score_emoji(scoring.global_score)} {scoring.global_score}/100",
        f"Date         : {datetime.now().strftime('%Y-%m-%d')}",
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

    lines += [
        f"--- QUESTION SCORES ({len(scoring.question_scores)} questions) ---",
    ]
    for q in scoring.question_scores:
        e = _score_emoji(q.score)
        lines += [
            f"[{q.question_id}] {e} {q.score}/100",
            f"   Q: {q.question[:80]}...",
            f"   → {q.justification}",
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
    scoring: dict,
    vendor: str,
    project: str,
    analyst: str,
    analyst_comments: str,
) -> str:
    """Generates the final PDF with risks + question scores."""
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
    from workflows.scorer import ScoringResult

    analysis = RiskAnalysis(**analysis) if isinstance(analysis, dict) else analysis
    scoring = ScoringResult(**scoring) if isinstance(scoring, dict) else scoring

    LEVEL_COLORS = {
        "Critical": colors.HexColor("#C0392B"),
        "High":     colors.HexColor("#E67E22"),
        "Medium":   colors.HexColor("#F1C40F"),
        "Low":      colors.HexColor("#27AE60"),
    }
    SCORE_COLORS = {
        "red":    colors.HexColor("#C0392B"),
        "orange": colors.HexColor("#E67E22"),
        "yellow": colors.HexColor("#F1C40F"),
        "green":  colors.HexColor("#27AE60"),
    }

    def score_color(score):
        if score <= 25:  return SCORE_COLORS["red"]
        if score <= 50:  return SCORE_COLORS["orange"]
        if score <= 75:  return SCORE_COLORS["yellow"]
        return SCORE_COLORS["green"]

    filename = f"TPRA_{vendor.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
    filepath = os.path.join(tempfile.gettempdir(), filename)

    doc = SimpleDocTemplate(
        filepath, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )

    styles = {
        "title":    ParagraphStyle("title", fontSize=20, fontName="Helvetica-Bold",
                        textColor=colors.HexColor("#1A252F"), spaceAfter=6),
        "subtitle": ParagraphStyle("subtitle", fontSize=11, fontName="Helvetica",
                        textColor=colors.HexColor("#555555"), spaceAfter=4),
        "h2":       ParagraphStyle("h2", fontSize=13, fontName="Helvetica-Bold",
                        textColor=colors.HexColor("#1A252F"), spaceBefore=14, spaceAfter=6),
        "body":     ParagraphStyle("body", fontSize=10, fontName="Helvetica",
                        textColor=colors.HexColor("#2C3E50"), spaceAfter=4, leading=14),
        "small":    ParagraphStyle("small", fontSize=9, fontName="Helvetica",
                        textColor=colors.HexColor("#7F8C8D"), spaceAfter=2),
        "white":    ParagraphStyle("white", fontSize=9, fontName="Helvetica-Bold",
                        textColor=colors.white),
    }

    story = [
        Paragraph("Third Party Risk Assessment Report", styles["title"]),
        Paragraph(f"Vendor: <b>{vendor}</b> &nbsp;|&nbsp; Project: <b>{project}</b>", styles["subtitle"]),
        Paragraph(f"Date: {datetime.now().strftime('%Y-%m-%d')} &nbsp;|&nbsp; Analyst: {analyst}", styles["small"]),
        HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1A252F"), spaceAfter=12),
    ]

    # --- Score badges (risk level + global score) ---
    risk_color = LEVEL_COLORS.get(analysis.overall_score, colors.grey)
    gs_color = score_color(scoring.global_score)
    badges = Table(
        [["Risk Level", analysis.overall_score, "Global Score", f"{scoring.global_score}/100"]],
        colWidths=[5*cm, 3.5*cm, 5*cm, 3.5*cm]
    )
    badges.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#ECF0F1")),
        ("BACKGROUND", (1, 0), (1, 0), risk_color),
        ("BACKGROUND", (2, 0), (2, 0), colors.HexColor("#ECF0F1")),
        ("BACKGROUND", (3, 0), (3, 0), gs_color),
        ("TEXTCOLOR",  (1, 0), (1, 0), colors.white),
        ("TEXTCOLOR",  (3, 0), (3, 0), colors.white),
        ("FONTNAME",   (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE",   (0, 0), (-1, -1), 11),
        ("ALIGN",      (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("BOX",        (0, 0), (-1, -1), 1, colors.HexColor("#BDC3C7")),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story += [badges, Spacer(1, 12)]

    # --- Executive summary ---
    story.append(Paragraph("Executive Summary", styles["h2"]))
    story.append(Paragraph(analysis.executive_summary, styles["body"]))

    # --- Risk cards ---
    story.append(Paragraph(f"Identified Risks ({len(analysis.risks)})", styles["h2"]))
    for risk in analysis.risks:
        rc = LEVEL_COLORS.get(risk.level, colors.grey)
        data = [
            [Paragraph(f"<b>{risk.title}</b>", styles["body"]),
             Paragraph(risk.level, styles["white"])],
            [Paragraph(risk.description, styles["body"]), ""],
            [Paragraph(f"<b>Recommendation:</b> {risk.recommendation}", styles["small"]), ""],
        ]
        t = Table(data, colWidths=[14*cm, 3*cm])
        t.setStyle(TableStyle([
            ("SPAN",        (0, 1), (1, 1)),
            ("SPAN",        (0, 2), (1, 2)),
            ("BACKGROUND",  (1, 0), (1, 0), rc),
            ("BACKGROUND",  (0, 0), (0, 0), colors.HexColor("#F8F9FA")),
            ("BACKGROUND",  (0, 1), (-1, 1), colors.white),
            ("BACKGROUND",  (0, 2), (-1, 2), colors.HexColor("#FAFAFA")),
            ("ALIGN",       (1, 0), (1, 0), "CENTER"),
            ("VALIGN",      (0, 0), (-1, -1), "TOP"),
            ("BOX",         (0, 0), (-1, -1), 0.5, colors.HexColor("#BDC3C7")),
            ("LINEBELOW",   (0, 0), (-1, 0), 0.5, colors.HexColor("#BDC3C7")),
            ("TOPPADDING",  (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story += [t, Spacer(1, 6)]

    # --- Question scores table ---
    story.append(Paragraph(f"Question Scores ({len(scoring.question_scores)} questions)", styles["h2"]))
    score_data = [["ID", "Question", "Score", "Justification"]]
    for q in scoring.question_scores:
        sc = score_color(q.score)
        score_data.append([
            Paragraph(q.question_id, styles["small"]),
            Paragraph(q.question[:60] + ("..." if len(q.question) > 60 else ""), styles["small"]),
            Paragraph(str(q.score), styles["white"]),
            Paragraph(q.justification[:80] + ("..." if len(q.justification) > 80 else ""), styles["small"]),
        ])
    score_table = Table(score_data, colWidths=[2.5*cm, 6*cm, 1.5*cm, 7*cm])
    score_style = [
        ("BACKGROUND",    (0, 0), (-1, 0), colors.HexColor("#1A252F")),
        ("TEXTCOLOR",     (0, 0), (-1, 0), colors.white),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 8),
        ("ALIGN",         (2, 0), (2, -1), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, colors.HexColor("#F8F9FA")]),
        ("BOX",           (0, 0), (-1, -1), 0.5, colors.HexColor("#BDC3C7")),
        ("INNERGRID",     (0, 0), (-1, -1), 0.25, colors.HexColor("#BDC3C7")),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 4),
    ]
    for i, q in enumerate(scoring.question_scores, 1):
        sc = score_color(q.score)
        score_style.append(("BACKGROUND", (2, i), (2, i), sc))
    score_table.setStyle(TableStyle(score_style))
    story.append(score_table)

    # --- Exceptions & Derogations ---
    if analysis.exceptions:
        story.append(Paragraph("Identified Exceptions", styles["h2"]))
        for ex in analysis.exceptions:
            story.append(Paragraph(f"• {ex}", styles["body"]))
    if analysis.derogations:
        story.append(Paragraph("Derogations", styles["h2"]))
        for dg in analysis.derogations:
            story.append(Paragraph(f"• {dg}", styles["body"]))

    # --- Analyst validation ---
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