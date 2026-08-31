"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Leaf, Zap, Wind, TrendingDown } from "lucide-react";
import { StationStatus } from "@/types";

interface Props {
  stations: Record<number, StationStatus>;
}

export default function ESGWidget({ stations }: Props) {
  const metrics = useMemo(() => {
    const list = Object.values(stations);
    if (list.length === 0) return null;

    // Base power = 450 kW for 45 stations at idle
    // Each station adds power based on vibration and temperature
    const totalExcess = list.reduce((acc, s) => {
      const vibrationLoad = Math.max(0, s.vibration_g - 0.5) * 12;
      const thermalLoad   = Math.max(0, s.temperature_c - 40) * 0.8;
      const faultLoad     = s.fault_active ? 22 : 0;
      return acc + vibrationLoad + thermalLoad + faultLoad;
    }, 0);

    const basePower   = 420; // kW baseline
    const totalPower  = basePower + totalExcess;
    const co2PerHr    = totalPower * 0.82;           // India grid: 0.82 kg CO2/kWh
    const co2Saved    = Math.max(0, totalExcess * 0.82); // vs unmonitored baseline
    const greenScore  = Math.max(30, Math.min(100, 100 - (totalExcess / basePower) * 80));
    const efficiency  = Math.max(55, Math.min(100, 100 - (totalExcess / basePower) * 60));

    return { totalPower: totalPower.toFixed(0), co2PerHr: co2PerHr.toFixed(0), co2Saved: co2Saved.toFixed(0), greenScore: greenScore.toFixed(0), efficiency: efficiency.toFixed(0) };
  }, [stations]);

  if (!metrics) return null;

  const score = parseFloat(metrics.greenScore);
  const scoreColor = score > 80 ? "#10b981" : score > 60 ? "#f59e0b" : "#ef4444";
  const scoreLabel = score > 80 ? "GREEN" : score > 60 ? "WATCH" : "CRITICAL";

  const bars = [
    { label: "Power Draw",     value: metrics.totalPower, unit: "kW",    icon: Zap,          color: "#f59e0b" },
    { label: "CO₂ Rate",       value: metrics.co2PerHr,   unit: "kg/hr", icon: Wind,         color: "#ef4444" },
    { label: "CO₂ Averted",   value: metrics.co2Saved,   unit: "kg/hr", icon: TrendingDown, color: "#10b981" },
    { label: "Line Efficiency",value: metrics.efficiency, unit: "%",     icon: Leaf,         color: "#00d4ff" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Leaf size={14} color="#10b981" />
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>Live ESG Monitor</span>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ background: scoreColor }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${scoreColor}20`, color: scoreColor }}>
            {scoreLabel}
          </span>
        </div>
      </div>

      {/* Green Score Arc */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-24 h-24">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
            <motion.circle
              cx="50" cy="50" r="40" fill="none"
              stroke={scoreColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - score / 100) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ filter: `drop-shadow(0 0 6px ${scoreColor})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black" style={{ color: scoreColor }}>{metrics.greenScore}</span>
            <span className="text-[9px] font-semibold" style={{ color: "var(--muted)" }}>GREEN SCORE</span>
          </div>
        </div>
      </div>

      {/* Metric bars */}
      <div className="grid grid-cols-2 gap-2">
        {bars.map(({ label, value, unit, icon: Icon, color }) => (
          <div key={label} className="flex flex-col gap-1 p-2 rounded-lg"
               style={{ background: `${color}0d`, border: `1px solid ${color}22` }}>
            <div className="flex items-center gap-1">
              <Icon size={10} color={color} />
              <span className="text-[9px] font-medium" style={{ color: "var(--muted)" }}>{label}</span>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-base font-black" style={{ color }}>{value}</span>
              <span className="text-[9px]" style={{ color: "var(--muted)" }}>{unit}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-[9px] mt-3" style={{ color: "rgba(255,255,255,0.2)" }}>
        ♻️ AI Maintenance reduces CO₂ by catching faults 48–72h early
      </p>
    </motion.div>
  );
}
