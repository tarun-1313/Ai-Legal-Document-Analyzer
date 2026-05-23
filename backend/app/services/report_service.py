"""
PDF Report Generation Service
Generates professional PDF reports of document analysis results using FPDF2.
"""

from fpdf import FPDF
from datetime import datetime
from typing import Dict, List
import os


class LegalReportPDF(FPDF):
    """Custom PDF class with header/footer for legal reports."""

    def __init__(self, title: str = "Legal Document Analysis Report"):
        super().__init__()
        self.report_title = title

    def header(self):
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(30, 58, 138)
        self.cell(0, 10, "AI Legal Document Analyzer", align="L")
        self.ln(5)
        self.set_draw_color(30, 58, 138)
        self.set_line_width(0.5)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(8)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}} | Generated {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", align="C")

    def section_title(self, title: str):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(30, 58, 138)
        self.cell(0, 10, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def section_body(self, text: str):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(50, 50, 50)
        self.multi_cell(0, 6, text)
        self.ln(4)

    def risk_badge(self, level: str, score: float):
        colors = {
            "low": (34, 197, 94),
            "medium": (234, 179, 8),
            "high": (249, 115, 22),
            "critical": (239, 68, 68),
        }
        r, g, b = colors.get(level, (128, 128, 128))
        self.set_fill_color(r, g, b)
        self.set_text_color(255, 255, 255)
        self.set_font("Helvetica", "B", 12)
        self.cell(60, 10, f"Risk: {level.upper()} ({score}%)", fill=True, align="C")
        self.ln(12)


def generate_analysis_report(
    document_title: str,
    analysis: Dict,
    clauses: List[Dict],
    output_dir: str = "./reports"
) -> str:
    """
    Generate a PDF report from document analysis results.

    Args:
        document_title: Title of the analyzed document.
        analysis: Analysis dict with summary, risk_score, key_findings, recommendations.
        clauses: List of classified clauses.
        output_dir: Directory to save the report.

    Returns:
        Path to the generated PDF file.
    """
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"report_{timestamp}.pdf"
    filepath = os.path.join(output_dir, filename)

    pdf = LegalReportPDF(title=document_title)
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)

    # ── Title ──
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(30, 58, 138)
    pdf.cell(0, 15, "Document Analysis Report", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 8, document_title, align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(10)

    # ── Risk Score ──
    risk_level = analysis.get("risk_level", "low")
    risk_score = analysis.get("risk_score", 0)
    pdf.risk_badge(risk_level, risk_score)

    # ── Introduction ──
    summary = analysis.get("summary", {})
    if isinstance(summary, dict) and "introduction" in summary:
        pdf.section_title("Document Introduction")
        pdf.section_body(summary["introduction"])
        pdf.ln(4)

    # ── Executive Summary ──
    pdf.section_title("Executive Summary")
    if isinstance(summary, dict):
        for field, value in summary.items():
            if field == "introduction":
                continue
            label = field.replace("_", " ").title()
            pdf.set_font("Helvetica", "B", 10)
            pdf.set_text_color(30, 58, 138)
            pdf.cell(50, 6, f"{label}: ", ln=0)
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(50, 50, 50)
            pdf.multi_cell(0, 6, str(value))
    else:
        pdf.section_body(str(summary))
    pdf.ln(4)

    # ── Key Points ──
    pdf.section_title("Important Key Points")
    key_points = analysis.get("key_points", [])
    for kp in key_points:
        if isinstance(kp, dict):
            category = kp.get("category", "General")
            point = kp.get("point", "")
            pdf.set_font("Helvetica", "B", 10)
            pdf.set_text_color(30, 58, 138)
            pdf.cell(0, 6, f"[{category}]", new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(50, 50, 50)
            pdf.multi_cell(0, 6, f"• {point}")
            pdf.ln(2)
    pdf.ln(4)

    # ── Risk Analysis ──
    pdf.section_title("Detailed Risk Analysis")
    risk_analysis = analysis.get("risk_analysis", [])
    for risk in risk_analysis:
        if isinstance(risk, dict):
            pdf.set_font("Helvetica", "B", 10)
            severity = risk.get("severity", "low").upper()
            pdf.set_text_color(239, 68, 68) if severity == "CRITICAL" else pdf.set_text_color(249, 115, 22)
            pdf.cell(0, 6, f"{risk.get('type', 'General')} Risk - {severity}", new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("Helvetica", "I", 10)
            pdf.set_text_color(100, 100, 100)
            pdf.multi_cell(0, 6, f"Clause: \"{risk.get('clause', '')}\"")
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(50, 50, 50)
            pdf.multi_cell(0, 6, f"Reason: {risk.get('reason', '')}")
            pdf.ln(2)
    pdf.ln(4)

    # ── Recommendations ──
    pdf.section_title("AI Recommendations")
    recommendations = analysis.get("recommendations", [])
    for rec in recommendations:
        pdf.section_body(f"• {rec}")

    pdf.output(filepath)
    return filepath
