<div align="center">

# 🏭 AI AssemblyTwin

### *Real-time AI-powered Digital Twin for Vehicle Assembly*

**Accenture Innovation Challenge 2026 — Round 2 Submission**

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

</div>

---

## 🎯 What It Does

AI AssemblyTwin is a **live, full-stack Digital Twin** of a 45-station vehicle assembly line. It doesn't replay recorded data — it runs a real SimPy simulation, streams telemetry via WebSocket, and runs four ML models in real-time to:

- 🔴 **Detect anomalies** (Isolation Forest) before they become defects
- 📈 **Predict bottlenecks** (PyTorch LSTM) from cycle-time trends
- 🔗 **Trace defect propagation** (Random Forest) from origin station to QC
- 🩺 **Impute missing sensor data** (Gaussian Process) for legacy stations with uncertainty bounds

---

## 🚀 Quick Start

> **Requirements:** Python 3.11+ · Node.js 20+

### Option A — One-click (Windows)
```bash
run.bat
```

### Option B — Manual

**Terminal 1 — Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm install
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)**

---

## 🗺️ Pages & Features

| Page | What You See |
|---|---|
| **`/`** Live Floor | 45-station factory map · sparklines · health gauge · ₹ ROI ticker · Before/After toggle · WHY? explainability |
| **`/alerts`** Alerts | Real-time alert feed · virtual intervention simulator · approve / dismiss |
| **`/analytics`** Analytics | 4 views: Floor Supervisor · Plant Manager · Leadership · **ESG / Sustainability** |
| **`/defect-trace`** Defect Trace | Causal defect chain from origin station → QC Gate |
| **`/maintenance`** Maintenance | AI-predicted maintenance calendar · proactive vs reactive cost comparison |
| **`/multisite`** Multi-Site | 3-plant enterprise overview (Chennai · Pune · Bangalore) |

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                │
│  Live Floor · Alerts · Analytics · Maintenance · ...   │
│  Framer Motion · Recharts · WebSocket client           │
└─────────────────────┬──────────────────────────────────┘
                      │ WebSocket + REST
┌─────────────────────▼──────────────────────────────────┐
│                   BACKEND (FastAPI)                     │
│  /ws/live · /api/stations · /api/alerts · /api/esg     │
│  /api/maintenance · /api/multisite · /api/causal       │
└──────┬──────────┬──────────┬──────────┬────────────────┘
       │          │          │          │
  SimPy Sim  Isolation  LSTM LSTM   Random     Gaussian
  (45 stn)   Forest    Bottleneck   Forest      Process
             Anomaly   Predictor    Defect      Imputer
             Detector               Predictor
```

### Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Simulation | `SimPy` | Python-native discrete-event, realistic cycle drift |
| Realtime Pipeline | `FastAPI` + `WebSockets` | Async, sub-100ms inference streaming |
| Frontend | `Next.js 14` + `Framer Motion` | Server components + fluid animations |
| Anomaly Detection | `Isolation Forest` (scikit-learn) | Unsupervised — no labelled fault data needed |
| Bottleneck Prediction | `PyTorch LSTM` | Captures non-linear temporal sequence drift |
| Defect Causality | `Random Forest` + lag features | Upstream torque → downstream QC failure chain |
| Sensor Imputation | `Gaussian Process` | Explicit uncertainty bounds for legacy stations |

---

## 📡 API Reference

| Endpoint | Description |
|---|---|
| `WS /ws/live` | Real-time station telemetry stream |
| `GET /api/stations/status` | All 45 station current state |
| `GET /api/alerts` | Active + historical alerts |
| `GET /api/system/health` | Factory health score (0–100%) |
| `GET /api/explainability/{id}` | SHAP-style feature importance for a station |
| `GET /api/sparkline/{id}` | Last 20 cycle-time readings |
| `GET /api/maintenance/schedule` | AI-predicted maintenance actions + due dates |
| `GET /api/multisite` | 3-plant enterprise network data |
| `GET /api/esg` | CO₂, steel, energy saved — ESG metrics |
| `GET /api/causal/chain/{id}` | Defect propagation chain from origin → QC |
| `GET /api/roi` | ROI stats (defect cost avoided, throughput recovered) |
| `POST /api/demo/inject_fault` | Trigger demo scenario (bottleneck / defect) |
| `POST /api/demo/reset` | Clean simulation restart |

---

## 🧠 ML Models

All models are pre-trained and loaded at startup from `backend/models/artifacts/`.

| Model | Algorithm | Input Features | Output |
|---|---|---|---|
| `AnomalyDetector` | Isolation Forest | cycle_time, torque, vibration, temp | anomaly_score ∈ [-1, 1] |
| `BottleneckPredictor` | LSTM (2-layer) | 10-step cycle-time windows | bottleneck_prob ∈ [0, 1] |
| `DefectPredictor` | Random Forest | cycle/torque + 2 lag features | defect_risk ∈ [0, 1] |
| `SensorImputer` | Gaussian Process | neighbour station readings | imputed_value + σ (uncertainty) |

---

## 🎬 Demo Walkthrough

### 1 — Before / After Toggle
On the Live Floor (`/`), toggle **"Digital Twin: OFF"**. The banner shows what would happen without the twin: 12 vehicles passed QC with defects, ₹48L rework cost. Toggle it back **ON** to show what the twin actually prevented.

### 2 — Inject a Fault
Use the **Demo Controls** panel (bottom-right):
- **Bottleneck** at Station 12 → watch the station turn amber → LSTM alert fires → click **WHY?** to see SHAP feature importance.
- **Defect** at Station 7 → navigate to `/defect-trace` → watch the risk propagate through 37 downstream stations to QC Gate.

### 3 — Maintenance Calendar
Go to `/maintenance`. The AI has predicted which stations will need intervention in the next 30 days based on cycle-time drift. The banner shows: **proactive maintenance costs ₹X. Waiting until failure costs 8.3× more.**

### 4 — Multi-Site Scale
Go to `/multisite`. Three plants — Chennai (live), Pune (monitoring), Bangalore (optimal) — all running on the same AI backbone. This proves the solution is enterprise-ready, not a prototype.

### 5 — ESG Tab
Go to `/analytics` → **ESG / Sustainability**. Every prevented scrap vehicle = CO₂ saved, steel waste avoided, paint waste reduced. Aligned to **SDG 9, 12, and 13** — directly matching Accenture's Net Zero 2025 commitment.

---

## 🌿 ESG Alignment

AI AssemblyTwin directly contributes to Accenture's sustainability commitments:

- **SDG 9** — Industry, Innovation & Infrastructure
- **SDG 12** — Responsible Consumption & Production
- **SDG 13** — Climate Action

Each prevented scrap vehicle saves ~180 kg steel, 12L paint solvent, and ~333 kg CO₂.

---

## 💰 ROI Model

| Metric | Value |
|---|---|
| Deployment cost | ₹45 L |
| Monthly savings (defect prevention + throughput) | ₹18 L |
| Payback period | ~2.5 months |
| 3-year projected savings | ₹6.1 Cr |
| Emergency repair multiplier (reactive vs proactive) | 8.3× |

---

## 👥 Team
- Jayanth
- Abhinav
- Sagar

---

## 📄 License
MIT — see [LICENSE](LICENSE)
