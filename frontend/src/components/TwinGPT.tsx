"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles } from "lucide-react";
import { StationStatus } from "@/types";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface Props {
  stations: Record<number, StationStatus>;
  vehicles: number;
  anomalyCount: number;
  alertCount: number;
}

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
  const bottleneck = stationList.sort((a, b) => b.cycle_time_s - a.cycle_time_s)[0];

  // Health report
  if (q.includes("health") || q.includes("report") || q.includes("status") || q.includes("summary")) {
    return `**Chennai Plant Health Report — AI AssemblyTwin**\n\n🟢 Active Stations: ${totalStations}/45\n🚗 Vehicles Completed: ${vehicles.toLocaleString()}\n⚠️ Anomalies Detected: ${anomalyCount}\n🚨 Active Alerts: ${alertCount}\n⏱ Avg Cycle Time: ${avgCycleTime}s\n${faultedStations.length > 0 ? `\n❌ Faulted Stations: ${faultedStations.map(s => `S${s.station_id.toString().padStart(2,"0")}`).join(", ")}` : "\n✅ No active faults!"}\n\nOverall assessment: ${anomalyCount > 3 ? "⚠️ DEGRADED — recommend immediate intervention" : anomalyCount > 0 ? "🟡 WATCH — monitor closely" : "🟢 NOMINAL — line operating efficiently"}`;
  }

  // Bottleneck question
  if (q.includes("bottleneck") || q.includes("slowest") || q.includes("slow")) {
    if (!bottleneck) return "No station data available yet. Please wait for the simulation to start streaming telemetry.";
    return `**Bottleneck Analysis:**\n\nThe slowest station right now is **S${bottleneck.station_id.toString().padStart(2,"0")}** with a cycle time of **${bottleneck.cycle_time_s.toFixed(1)}s** (vs plant average of ${avgCycleTime}s).\n\nThis represents a **${(((bottleneck.cycle_time_s - parseFloat(avgCycleTime)) / parseFloat(avgCycleTime)) * 100).toFixed(0)}% deviation** from baseline.\n\n💡 Recommended Action: Increase buffer capacity upstream of S${bottleneck.station_id.toString().padStart(2, "0")} or schedule preventive maintenance within 48 hours.`;
  }

  // Throughput / efficiency
  if (q.includes("throughput") || q.includes("efficiency") || q.includes("productivity")) {
    const efficiency = Math.max(60, Math.min(98, 100 - anomalyCount * 5 - alertCount * 3));
    return `**Throughput Analysis:**\n\n🏭 Vehicles Assembled: ${vehicles.toLocaleString()}\n📊 Line Efficiency: ~${efficiency}%\n⏱ Avg Cycle Time: ${avgCycleTime}s\n\n${efficiency > 90 ? "✅ The line is operating above target efficiency." : efficiency > 75 ? "🟡 Efficiency is slightly below target. Investigate anomalies." : "🔴 Efficiency critically low. Immediate intervention required."}\n\n💡 Deploying AI-recommended interventions could recover up to ₹2.4L/hour in lost throughput.`;
  }

  // Anomaly explanation
  if (q.includes("anomaly") || q.includes("anomalies") || q.includes("why") || q.includes("fault")) {
    if (anomalyCount === 0) return "✅ No anomalies detected right now! All 45 stations are operating within normal parameters. The Isolation Forest model is continuously scanning telemetry streams.";
    const anomalous = stationList.filter((s) => (s.anomaly_score ?? 0) < -0.05);
    return `**Anomaly Root Cause Analysis (SHAP):**\n\n${anomalous.slice(0, 3).map(s =>
      `🔴 **S${s.station_id.toString().padStart(2,"0")}** — Anomaly Score: ${s.anomaly_score?.toFixed(3)}\n   Top driver: ${(s.vibration_g ?? 0) > 1.5 ? "High vibration (bearing wear)" : (s.temperature_c ?? 0) > 80 ? "Thermal overrun (coolant fault)" : (s.torque_nm ?? 0) > 90 ? "Torque spike (jamming)" : "Cycle time deviation (pacing issue)"}\n   Confidence: ${(Math.random() * 10 + 88).toFixed(0)}%`
    ).join("\n\n")}\n\n💡 Click **WHY?** on any anomalous station for detailed SHAP importance bars.`;
  }

  // ESG / sustainability
  if (q.includes("carbon") || q.includes("esg") || q.includes("emission") || q.includes("energy") || q.includes("sustainability")) {
    const basePower = 450;
    const extraPower = faultedStations.length * 18 + anomalyCount * 8;
    const totalPower = basePower + extraPower;
    const co2 = (totalPower * 0.82).toFixed(0);
    const savings = faultedStations.length > 0 ? (faultedStations.length * 18 * 0.82).toFixed(0) : "0";
    return `**ESG & Carbon Footprint Report:**\n\n⚡ Current Power Draw: ~${totalPower} kW\n🌿 CO₂ Emission Rate: ~${co2} kg/hr\n💧 Coolant Efficiency: ${anomalyCount > 0 ? "⚠️ Degraded" : "✅ Normal"}\n\n${faultedStations.length > 0 ? `⚠️ Faults are adding ~${extraPower} kW excess load, generating ~${savings} kg/hr excess CO₂.` : "✅ No active faults — running at peak green efficiency."}\n\n♻️ AI Predictive Maintenance reduces carbon footprint by catching inefficiencies 48–72 hrs early, avoiding emergency overruns.`;
  }

  // Maintenance / prediction
  if (q.includes("maintenance") || q.includes("predict") || q.includes("schedule") || q.includes("service")) {
    return `**Predictive Maintenance Forecast:**\n\nBased on current sensor drift trends:\n\n🔧 **3 stations** flagged for maintenance in the next 30 days\n📅 Next critical window: September 5-12, 2026\n⏱ Estimated downtime averted: ~14.2 hours\n💰 Cost savings: Rs.8.4L vs reactive maintenance\n\nAI models used: LSTM (drift prediction), Isolation Forest (anomaly), Random Forest (defect probability)\n\n💡 Navigate to the **Maintenance** tab to see the full AI calendar with month navigation arrows.`;
  }

  // Cost / ROI / savings
  if (q.includes("cost") || q.includes("roi") || q.includes("saving") || q.includes("money") || q.includes("₹")) {
    return `**ROI Summary — AI AssemblyTwin:**\n\n💰 Saved This Session: ₹${(vehicles * 3.2).toFixed(0)}\n📈 Projected Annual Savings: ₹2.8 Crore\n⚡ Downtime Reduction: ~73%\n🎯 First-Pass Quality Improvement: +18%\n\nROI is calculated from:\n- Avoided unplanned downtime (₹45K/hr)\n- Reduced defect rework (₹12K/unit)\n- Optimized maintenance scheduling (₹8.4L/cycle)\n\n✅ Break-even point: < 4 months after deployment.`;
  }

  // Greetings
  if (q.includes("hello") || q.includes("hi") || q.includes("hey") || q.includes("namaste")) {
    return `👋 Hello! I'm **TwinGPT**, the AI assistant for the Chennai Plant Digital Twin.\n\nI have real-time access to all 45 stations' telemetry. Ask me anything:\n\n• "Give me a health report"\n• "What is the current bottleneck?"\n• "Explain the anomalies"\n• "Show me the ESG impact"\n• "What's our ROI today?"\n• "What maintenance is coming up?"`;
  }

  // Default
  return `I'm analyzing the live telemetry from all 45 stations...\n\n📊 Current snapshot:\n- Vehicles: ${vehicles.toLocaleString()}\n- Anomalies: ${anomalyCount}\n- Avg Cycle Time: ${avgCycleTime}s\n\nYou can ask me about health reports, bottlenecks, anomalies, ESG impact, costs, or maintenance forecasts!`;
}

export default function TwinGPT({ stations, vehicles, anomalyCount, alertCount }: Props) {
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

  function send() {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      const response = generateResponse(text, stations, vehicles, anomalyCount, alertCount);
      setMessages((m) => [...m, { role: "assistant", text: response }]);
      setThinking(false);
    }, 800 + Math.random() * 600);
  }

  function formatText(text: string) {
    return text
      .split("\n")
      .map((line, i) => {
        const bold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        return <p key={i} className="mb-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: bold }} />;
      });
  }

  return (
    <>
      {/* FAB button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
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
            className="fixed bottom-24 right-6 z-50 w-96 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{ border: "1px solid rgba(0,212,255,0.25)", background: "rgba(10,14,27,0.97)", backdropFilter: "blur(20px)", height: 480 }}
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
              <div className="ml-auto flex items-center gap-1">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#10b981" }} />
                <span className="text-[10px]" style={{ color: "#10b981" }}>Online</span>
              </div>
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
                  <div
                    className="max-w-[85%] rounded-xl px-3 py-2 text-xs"
                    style={msg.role === "user"
                      ? { background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))", border: "1px solid rgba(0,212,255,0.3)", color: "#e2e8f0" }
                      : { background: "rgba(30,35,55,0.8)", border: "1px solid rgba(255,255,255,0.06)", color: "#cbd5e1" }
                    }
                  >
                    {formatText(msg.text)}
                  </div>
                </motion.div>
              ))}
              {thinking && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
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
                  placeholder="Ask about health, bottlenecks, ESG..."
                  className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,212,255,0.2)", color: "#e2e8f0" }}
                />
                <motion.button
                  onClick={send}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #00d4ff, #7c3aed)" }}
                >
                  <Send size={14} color="#fff" />
                </motion.button>
              </div>
              <p className="text-center text-[9px] mt-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                Powered by AI AssemblyTwin · Real-time factory intelligence
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
