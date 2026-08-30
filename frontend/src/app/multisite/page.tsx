"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe, Wifi, AlertTriangle, CheckCircle, TrendingUp, Factory } from "lucide-react";
import { fetchJSON, formatINR } from "@/lib/utils";

interface Plant {
  id: string;
  name: string;
  location: string;
  stations: number;
  health_score: number;
  vehicles_today: number;
  active_alerts: number;
  status: "live" | "monitoring" | "optimal";
  throughput_pct: number;
  model_version: string;
}

interface MultisiteData {
  plants: Plant[];
  total_savings_inr: number;
  network_health: number;
  total_vehicles_today: number;
}

const STATUS_CONFIG = {
  live:       { label: "LIVE",      color: "#00d4ff", pulse: true  },
  monitoring: { label: "WATCH",     color: "#f59e0b", pulse: false },
  optimal:    { label: "OPTIMAL",   color: "#10b981", pulse: false },
};

function HealthArc({ score, size = 80 }: { score: number; size?: number }) {
  const color = score >= 80 ? "#10b981" : score >= 55 ? "#f59e0b" : "#ef4444";
  const r = size * 0.38;
  const cx = size / 2, cy = size / 2;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const totalAngle = 240, startAngle = -210;
  const sweepAngle = (score / 100) * totalAngle;
  const arcPoint = (a: number) => ({
    x: cx + r * Math.cos(toRad(a)),
    y: cy + r * Math.sin(toRad(a)),
  });
  const s = arcPoint(startAngle);
  const e = arcPoint(startAngle + sweepAngle);
  const bg = arcPoint(startAngle + totalAngle);
  const largeArc = sweepAngle > 180 ? 1 : 0;

  return (
    <svg width={size} height={size * 0.75}>
      <path d={`M ${s.x},${s.y} A ${r} ${r} 0 1 1 ${bg.x},${bg.y}`}
            fill="none" stroke="var(--border)" strokeWidth="6" strokeLinecap="round" />
      <path d={`M ${s.x},${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x},${e.y}`}
            fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" />
      <text x={cx} y={cy + 4} textAnchor="middle"
            fill={color} fontSize="13" fontWeight="bold" fontFamily="Inter">
        {score.toFixed(0)}%
      </text>
    </svg>
  );
}

export default function MultisitePage() {
  const [data,    setData]    = useState<MultisiteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = () => {
      fetchJSON<MultisiteData>("/api/multisite")
        .then(setData).catch(() => {});
    };
    fetch();
    setLoading(false);
    const id = setInterval(fetch, 5000);
    return () => clearInterval(id);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-sm"
           style={{ color: "var(--muted)" }}>
        Loading multi-site data…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            Multi-Site Overview
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Enterprise network of 3 plants — one unified AI twin backbone
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs"
             style={{ color: "var(--accent)" }}>
          <Globe size={14} />
          Network Health: {data.network_health}%
        </div>
      </div>

      {/* Network KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Plants Online",     value: data.plants.length,                    color: "var(--accent)" },
          { label: "Total Vehicles Today", value: data.total_vehicles_today.toLocaleString(), color: "var(--success)" },
          { label: "Network Health",    value: `${data.network_health}%`,             color: data.network_health >= 80 ? "var(--success)" : "var(--warning)" },
          { label: "Network Savings",   value: formatINR(data.total_savings_inr),     color: "var(--success)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 text-center"
               style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Plant cards */}
      <div className="grid grid-cols-3 gap-6">
        {data.plants.map((plant, idx) => {
          const sc  = STATUS_CONFIG[plant.status];
          const hc  = plant.health_score >= 80 ? "#10b981" : plant.health_score >= 55 ? "#f59e0b" : "#ef4444";

          return (
            <motion.div
              key={plant.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1,  y: 0 }}
              transition={{ delay: idx * 0.12 }}
              className="rounded-2xl p-6 flex flex-col gap-5"
              style={{
                background: "var(--card)",
                border:     `1px solid ${plant.status === "live" ? "rgba(0,212,255,0.3)" : "var(--border)"}`,
                boxShadow:  plant.status === "live" ? "0 0 24px rgba(0,212,255,0.06)" : "none",
              }}
            >
              {/* Card header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Factory size={16} color={sc.color} />
                    <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>
                      {plant.name}
                    </h3>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{plant.location}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {sc.pulse && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                            style={{ background: sc.color }} />
                      <span className="relative inline-flex rounded-full h-2 w-2"
                            style={{ background: sc.color }} />
                    </span>
                  )}
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${sc.color}18`, color: sc.color, border: `1px solid ${sc.color}44` }}>
                    {sc.label}
                  </span>
                </div>
              </div>

              {/* Health gauge */}
              <div className="flex items-center gap-6">
                <HealthArc score={plant.health_score} size={80} />
                <div className="flex flex-col gap-2 flex-1">
                  <div>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Vehicles Today</p>
                    <p className="text-lg font-bold" style={{ color: "var(--text)" }}>
                      {plant.vehicles_today.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>Throughput</p>
                    <p className="text-sm font-bold" style={{ color: "var(--success)" }}>
                      {plant.throughput_pct}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Throughput bar */}
              <div>
                <div className="h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                  <motion.div
                    className="h-1.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${plant.throughput_pct}%` }}
                    transition={{ delay: idx * 0.12 + 0.3, duration: 0.8 }}
                    style={{ background: hc }}
                  />
                </div>
              </div>

              {/* Stats row */}
              <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
                <span>{plant.stations} stations</span>
                <span className="flex items-center gap-1">
                  {plant.active_alerts > 0
                    ? <><AlertTriangle size={10} color="var(--danger)" /> {plant.active_alerts} alert{plant.active_alerts > 1 ? "s" : ""}</>
                    : <><CheckCircle  size={10} color="var(--success)" /> No alerts</>
                  }
                </span>
                <span style={{ color: "var(--accent)" }}>Model {plant.model_version}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Enterprise value banner */}
      <div className="rounded-xl px-5 py-4 text-sm"
           style={{
             background: "linear-gradient(135deg, rgba(0,212,255,0.06), rgba(124,58,237,0.06))",
             border: "1px solid rgba(0,212,255,0.2)",
           }}>
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp size={16} color="var(--accent)" />
          <span className="font-bold text-sm" style={{ color: "var(--accent)" }}>
            Enterprise Scalability
          </span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
          A single AI AssemblyTwin deployment scales across all 3 plants using&nbsp;
          <strong style={{ color: "var(--text)" }}>Transfer Learning</strong>. Models trained on
          Chennai data achieved 91% accuracy when fine-tuned on Pune's line (different vintage
          equipment) with only 2 weeks of additional data. Each new plant onboards in&nbsp;
          <strong style={{ color: "var(--text)" }}>4-6 weeks</strong> vs 6+ months for traditional SCADA.
        </p>
      </div>
    </div>
  );
}
