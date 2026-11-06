import os
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def create_pdf(csv_path="results/evaluation_summary.csv", pdf_path="results/RAG_Evaluation_Report.pdf"):
    if not os.path.exists(csv_path):
        print("Evaluation summary CSV not found. Please run evaluate_systems.py first.")
        return

    df = pd.read_csv(csv_path)
    doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    story = []
    styles = getSampleStyleSheet()

    # Title Style
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=15
    )

    story.append(Paragraph("RAG Hallucination-Reduction Evaluation Report", title_style))
    story.append(Paragraph("Comparative performance analysis between Baseline LLM (A), Naive RAG (B), and Proposed Advanced Semantic RAG (C).", styles['Normal']))
    story.append(Spacer(1, 15))

    # Format Table Data
    table_data = [["#", "Question", "System A", "System B", "System C"]]

    cell_style = ParagraphStyle(
        'CellStyle',
        parent=styles['Normal'],
        fontSize=8,
        leading=10
    )

    for idx, row in df.iterrows():
        table_data.append([
            str(idx + 1),
            Paragraph(str(row['question']), cell_style),
            Paragraph(str(row['system_a']), cell_style),
            Paragraph(str(row['system_b']), cell_style),
            Paragraph(str(row['system_c']), cell_style)
        ])

    # Build Table
    col_widths = [20, 150, 120, 120, 120]
    t = Table(table_data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#334155")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
    ]))

    story.append(t)
    doc.build(story)
    print(f"PDF successfully generated at: {pdf_path}")

if __name__ == "__main__":
    create_pdf()