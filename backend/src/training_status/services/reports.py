"""PDF report generation using reportlab."""

import logging
from datetime import date
from pathlib import Path

logger = logging.getLogger(__name__)


def generate_weekly_pdf(db: object, reports_dir: Path) -> Path:
    """Generate a weekly training summary PDF.

    Saves to reports_dir/weekly_report_YYYY-MM-DD.pdf.
    Returns path to generated file.
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    today = date.today().isoformat()
    reports_dir.mkdir(parents=True, exist_ok=True)
    filename = reports_dir / f"weekly_report_{today}.pdf"

    doc = SimpleDocTemplate(str(filename), pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph(f"Training Status - Week of {today}", styles["Title"]))
    story.append(Spacer(1, 12))

    rows = db.get_snapshots_for_analytics(  # type: ignore[attr-defined]
        columns=["ctl", "atl", "tsb", "hrv", "week_0_km", "rest_days", "sleep_score",
                 "resting_hr", "vo2max", "ramp_rate"],
        limit=14,
    )

    if rows:
        latest = rows[0]
        ctl, atl, tsb, hrv, week_km, rest_days, sleep_score, rhr, vo2max, ramp = latest

        table_data = [
            ["Metric", "Value"],
            ["Fitness (CTL)", f"{ctl:.1f}" if ctl else "-"],
            ["Fatigue (ATL)", f"{atl:.1f}" if atl else "-"],
            ["Form (TSB)", f"{tsb:.1f}" if tsb else "-"],
            ["Ramp Rate", f"{ramp:.2f}/week" if ramp else "-"],
            ["HRV", f"{hrv:.0f} ms" if hrv else "-"],
            ["Resting HR", f"{rhr} bpm" if rhr else "-"],
            ["Week Volume", f"{week_km:.1f} km" if week_km else "-"],
            ["Rest Days", str(rest_days) if rest_days is not None else "-"],
            ["Sleep Score", f"{sleep_score:.0f}/100" if sleep_score else "-"],
            ["VO2max", f"{vo2max:.1f}" if vo2max else "-"],
        ]

        table = Table(table_data, colWidths=[200, 200])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.Color(0.95, 0.95, 0.95)]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ]))
        story.append(table)
        story.append(Spacer(1, 20))

        # Weekly comparison
        if len(rows) >= 8:
            prev = rows[7]
            prev_ctl, prev_atl, prev_tsb = prev[0], prev[1], prev[2]
            story.append(Paragraph("Week-over-Week Changes", styles["Heading2"]))
            story.append(Spacer(1, 6))

            changes = []
            if ctl is not None and prev_ctl is not None:
                delta = ctl - prev_ctl
                changes.append(f"CTL: {'+' if delta >= 0 else ''}{delta:.1f}")
            if tsb is not None and prev_tsb is not None:
                delta = tsb - prev_tsb
                changes.append(f"TSB: {'+' if delta >= 0 else ''}{delta:.1f}")

            if changes:
                story.append(Paragraph(" | ".join(changes), styles["Normal"]))
    else:
        story.append(Paragraph("No snapshot data available.", styles["Normal"]))

    doc.build(story)
    logger.info("Weekly PDF generated: %s", filename)
    return filename
