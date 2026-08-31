"""Generate README PDF and PROPOSAL PDF for AIC 2026 submission."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import os

os.makedirs("submission", exist_ok=True)
W, H = A4

# ── Colors ─────────────────────────────────────────────────────────────────
BG     = HexColor("#0A0E1A")
ACCENT = HexColor("#00D4FF")
GREEN  = HexColor("#10B981")
AMBER  = HexColor("#F59E0B")
RED    = HexColor("#EF4444")
DARK   = HexColor("#1E293B")
MUTED  = HexColor("#94A3B8")
PURPLE = HexColor("#7C3AED")

styles = getSampleStyleSheet()

def make_style(name, parent="Normal", **kwargs):
    s = ParagraphStyle(name, parent=styles[parent], **kwargs)
    return s

H1 = make_style("H1", fontSize=22, textColor=white, spaceAfter=6, spaceBefore=12, fontName="Helvetica-Bold", backColor=BG, leading=28)
H2 = make_style("H2", fontSize=15, textColor=ACCENT, spaceAfter=4, spaceBefore=10, fontName="Helvetica-Bold", leading=20)
H3 = make_style("H3", fontSize=12, textColor=GREEN,  spaceAfter=3, spaceBefore=8,  fontName="Helvetica-Bold")
BODY = make_style("BODY", fontSize=10, textColor=HexColor("#E2E8F0"), spaceAfter=4, leading=15, fontName="Helvetica")
MUTED_S = make_style("MUTED", fontSize=9, textColor=MUTED, spaceAfter=3, leading=13, fontName="Helvetica-Oblique")
CENTER = make_style("CENTER", fontSize=11, textColor=white, alignment=TA_CENTER, fontName="Helvetica")

def hr(): return HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=6)
def sp(h=6): return Spacer(1, h)

def tbl(data, col_widths, header_row=True):
    t = Table(data, colWidths=col_widths)
    style = [
        ("BACKGROUND", (0,0), (-1,0 if header_row else -1), DARK),
        ("TEXTCOLOR",  (0,0), (-1,-1), white),
        ("FONTNAME",   (0,0), (-1,0),  "Helvetica-Bold"),
        ("FONTSIZE",   (0,0), (-1,-1), 9),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [HexColor("#111827"), HexColor("#1E293B")]),
        ("GRID",       (0,0), (-1,-1), 0.5, HexColor("#374151")),
        ("LEFTPADDING",(0,0), (-1,-1), 8),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING",(0,0),(-1,-1),5),
        ("TEXTCOLOR", (0,0), (-1,0), ACCENT),
    ]
    t.setStyle(TableStyle(style))
    return t

# ═══════════════════════════════════════════════════════════════════════════════
# README PDF
# ═══════════════════════════════════════════════════════════════════════════════
def build_readme():
    doc = SimpleDocTemplate(
        "submission/AI_AssemblyTwin_README.pdf", pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm,
        title="AI AssemblyTwin — README",
    )
    story = []

    # Header
    story += [
        Paragraph("AI AssemblyTwin", H1),
        Paragraph("Real-Time AI Digital Twin for Vehicle Assembly Manufacturing", H2),
        Paragraph("Accenture Innovation Challenge 2026  ·  Round 2 Submission", MUTED_S),
        Paragraph("Team: Jayanth  ·  Abhinav  ·  Sagar", MUTED_S),
        Paragraph("GitHub: github.com/jay-git00/DigitalTwin.ai", MUTED_S),
        hr(), sp(4),
    ]

    story += [
        Paragraph("What It Does", H2),
        Paragraph(
            "AI AssemblyTwin is a production-grade digital twin of a 45-station vehicle assembly line. "
            "It combines a real-time SimPy simulation, four trained ML models, and a full-stack web application "
            "to deliver predictive quality and maintenance intelligence — before defects reach the customer. "
            "Unlike dashboards that replay historical data, AssemblyTwin runs a live simulation, streams telemetry "
            "at sub-100ms latency, and supports multi-stakeholder decision-making from the shop floor to the boardroom.",
            BODY),
        sp(),
    ]

    story += [Paragraph("Quick Start", H2)]
    story += [Paragraph("Requirements: Python 3.11+ · Node.js 20+", MUTED_S), sp(4)]
    story += [
        Paragraph("<b>Terminal 1 — Backend:</b>", BODY),
        Paragraph("cd backend", make_style("code", fontSize=9, fontName="Courier", textColor=GREEN, backColor=DARK, leftIndent=10)),
        Paragraph("pip install -r requirements.txt", make_style("code2", fontSize=9, fontName="Courier", textColor=GREEN, backColor=DARK, leftIndent=10)),
        Paragraph("uvicorn main:app --reload --port 8000", make_style("code3", fontSize=9, fontName="Courier", textColor=GREEN, backColor=DARK, leftIndent=10)),
        sp(4),
        Paragraph("<b>Terminal 2 — Frontend:</b>", BODY),
        Paragraph("cd frontend", make_style("code4", fontSize=9, fontName="Courier", textColor=GREEN, backColor=DARK, leftIndent=10)),
        Paragraph("npm install", make_style("code5", fontSize=9, fontName="Courier", textColor=GREEN, backColor=DARK, leftIndent=10)),
        Paragraph("npm run dev", make_style("code6", fontSize=9, fontName="Courier", textColor=GREEN, backColor=DARK, leftIndent=10)),
        Paragraph("Open: http://localhost:3000", MUTED_S),
        sp(4),
    ]

    story += [Paragraph("Pages & Features", H2)]
    pages_data = [
        ["Page", "URL", "What You See"],
        ["Live Floor", "/", "Factory map · Health gauge · ROI ticker · Before/After toggle · WHY? explainability"],
        ["Alerts", "/alerts", "Real-time alert feed · Intervention simulator · Approve / dismiss"],
        ["Analytics", "/analytics", "4 tabs: Supervisor · Manager · Leadership · ESG / Sustainability"],
        ["Defect Trace", "/defect-trace", "Causal defect chain from origin station → QC Gate"],
        ["Maintenance", "/maintenance", "AI-predicted monthly maintenance calendar · Proactive cost comparison"],
        ["Multi-Site", "/multisite", "3-plant enterprise overview: Chennai · Pune · Bangalore"],
    ]
    story += [tbl(pages_data, [3.5*cm, 3*cm, 10*cm]), sp(8)]

    story += [Paragraph("ML Models", H2)]
    ml_data = [
        ["Model", "Algorithm", "Output"],
        ["Anomaly Detector",     "Isolation Forest",  "anomaly_score ∈ [-1, 1]"],
        ["Bottleneck Predictor", "LSTM (NumPy)",       "bottleneck_prob per station ∈ [0,1]"],
        ["Defect Predictor",     "Random Forest",      "defect_risk + feature importance"],
        ["Sensor Imputer",       "Gaussian Process",   "imputed_value + σ (uncertainty)"],
    ]
    story += [tbl(ml_data, [4.5*cm, 4.5*cm, 7.5*cm]), sp(8)]

    story += [Paragraph("API Reference", H2)]
    api_data = [
        ["Endpoint", "Description"],
        ["WS /ws/live",                    "Real-time station telemetry stream (every 3 sec)"],
        ["GET /api/stations/status",        "All 45 stations: cycle_time, anomaly_score, defect_risk"],
        ["GET /api/alerts",                 "Active + historical alerts with severity"],
        ["GET /api/system/health",          "Factory health score 0–100%"],
        ["GET /api/explainability/{id}",    "SHAP-style feature importance for a station"],
        ["GET /api/sparkline/{id}",         "Last 20 cycle-time readings"],
        ["GET /api/maintenance/schedule",   "AI-predicted maintenance calendar + due dates"],
        ["GET /api/multisite",              "3-plant enterprise network health"],
        ["GET /api/esg",                    "CO₂, steel, energy saved — ESG metrics"],
        ["GET /api/causal/chain/{id}",      "Defect propagation chain: origin → QC Gate"],
        ["GET /api/roi",                    "Cumulative ROI stats"],
    ]
    story += [tbl(api_data, [6.5*cm, 10*cm]), sp(8)]

    story += [Paragraph("ROI Summary", H2)]
    roi_data = [
        ["Metric", "Value"],
        ["Deployment cost",            "₹45 Lakh"],
        ["Monthly savings",            "₹18 Lakh"],
        ["Payback period",             "~2.5 months"],
        ["3-year net ROI",             "₹6.1 Crore"],
        ["Emergency repair multiplier","8.3× vs proactive"],
        ["New plant onboarding",       "4–6 weeks (vs 6+ months SCADA)"],
    ]
    story += [tbl(roi_data, [8*cm, 8.5*cm]), sp(8)]

    story += [Paragraph("Team", H2)]
    story += [
        Paragraph("• Jayanth — AI & System Architecture", BODY),
        Paragraph("• Abhinav — Industrial Integration & Telemetry", BODY),
        Paragraph("• Sagar — Frontend UX & Data Analytics", BODY),
    ]

    doc.build(story)
    print("README PDF saved → submission/AI_AssemblyTwin_README.pdf")

# ═══════════════════════════════════════════════════════════════════════════════
# PROPOSAL PDF
# ═══════════════════════════════════════════════════════════════════════════════
def build_proposal():
    doc = SimpleDocTemplate(
        "submission/AI_AssemblyTwin_Proposal.pdf", pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm,
        title="AI AssemblyTwin — Business Proposal",
    )
    story = []

    story += [
        Paragraph("AI AssemblyTwin — Detailed Business Proposal", H1),
        Paragraph("Accenture Innovation Challenge 2026 · Round 2", MUTED_S),
        Paragraph("Team: Jayanth  ·  Abhinav  ·  Sagar", MUTED_S),
        hr(), sp(4),
    ]

    story += [
        Paragraph("Executive Summary", H2),
        Paragraph(
            "AI AssemblyTwin is a production-grade digital twin of a 45-station vehicle assembly line. "
            "It combines real-time SimPy simulation, four trained ML models, and a full-stack web application "
            "to deliver predictive quality and maintenance intelligence — before defects reach the customer. "
            "The system directly addresses all four constraints in the Round 2 brief: uneven sensor coverage, "
            "multi-causal defect origins, read-only OPC-UA architecture, and multi-stakeholder dashboards. "
            "Payback period: 2.5 months. 3-year net ROI: ₹6.1 Crore per plant.",
            BODY), sp(4),
    ]

    story += [
        Paragraph("Problem Statement Alignment", H2),
    ]
    align_data = [
        ["Constraint", "Our Solution"],
        ["Uneven sensor coverage",    "Gaussian Process imputes missing readings in real-time with explicit uncertainty σ"],
        ["Multi-causal defect origins","Random Forest with lag features traces upstream causality: /api/causal/chain/{id}"],
        ["No direct PLC modifications","Read-only OPC-UA model; all interventions require human supervisor approval"],
        ["Multi-stakeholder views",    "4-tab Analytics: Floor Supervisor · Plant Manager · Leadership · ESG"],
    ]
    story += [tbl(align_data, [5.5*cm, 11*cm]), sp(8)]

    story += [
        Paragraph("Technical Architecture", H2),
        Paragraph("Data Flow:", H3),
        Paragraph(
            "SimPy Assembly Simulation (45 stations) → FastAPI Backend (4 ML models, 10 API endpoints, WebSocket) "
            "→ Next.js 14 Frontend (6 pages, real-time data binding, Framer Motion animations).",
            BODY), sp(4),
        Paragraph("ML Model Details:", H3),
    ]
    ml_detail = [
        ["Model", "Algorithm", "Key Innovation", "Output"],
        ["Anomaly Detector",     "Isolation Forest",  "Unsupervised — no labelled data needed",   "anomaly_score ∈ [-1,1]"],
        ["Bottleneck Predictor", "LSTM (2-layer)",     "Converted to NumPy — <100MB RAM on cloud", "prob per station ∈ [0,1]"],
        ["Defect Predictor",     "Random Forest 200t", "Lag features capture upstream causality",   "defect_risk + feature importance"],
        ["Sensor Imputer",       "Gaussian Process",   "Explicit uncertainty for legacy stations",  "value + σ"],
    ]
    story += [tbl(ml_detail, [3.5*cm, 3.5*cm, 5.5*cm, 4*cm]), sp(8)]

    story += [
        Paragraph("UI/UX Design Decisions", H2),
        Paragraph("<b>Before/After Toggle:</b> Toggle Digital Twin OFF → shows cost of inaction (₹48L rework, 4.2hr downtime). Toggle ON → shows what the twin prevented. Instantly quantifies ROI for any audience.", BODY),
        Paragraph("<b>WHY? Explainability:</b> Anomalous stations show a WHY? button. Clicking it shows SHAP-style feature importance in plain English. Addresses the black-box AI concern in 10 seconds.", BODY),
        Paragraph("<b>Predictive Maintenance Calendar:</b> Monthly view with colour-coded dates. Proactive vs reactive cost comparison banner (8.3× multiplier). Turns abstract ML into an operational schedule.", BODY),
        Paragraph("<b>Live ROI Ticker:</b> Ticks up in ₹ at ₹800/minute baseline. Jumps by ₹3.5L on every approved intervention. Makes savings tangible in real-time during a live demo.", BODY),
        Paragraph("<b>Multi-Site Network:</b> 3-plant overview proves enterprise scalability from day one. Not a lab prototype.", BODY),
        sp(4),
    ]

    story += [
        Paragraph("Stakeholder Value", H2),
    ]
    stake_data = [
        ["Stakeholder", "Key Value"],
        ["Floor Supervisor",    "Real-time anomaly map + WHY? explainability + one-click intervention approval"],
        ["Plant Manager",       "7-day throughput trends + bottleneck frequency + maintenance calendar"],
        ["Leadership / CXO",    "Interactive ROI calculator + 3-plant network + ESG impact metrics"],
        ["CSR / Sustainability", "CO₂, steel, energy saved per session + UN SDG 9/12/13 alignment"],
    ]
    story += [tbl(stake_data, [4.5*cm, 12*cm]), sp(8)]

    story += [
        Paragraph("ROI Model", H2),
    ]
    roi_data = [
        ["Item", "Value", "Basis"],
        ["Deployment cost",             "₹45 L",        "Infrastructure + 4-week integration"],
        ["Defect cost avoided",         "₹3.5 L/event", "Industry avg rework cost per escaped defect"],
        ["Throughput gain",             "+4.2%",         "Bottleneck removal via proactive scheduling"],
        ["Monthly savings",             "₹18 L",         "Blended: defect prevention + throughput + maintenance"],
        ["Payback period",              "~2.5 months",   "₹45L ÷ ₹18L"],
        ["3-year ROI",                  "₹6.1 Cr net",   "36 × ₹18L − ₹45L"],
        ["Emergency repair multiplier", "8.3×",          "Reactive vs proactive industry benchmark"],
    ]
    story += [tbl(roi_data, [5*cm, 3.5*cm, 8*cm]), sp(8)]

    story += [
        Paragraph("ESG & Sustainability Case", H2),
        Paragraph("Per prevented scrap vehicle: 333 kg CO₂ avoided · 180 kg steel saved · 12L paint solvent avoided · 0.4 kWh energy saved.", BODY),
        Paragraph("UN SDG Alignment: SDG 9 (Industry & Innovation) · SDG 12 (Responsible Consumption) · SDG 13 (Climate Action).", BODY),
        Paragraph("Accenture has committed to Net Zero by 2025. Every prevented scrap vehicle is a measurable, auditable CO₂ reduction that directly supports client ESG reporting.", BODY),
        sp(4),
    ]

    story += [
        Paragraph("Implementation Timeline", H2),
    ]
    timeline_data = [
        ["Phase", "Duration", "Deliverable"],
        ["Data & Simulation",    "Week 1–2", "SimPy model, synthetic dataset, OPC-UA schema"],
        ["ML Training",          "Week 2–3", "All 4 models trained, validated, serialised"],
        ["Backend API",          "Week 3–4", "FastAPI + WebSocket, all 10 endpoints"],
        ["Frontend UI",          "Week 4–6", "All 6 pages, real-time integration"],
        ["Integration & Testing","Week 6–7", "E2E demo, load testing, edge case hardening"],
        ["Deployment",           "Week 8",   "Docker compose, documentation, handover"],
    ]
    story += [tbl(timeline_data, [4*cm, 3*cm, 9.5*cm]), sp(8)]

    story += [
        Paragraph("Team", H2),
        Paragraph("• Jayanth — AI & System Architecture", BODY),
        Paragraph("• Abhinav — Industrial Integration & Telemetry", BODY),
        Paragraph("• Sagar — Frontend UX & Data Analytics", BODY),
        sp(4),
        Paragraph("GitHub: github.com/jay-git00/DigitalTwin.ai", make_style("link", fontSize=11, textColor=ACCENT, fontName="Helvetica-Oblique")),
    ]

    doc.build(story)
    print("PROPOSAL PDF saved → submission/AI_AssemblyTwin_Proposal.pdf")

if __name__ == "__main__":
    build_readme()
    build_proposal()
    print("\nAll documents generated in /submission/")
