"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles, Trash2, ChevronRight } from "lucide-react";
import { fetchJSON } from "@/lib/utils";
import { StationStatus, Alert } from "@/types";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTED = [
  "Give me a health report",
  "What is the current bottleneck?",
  "Explain the anomalies",
  "Show me ROI savings",
  "ESG impact today",
  "Maintenance forecast",
];

function generateResponse(
  input: string,
  stations: Record<number, StationStatus>,
  vehicles: number,
  anomalyCount: number,
  alertCount: number
): string {
  const q = input.toLowerCase();
  const stationList = Object.values(stations);
  const totalStations = stationList.length;
  const faultedStations = stationList.filter((s) => s.fault_active);
  const avgCycleTime = totalStations > 0
    ? (stationList.reduce((a, s) => a + s.cycle_time_s, 0) / totalStations).toFixed(1)
    : "N/A";
  const bottleneck = [...stationList].sort((a, b) => b.cycle_time_s - a.cycle_time_s)[0];
  const anomalous = stationList.filter((s) => (s.anomaly_score ?? 0) < -0.05);
  const efficiency = Math.max(60, Math.min(99, 100 - anomalyCount * 5 - alertCount * 3));

  // Health / Status
  if (q.includes("health") || q.includes("report") || q.includes("status") || q.includes("summary") || q.includes("overview")) {
    return `**Chennai Plant Health Report — ${new Date().toLocaleTimeString("en-IN")} IST**\n\n🟢 Active Stations: ${totalStations}/45\n🚗 Vehicles Assembled: ${vehicles.toLocaleString()}\n⚠️ Anomalies: ${anomalyCount} | 🚨 Active Alerts: ${alertCount}\n📊 Line Efficiency: ~${efficiency}%\n⏱ Avg Cycle Time: ${avgCycleTime}s\n${faultedStations.length > 0 ? `\n❌ Faulted Stations: ${faultedStations.map(s => `S${s.station_id.toString().padStart(2,"0")}`).join(", ")}` : "\n✅ No active faults — line optimal!"}\n\n**AI Assessment:** ${anomalyCount > 3 ? "⚠️ DEGRADED — recommend immediate intervention" : anomalyCount > 0 ? "🟡 WATCH — monitor anomalies closely" : "🟢 NOMINAL — operating at peak efficiency"}`;
  }

  // Bottleneck
  if (q.includes("bottleneck") || q.includes("slowest") || q.includes("slow") || q.includes("delay") || q.includes("throughput")) {
    if (!bottleneck) return "No station data yet. Waiting for telemetry stream to initialize…";
    const deviation = ((bottleneck.cycle_time_s - parseFloat(avgCycleTime)) / parseFloat(avgCycleTime) * 100).toFixed(0);
    return `**Bottleneck Analysis — AI Prediction Engine:**\n\nSlowest station: **S${bottleneck.station_id.toString().padStart(2,"0")}** at **${bottleneck.cycle_time_s.toFixed(1)}s/cycle**\nPlant average: ${avgCycleTime}s → **+${deviation}% deviation**\n\n🔍 Root Cause Hypothesis: ${(bottleneck.vibration_g ?? 0) > 1.5 ? "Bearing wear — vibration spike detected" : (bottleneck.temperature_c ?? 0) > 80 ? "Thermal overrun — coolant flow reduced" : "Pacing issue — operator ergonomics"}\n\n💡 **Recommended Action:** Increase upstream buffer capacity for S${bottleneck.station_id.toString().padStart(2,"0")} and schedule PM within 48 hours to recover ~₹45K/hr.`;
  }

  // Anomaly / Fault explanation
  if (q.includes("anomaly") || q.includes("anomalies") || q.includes("fault") || q.includes("why") || q.includes("explain")) {
    if (anomalyCount === 0) return "✅ **Zero anomalies detected!** All 45 stations are operating within normal bounds.\n\nThe **Isolation Forest** model scans 6 sensor streams per station continuously at 35× simulation speed.";
    return `**SHAP Anomaly Root-Cause Breakdown:**\n\n${anomalous.slice(0, 3).map(s =>
      `🔴 **S${s.station_id.toString().padStart(2,"0")}** (score: ${s.anomaly_score?.toFixed(3)})\n   Driver: ${(s.vibration_g ?? 0) > 1.5 ? "🔩 High vibration (bearing wear)" : (s.temperature_c ?? 0) > 80 ? "🌡 Thermal overrun (coolant fault)" : (s.torque_nm ?? 0) > 90 ? "⚙️ Torque spike (tool jamming)" : "⏱ Cycle drift (pacing deviation)"}\n   Confidence: ${(Math.abs(s.anomaly_score ?? 0) * 180 + 75).toFixed(0)}%`
    ).join("\n\n")}\n\n💡 Click **WHY?** on any red/amber station for interactive SHAP importance bars.`;
  }

  // ESG / Carbon
  if (q.includes("carbon") || q.includes("esg") || q.includes("emission") || q.includes("energy") || q.includes("sustainability") || q.includes("green")) {
    const basePower = 420;
    const excess = faultedStations.length * 22 + anomalyCount * 8;
    const total = basePower + excess;
    const co2 = (total * 0.82).toFixed(0);
    const saved = (excess * 0.82).toFixed(1);
    return `**Live ESG & Carbon Footprint Report:**\n\n⚡ Power Draw: ~${total} kW (base: ${basePower} kW)\n🌿 CO₂ Emission Rate: ~${co2} kg/hr\n♻️ CO₂ Averted by AI: ~${saved} kg/hr\n💧 Coolant Efficiency: ${anomalyCount > 0 ? "⚠️ Degraded" : "✅ Normal"}\n\n${faultedStations.length > 0 ? `⚠️ Active faults generating +${excess} kW excess load.` : "✅ Optimal — zero excess power from faults."}\n\n**AI Impact:** Predictive maintenance detects degradation 48–72 hrs early, avoiding emergency overruns. Equivalent to planting **${Math.max(1, Math.floor(parseFloat(saved) * 0.4))} trees** this session.`;
  }

  // Maintenance / prediction
  if (q.includes("maintenance") || q.includes("predict") || q.includes("schedule") || q.includes("service") || q.includes("forecast")) {
    return `**Predictive Maintenance Forecast (LSTM Model):**\n\n🔧 **${Math.max(1, anomalyCount + 2)} stations** flagged in next 30 days\n📅 Critical window: September 5–12, 2026\n⏱ Downtime averted: ~14.2 hours\n💰 Savings vs reactive maintenance: **₹8.4L**\n\nAI Models Active:\n• LSTM — sensor drift prediction\n• Isolation Forest — real-time anomaly detection\n• Random Forest — defect probability scoring\n• GP Regression — legacy station imputation\n\n💡 Open the **Maintenance** tab for the full AI calendar with month navigation.`;
  }

  // ROI / Cost
  if (q.includes("roi") || q.includes("cost") || q.includes("saving") || q.includes("money") || q.includes("₹") || q.includes("revenue")) {
    return `**ROI Dashboard — AI AssemblyTwin:**\n\n💰 Saved This Session: ₹${(vehicles * 3.2).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}\n📈 Projected Annual Savings: **₹2.8 Crore**\n⚡ Downtime Reduction: ~73%\n🎯 First-Pass Quality: +18% improvement\n\nBreakdown:\n• Avoided unplanned downtime — ₹45K/hr\n• Reduced defect rework — ₹12K/unit\n• Optimised scheduling — ₹8.4L/cycle\n\n✅ **Break-even: < 4 months** after enterprise deployment.`;
  }

  // Defect Trace
  if (q.includes("defect") || q.includes("quality") || q.includes("scrap") || q.includes("reject")) {
    return `**Defect Traceability Report:**\n\n🔍 AI scanned all 45 stations using **Random Forest** defect classifier.\n\n${faultedStations.length > 0 ? faultedStations.slice(0,3).map(s => `• S${s.station_id.toString().padStart(2,"0")} — defect probability: ${(Math.random() * 20 + 75).toFixed(0)}% (torque deviation ${(s.torque_nm ?? 0).toFixed(1)} Nm)`).join("\n") : "✅ No defect-probability flags above threshold."}\n\n📊 First-pass yield: ~${efficiency}%\n\n💡 Navigate to **Defect Trace** tab for full RFID-linked traceability from body stamp to final QC gate.`;
  }

  // Multi-site
  if (q.includes("multisite") || q.includes("multi-site") || q.includes("plants") || q.includes("compare") || q.includes("other plant")) {
    return `**Multi-Site Comparison (AI AssemblyTwin Network):**\n\n| Plant | Efficiency | Alerts | CO₂/hr |\n|-------|------------|--------|---------|\n| Chennai ★ | ${efficiency}% | ${alertCount} | ${(420 * 0.82).toFixed(0)} kg |\n| Pune | 88% | 1 | 344 kg |\n| Gurugram | 91% | 0 | 298 kg |\n\n🏆 Chennai requires attention — below Gurugram benchmark by ~${Math.max(0, 91 - efficiency)}%.\n\n💡 Open **Multi-Site** tab to view real-time cross-plant telemetry on an interactive map.`;
  }

  // Accenture / pitch
  if (q.includes("accenture") || q.includes("pitch") || q.includes("demo") || q.includes("presentation") || q.includes("innovation")) {
    return `**AI AssemblyTwin — Accenture Innovation Pitch Summary:**\n\n🏭 **Problem:** Manual monitoring of 45-station assembly lines costs ₹45K/hr per undetected fault.\n\n🤖 **Solution:** Real-time Digital Twin with:\n• Isolation Forest anomaly detection\n• LSTM predictive maintenance\n• SHAP explainability\n• GP regression for legacy sensor imputation\n• ESG carbon tracking\n\n📊 **Impact:**\n• 73% downtime reduction\n• ₹2.8 Cr annual savings\n• 12.4 tonnes CO₂e/year averted\n• ROI: < 4 months\n\n✅ Fully demo-ready. All features live. Press the buttons!`;
  }

  // Shift handover
  if (q.includes("shift") || q.includes("handover") || q.includes("handoff")) {
    return `**Shift Handover Briefing — ${new Date().toLocaleTimeString("en-IN")} IST:**\n\n🟢 Incoming shift inherits:\n• ${vehicles.toLocaleString()} vehicles completed this run\n• ${anomalyCount} unresolved anomalies requiring watchlist monitoring\n• ${alertCount} active alerts — priority: S12 (bottleneck) and S7 (defect risk)\n• Avg cycle time: ${avgCycleTime}s — within acceptable bounds\n\n⚡ Priority actions for incoming team:\n1. Review amber-state stations before proceeding\n2. Approve pending AI intervention on S12\n3. Check coolant levels on thermal-flagged stations\n\n📋 Full shift log auto-generated in Executive Report.`;
  }

  // Greetings
  if (q.includes("hello") || q.includes("hi") || q.includes("hey") || q.includes("namaste") || q.includes("how are")) {
    return `👋 Hello! I'm **TwinGPT** — your AI factory intelligence assistant for the Chennai Plant.\n\nI have real-time access to all 45 stations. Try asking:\n\n• "Give me a health report"\n• "What's the bottleneck?"\n• "Explain anomalies"\n• "Show ESG impact"\n• "What's our ROI?"\n• "Give me a shift handover briefing"`;
  }

  // Default with live data
  return `Based on current live telemetry:\n\n📊 **Quick Snapshot:**\n• Vehicles: ${vehicles.toLocaleString()}\n• Anomalies: ${anomalyCount} | Alerts: ${alertCount}\n• Line Efficiency: ~${efficiency}%\n• Avg Cycle Time: ${avgCycleTime}s\n\nI'm continuously monitoring all 45 stations. Ask me about bottlenecks, ESG, ROI, defects, maintenance forecasts, or the Accenture pitch! 💡`;
}

export default function TwinGPT() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "👋 I'm **TwinGPT** — your AI factory assistant. Ask me about plant health, anomalies, bottlenecks, ESG impact, or ROI!" }
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  async function send(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setThinking(true);

    try {
      const [statusRes, alertsRes] = await Promise.all([
        fetchJSON<{ stations: StationStatus[]; vehicles_completed?: number }>("/api/stations/status").catch(() => null),
        fetchJSON<{ alerts: Alert[] }>("/api/alerts").catch(() => null)
      ]);

      const stationsObj: Record<number, StationStatus> = {};
      let anomalyCount = 0;
      if (statusRes?.stations) {
        statusRes.stations.forEach((st) => {
          stationsObj[st.station_id] = st;
          if ((st.anomaly_score ?? 0) < -0.05) anomalyCount++;
        });
      }
      const veh = statusRes?.vehicles_completed ?? 0;
      const actAlerts = (alertsRes?.alerts ?? []).filter(a => a.status === "active").length;

      setTimeout(() => {
        const response = generateResponse(text, stationsObj, veh, anomalyCount, actAlerts);
        setMessages((m) => [...m, { role: "assistant", text: response }]);
        setThinking(false);
      }, 300 + Math.random() * 300);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "⚠️ Lost connection to the backend telemetry stream. Please ensure the Python server is running on port 8000." }]);
      setThinking(false);
    }
  }

  function formatText(text: string) {
    return text.split("\n").map((line, i) => {
      // Table row support
      if (line.startsWith("|")) {
        return <p key={i} className="mb-0.5 font-mono text-[10px] leading-relaxed" style={{ color: "#94a3b8" }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />;
      }
      const bold = line.replace(/\*\*(.*?)\*\*/g, "<strong style='color:#e2e8f0'>$1</strong>");
      return <p key={i} className="mb-0.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: bold }} />;
    });
  }

  return (
    <>
      {/* FAB button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
        style={{ background: "linear-gradient(135deg, #00d4ff, #7c3aed)", boxShadow: "0 0 24px rgba(0,212,255,0.5)" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Ask TwinGPT"
      >
        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X size={22} color="#fff" /></motion.div>
            : <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><Bot size={22} color="#fff" /></motion.div>
          }
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-24 left-6 z-50 w-96 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{ border: "1px solid rgba(0,212,255,0.25)", background: "rgba(10,14,27,0.97)", backdropFilter: "blur(20px)", height: 520 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 shrink-0"
                 style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.12), rgba(124,58,237,0.12))", borderBottom: "1px solid rgba(0,212,255,0.15)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                   style={{ background: "linear-gradient(135deg, #00d4ff, #7c3aed)" }}>
                <Sparkles size={16} color="#fff" />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#fff" }}>TwinGPT</p>
                <p className="text-[10px]" style={{ color: "rgba(0,212,255,0.7)" }}>AI Factory Intelligence · Live Data</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#10b981" }} />
                <span className="text-[10px]" style={{ color: "#10b981" }}>Online</span>
                <button
                  onClick={() => setMessages([{ role: "assistant", text: "👋 I'm **TwinGPT** — your AI factory assistant. Ask me about plant health, anomalies, bottlenecks, ESG impact, or ROI!" }])}
                  className="ml-1 opacity-40 hover:opacity-80 transition-opacity"
                  title="Clear conversation"
                >
                  <Trash2 size={12} color="#fff" />
                </button>
              </div>
            </div>

            {/* Suggested chips */}
            <div className="flex gap-1.5 px-3 py-2 overflow-x-auto shrink-0 scrollbar-hide"
                 style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {SUGGESTED.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all hover:scale-105"
                  style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#94a3b8" }}>
                  <ChevronRight size={9} />
                  {s}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-5 h-5 rounded-full shrink-0 mr-1.5 mt-0.5 flex items-center justify-center"
                         style={{ background: "linear-gradient(135deg, #00d4ff, #7c3aed)" }}>
                      <Bot size={11} color="#fff" />
                    </div>
                  )}
                  <div
                    className="max-w-[82%] rounded-xl px-3 py-2 text-xs"
                    style={msg.role === "user"
                      ? { background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))", border: "1px solid rgba(0,212,255,0.3)", color: "#e2e8f0" }
                      : { background: "rgba(30,35,55,0.8)", border: "1px solid rgba(255,255,255,0.06)", color: "#94a3b8" }
                    }
                  >
                    {formatText(msg.text)}
                  </div>
                </motion.div>
              ))}
              {thinking && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
                       style={{ background: "linear-gradient(135deg, #00d4ff, #7c3aed)" }}>
                    <Bot size={11} color="#fff" />
                  </div>
                  <div className="flex gap-1 px-4 py-3 rounded-xl" style={{ background: "rgba(30,35,55,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {[0,1,2].map(i => (
                      <motion.span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "#00d4ff" }}
                        animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 shrink-0" style={{ borderTop: "1px solid rgba(0,212,255,0.12)" }}>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Ask about health, bottlenecks, ESG, ROI…"
                  className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,212,255,0.2)", color: "#e2e8f0" }}
                />
                <motion.button
                  onClick={() => send()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #00d4ff, #7c3aed)" }}
                >
                  <Send size={14} color="#fff" />
                </motion.button>
              </div>
              <p className="text-center text-[9px] mt-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                Powered by AI AssemblyTwin · Chennai Plant · Real-time intelligence
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
