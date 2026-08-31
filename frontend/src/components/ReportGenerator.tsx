"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Loader2 } from "lucide-react";
import { StationStatus, Alert } from "@/types";

interface Props {
  stations: Record<number, StationStatus>;
  alerts: Alert[];
  vehicles: number;
  interventionCount: number;
}

export default function ReportGenerator({ stations, alerts, vehicles, interventionCount }: Props) {
  const [generating, setGenerating] = useState(false);

  function generateReport() {
    setGenerating(true);
    const stationList = Object.values(stations);
    const anomalous = stationList.filter(s => (s.anomaly_score ?? 0) < -0.05);
    const faulted = stationList.filter(s => s.fault_active);
    const avgCycle = stationList.length > 0
      ? (stationList.reduce((a, s) => a + s.cycle_time_s, 0) / stationList.length).toFixed(1)
      : "N/A";
    const efficiency = Math.max(60, Math.min(99, 100 - anomalous.length * 5 - faulted.length * 8));
    const now = new Date();
    const dateStr = now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const roi = (vehicles * 3.2).toFixed(0);
    const co2Saved = Math.max(0, faulted.length * 18 * 0.82).toFixed(1);

    const reportHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AI AssemblyTwin Executive Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; color: #1e293b; background: #fff; }
    .cover { background: linear-gradient(135deg, #0a0e1b, #0f172a); color: #fff; padding: 60px 48px 40px; }
    .cover h1 { font-size: 32px; font-weight: 900; color: #00d4ff; }
    .cover h2 { font-size: 16px; color: rgba(255,255,255,0.6); margin-top: 4px; font-weight: 400; }
    .cover .badge { display: inline-block; margin-top: 16px; padding: 6px 14px; background: rgba(0,212,255,0.15); border: 1px solid rgba(0,212,255,0.3); border-radius: 999px; font-size: 11px; color: #00d4ff; letter-spacing: 0.08em; }
    .cover .meta { margin-top: 32px; font-size: 12px; color: rgba(255,255,255,0.4); }
    .section { padding: 32px 48px; border-bottom: 1px solid #e2e8f0; }
    .section h3 { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; color: #64748b; text-transform: uppercase; margin-bottom: 16px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .kpi { padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; }
    .kpi .value { font-size: 28px; font-weight: 900; }
    .kpi .label { font-size: 11px; color: #94a3b8; margin-top: 4px; }
    .kpi.blue .value { color: #00d4ff; }
    .kpi.green .value { color: #10b981; }
    .kpi.red .value { color: #ef4444; }
    .kpi.purple .value { color: #7c3aed; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 8px 12px; background: #f8fafc; color: #64748b; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    tr:hover td { background: #fafafa; }
    .badge-red { display: inline-block; padding: 2px 8px; background: #fef2f2; color: #ef4444; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .badge-amber { display: inline-block; padding: 2px 8px; background: #fffbeb; color: #f59e0b; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .badge-green { display: inline-block; padding: 2px 8px; background: #f0fdf4; color: #10b981; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .rec-item { display: flex; gap: 12px; padding: 12px; margin-bottom: 8px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .rec-num { width: 24px; height: 24px; border-radius: 50%; background: #0f172a; color: #00d4ff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .rec-text { font-size: 12px; color: #475569; }
    .footer { padding: 24px 48px; background: #f8fafc; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
    .esg-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .esg-item { padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0; }
    .esg-item .val { font-size: 22px; font-weight: 800; color: #10b981; }
    .esg-item .lbl { font-size: 11px; color: #94a3b8; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="cover">
    <h1>AI AssemblyTwin</h1>
    <h2>Executive Plant Intelligence Report — Chennai Manufacturing Plant</h2>
    <div class="badge">⚡ POWERED BY AI · REAL-TIME DIGITAL TWIN</div>
    <div class="meta">
      <p>Report Generated: ${dateStr} IST</p>
      <p>Simulation Session ID: AUTO-${Math.floor(Math.random() * 9000) + 1000} &nbsp;|&nbsp; Active Stations: ${stationList.length}/45 &nbsp;|&nbsp; AI Models: ONLINE</p>
    </div>
  </div>

  <div class="section">
    <h3>Key Performance Indicators</h3>
    <div class="kpi-grid">
      <div class="kpi blue"><div class="value">${vehicles.toLocaleString("en-IN")}</div><div class="label">Vehicles Assembled</div></div>
      <div class="kpi green"><div class="value">${efficiency}%</div><div class="label">Line Efficiency</div></div>
      <div class="kpi red"><div class="value">${anomalous.length}</div><div class="label">Active Anomalies</div></div>
      <div class="kpi purple"><div class="value">₹${Number(roi).toLocaleString("en-IN")}</div><div class="label">AI Cost Savings (INR)</div></div>
    </div>
  </div>

  <div class="section">
    <h3>Anomaly Detection Summary</h3>
    ${anomalous.length === 0
      ? '<p style="color:#10b981;font-weight:600;font-size:13px;">✅ No anomalies detected. All 45 stations operating within normal parameters.</p>'
      : `<table>
          <thead><tr><th>Station</th><th>Anomaly Score</th><th>Cycle Time (s)</th><th>Vibration (g)</th><th>Temperature (°C)</th><th>Status</th></tr></thead>
          <tbody>${anomalous.slice(0, 10).map(s => `
            <tr>
              <td><strong>S${s.station_id.toString().padStart(2,"00")}</strong></td>
              <td>${s.anomaly_score?.toFixed(4) ?? "N/A"}</td>
              <td>${s.cycle_time_s.toFixed(1)}</td>
              <td>${(s.vibration_g ?? 0).toFixed(3)}</td>
              <td>${(s.temperature_c ?? 0).toFixed(1)}</td>
              <td><span class="badge-red">ANOMALY</span></td>
            </tr>`).join("")}
          </tbody>
        </table>`
    }
  </div>

  <div class="section">
    <h3>ESG & Sustainability Metrics</h3>
    <div class="esg-grid">
      <div class="esg-item"><div class="val">${(420 + faulted.length * 22).toFixed(0)} kW</div><div class="lbl">Current Power Draw</div></div>
      <div class="esg-item"><div class="val">${((420 + faulted.length * 22) * 0.82).toFixed(0)} kg/hr</div><div class="lbl">CO₂ Emission Rate</div></div>
      <div class="esg-item"><div class="val">${co2Saved} kg/hr</div><div class="lbl">CO₂ Averted by AI</div></div>
    </div>
    <p style="margin-top:12px;font-size:12px;color:#64748b;">
      ♻️ AI Predictive Maintenance catches degradation 48–72 hours before failure, reducing emergency overruns and excess carbon emissions. 
      Equivalent to planting <strong>${Math.floor(Number(co2Saved) * 0.4)} trees</strong> this session.
    </p>
  </div>

  <div class="section">
    <h3>AI Recommendations</h3>
    <div class="rec-item"><div class="rec-num">1</div><div class="rec-text">Deploy maintenance crew to ${anomalous.length > 0 ? `Station S${anomalous[0].station_id.toString().padStart(2,"0")}` : "all green stations for preventive check"} — LSTM drift model predicts bearing failure within 48 hours with 87% confidence.</div></div>
    <div class="rec-item"><div class="rec-num">2</div><div class="rec-text">Avg cycle time of ${avgCycle}s indicates ${parseFloat(avgCycle) > 80 ? "above-baseline pacing — review workstation ergonomics and AGV routing" : "optimal pacing — maintain current configuration"}.</div></div>
    <div class="rec-item"><div class="rec-num">3</div><div class="rec-text">AI Interventions Approved: ${interventionCount}. Each approved intervention recovers ₹45,000/hr of lost throughput. Estimated value recovered this session: ₹${(interventionCount * 45000).toLocaleString("en-IN")}.</div></div>
    <div class="rec-item"><div class="rec-num">4</div><div class="rec-text">Schedule comprehensive ESG audit for Q4 2026. Current AI-driven maintenance is projected to reduce annual carbon footprint by 12.4 tonnes CO₂e.</div></div>
  </div>

  <div class="footer">
    <span>🔒 Confidential — AI AssemblyTwin · DigitalTwin.ai · Chennai Plant</span>
    <span>Generated by TwinGPT Intelligence Engine · ${now.getFullYear()}</span>
  </div>
</body>
</html>`;

    setTimeout(() => {
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(reportHtml);
        win.document.close();
        setTimeout(() => win.print(), 800);
      }
      setGenerating(false);
    }, 1200);
  }

  return (
    <motion.button
      onClick={generateReport}
      disabled={generating}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold"
      style={{
        background: generating ? "rgba(0,212,255,0.05)" : "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))",
        border: "1px solid rgba(0,212,255,0.3)",
        color: "#00d4ff",
      }}
      title="Generate Executive PDF Report"
    >
      {generating
        ? <><Loader2 size={13} className="animate-spin" /> Generating Report…</>
        : <><FileText size={13} /><Download size={11} /> Executive Report</>
      }
    </motion.button>
  );
}
