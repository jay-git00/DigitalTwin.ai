# AI AssemblyTwin — Technical Proposal
### Accenture Innovation Challenge 2026 · Round 2

---

## Executive Summary

AI AssemblyTwin is a proof-of-concept digital twin of a 45-station vehicle assembly line. It combines discrete-event simulation (SimPy), four machine learning models, and a full-stack web application to deliver predictive quality and bottleneck intelligence before cycle-time delays or quality defects propagate down the line.

The system runs a live simulation backend, streams telemetry over WebSockets, and provides interactive views for four operational roles: Floor Supervisor, Plant Manager, Leadership, and ESG/Sustainability.

---

## Problem Framing & Challenge Alignment

The Round 2 brief defines four operational constraints. AI AssemblyTwin addresses each directly in its prototype architecture:

| Challenge Constraint | Prototype Solution |
|---|---|
| **Uneven sensor coverage** | Gaussian Process Regression (GPR) imputes missing torque, vibration, and temperature readings in real time for 7 legacy stations, providing explicit uncertainty bounds ($\sigma$) in the UI. |
| **Multi-causal defect origins** | A Random Forest model with lag features traces downstream quality check (QC) failures back to upstream origin stations; the `/api/causal-chain/{id}` endpoint provides the propagation timeline. |
| **No direct PLC modifications** | Read-only telemetry architecture; all interventions are evaluated virtually within the prototype's Intervention Simulator and require supervisor approval before updating simulation state. |
| **Multi-stakeholder views** | Dedicated dashboards serving Floor Supervisors (Live Floor), Plant Managers (Analytics & Maintenance), Leadership (ROI Estimator), and Sustainability Teams (ESG). |

---

## Solution Design & Technical Architecture

### System Data Flow

```
SimPy Assembly Simulation (45 stations)
         │
         ▼
   FastAPI Backend
   ├── WebSocket /ws/live            → real-time station telemetry & alerts
   ├── Isolation Forest              → per-station anomaly_score
   ├── NumPy LSTM Predictor          → bottleneck_prob forecasting
   ├── Random Forest Defect Model    → defect_risk + causal propagation chain
   └── Gaussian Process Imputer      → sensor value + uncertainty (σ)
         │
         ▼
   Next.js 14 Frontend
   ├── /               Live factory floor map & floating demo controls
   ├── /analytics      Multi-stakeholder analytics & ROI calculator
   ├── /defect-trace   Upstream root-cause propagation graph
   ├── /maintenance    Preventive maintenance calendar
   └── /multisite      Multi-plant overview dashboard
```

### Machine Learning Models

1. **Unsupervised Anomaly Detector (Isolation Forest)**
   - Evaluates rolling 10-cycle telemetry buffers (`cycle_time_s`, `torque_nm`, `vibration_g`, `temperature_c`) per station.
   - Output: `anomaly_score` $\in [-1, 1]$. Scores below $-0.12$ trigger anomaly warnings.
   - Rationale: Unsupervised anomaly detection identifies baseline drift without requiring pre-labeled failure datasets.

2. **Temporal Bottleneck Predictor (NumPy LSTM)**
   - 2-layer LSTM architecture operating on a 30-cycle lookback window across all 45 stations.
   - Executed via a pure NumPy forward-pass inference engine loading weights from `bottleneck_lstm_weights.npz` (~0.91 MB), eliminating heavy runtime dependency overhead.
   - Output: `bottleneck_prob` $\in [0, 1]$ and estimated minutes to bottleneck (ETA).

3. **Multi-Causal Defect Predictor (Random Forest)**
   - Evaluates cycle-time and sensor telemetry across key upstream stations using lagged feature windows.
   - Output: `defect_risk` $\in [0, 1]$ and feature importance ranking for root-cause explainability.
   - Rationale: Lagged feature vectors capture process offsets (e.g., Station 7 torque drift) that result in Station 44 quality failures.

4. **Sensor Imputer (Gaussian Process Regression)**
   - Uses Radial Basis Function (RBF) kernels trained on station neighborhood correlations.
   - Input: Adjacent station telemetry for the 7 legacy sensor-poor stations (e.g., Station 5).
   - Output: Imputed target values plus explicit uncertainty ($\sigma$) bounds.

---

## Target Users & Operational Dashboards

1. **Floor Supervisor (Live Floor Map — `/`)**
   - Real-time 45-station map with visual color coding (Normal, Watch, Anomaly/Fault).
   - Interactive **WHY? Explainability** modal displaying feature z-scores for anomalous stations.
   - **Intervention Simulator**: Test candidate countermeasures (Add 1 Technician, Reduce Feed Rate 15%, Pause Upstream Buffer) before approving.

2. **Plant Manager (Analytics & Maintenance — `/analytics` & `/maintenance`)**
   - Hourly throughput trends and recurring bottleneck station metrics.
   - Predictive maintenance schedule mapping station cycle-time drift to estimated downtime.

3. **Leadership / CXO (Analytics & Multi-Site — `/analytics` & `/multisite`)**
   - Interactive ROI calculator estimating payback periods based on user-defined operational inputs.
   - Multi-plant dashboard comparing health indicators across sites.

4. **Sustainability Team (ESG Dashboard — `/analytics`)**
   - Estimates for avoided material scrap, paint solvent reduction, and energy efficiency.

---

## Business Case & Illustrative Impact Model

> [!NOTE]
> All financial, throughput, and waste reduction figures below represent **illustrative prototype assumptions and scenario estimates** developed for demonstration purposes.

| Metric | Illustrative Prototype Assumption | Basis / Estimation Logic |
|---|---|---|
| **Estimated Integration Cost** | ₹45 Lakhs | Prototype estimate for software deployment & data mapping |
| **Escaped Defect Cost** | ₹3.5 Lakhs / incident | Industry benchmark assumption for downstream rework |
| **Estimated Throughput Impact** | Up to +4.2% | Scenario estimate from proactive bottleneck mitigation |
| **Estimated Monthly Savings** | ₹18 Lakhs | Combined estimate from defect prevention & downtime reduction |
| **Estimated Payback Period** | **~2.5 Months** | Ratio of initial integration estimate to monthly savings |
| **Reactive Repair Multiplier** | 8.3× | Industry benchmark ratio comparing reactive to preventive repair costs |

### Illustrative ESG & Sustainability Estimates

For each scrap vehicle avoided through early defect identification, estimated savings include:
- **~180 kg steel** (approximately 333 kg $\text{CO}_2$ equivalent based on 1.85 kg $\text{CO}_2$/kg steel)
- **~12 L** paint solvent waste
- **~0.4 kWh** energy optimization per vehicle cycle

**UN Sustainable Development Goals (SDG) Alignment:**
- **SDG 9**: Industry, Innovation & Infrastructure
- **SDG 12**: Responsible Consumption & Production
- **SDG 13**: Climate Action

---

## Implementation Architecture & Phased Roadmap

### System Characteristics
- **Stateful Backend Engine**: FastAPI backend hosting a continuous SimPy discrete-event simulation thread and WebSocket broadcaster (`/ws/live`).
- **Read-Only Telemetry Integration**: Designed around non-intrusive OPC-UA data collection without requiring direct write access to PLC controllers.
- **Human-in-the-Loop Control**: Virtual Intervention Simulator evaluates proposed countermeasures interactively, requiring supervisor approval within the UI before updating the twin's state.

### Phased 8-Week Implementation Roadmap

| Phase | Timeline | Key Deliverables |
|---|---|---|
| **Phase 1: Data Infrastructure** | Weeks 1–2 | OPC-UA telemetry mapping, data schema definition, and legacy station audit. |
| **Phase 2: Model Calibration** | Weeks 2–4 | Baseline model training (Isolation Forest, GPR, LSTM, Random Forest) on historical telemetry. |
| **Phase 3: Backend Integration** | Weeks 4–5 | FastAPI backend pipeline, WebSocket event streaming, and model weight serialization. |
| **Phase 4: Dashboard & UI** | Weeks 5–7 | Next.js frontend integration across Live Floor, Analytics, Defect Trace, and Maintenance views. |
| **Phase 5: Validation & Deployment** | Weeks 7–8 | End-to-end integration testing, supervisor training drills, and initial plant rollout. |

---

## Key Risks & Mitigations

| Identified Risk | Risk Description | Proposed Mitigation |
|---|---|---|
| **Imputation Uncertainty on Legacy Stations** | Low sensor density on legacy stations may reduce confidence in imputed metrics. | Display explicit Gaussian Process uncertainty ($\sigma$) bounds in the UI so supervisors see model confidence before taking action. |
| **False Alert Fatigue** | Over-sensitive anomaly thresholds could lead to supervisors ignoring valid warnings. | Contamination parameters are set low (4%), and alerts require multi-cycle persistence or model probability $>0.40$. |
| **Network & WebSocket Disconnections** | Transient network drops could interrupt live floor telemetry streaming. | The frontend client includes auto-reconnect logic with exponential backoff and REST status polling fallbacks. |
| **Operator Trust & Adoption** | Supervisors may hesitate to act on "black box" model recommendations. | Integrated **WHY? Explainability** panels show feature contributions (z-scores) for every anomaly alert. |

---

## Project Team

| Team Member | Primary Role |
|---|---|
| **Jayanth** | AI & System Architecture |
| **Abhinav** | Industrial Integration & Telemetry |
| **Sagar** | Frontend UX & Data Analytics |
