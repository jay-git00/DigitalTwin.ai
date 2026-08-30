"use client";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { fetchJSON } from "@/lib/utils";

interface HealthData {
  health_score: number;
  fault_stations: number[];
  stations_online: number;
  vehicles_today: number;
}

function getColor(score: number) {
  if (score >= 80) return "#10b981";
  if (score >= 55) return "#f59e0b";
  return "#ef4444";
}

export default function HealthGauge() {
  const [data, setData] = useState<HealthData | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    const fetchHealth = () => {
      fetchJSON<HealthData>("/api/system/health")
        .then(setData)
        .catch(() => {});
    };
    fetchHealth();
    intervalRef.current = setInterval(fetchHealth, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const score  = data?.health_score ?? 100;
  const color  = getColor(score);
  const label  = score >= 80 ? "HEALTHY" : score >= 55 ? "DEGRADED" : "CRITICAL";

  // SVG arc gauge
  const r = 40;
  const cx = 56, cy = 56;
  const startAngle = -210;
  const totalAngle = 240; // degrees sweep
  const sweepAngle = (score / 100) * totalAngle;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arcPath = (a: number) => {
    const x = cx + r * Math.cos(toRad(a));
    const y = cy + r * Math.sin(toRad(a));
    return `${x},${y}`;
  };
  const largeArc = sweepAngle > 180 ? 1 : 0;
  const bgEnd    = arcPath(startAngle + totalAngle);
  const bgStart  = arcPath(startAngle);
  const fgEnd    = arcPath(startAngle + sweepAngle);

  return (
    <div
      className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl"
      style={{ background: "var(--card)", border: "1px solid var(--border)", minWidth: 120 }}
    >
      <svg width="112" height="72" viewBox="0 0 112 80">
        {/* Background track */}
        <path
          d={`M ${bgStart} A ${r} ${r} 0 1 1 ${bgEnd}`}
          fill="none"
          stroke="var(--border)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Foreground progress */}
        <motion.path
          d={`M ${bgStart} A ${r} ${r} 0 ${largeArc} 1 ${fgEnd}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: score / 100 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        {/* Score text */}
        <text x={cx} y={cy + 6} textAnchor="middle"
              fill={color} fontSize="15" fontWeight="bold" fontFamily="Inter">
          {score.toFixed(0)}%
        </text>
      </svg>
      <span className="text-[9px] font-bold tracking-widest" style={{ color }}>
        {label}
      </span>
      <span className="text-[9px]" style={{ color: "var(--muted)" }}>
        Factory Health
      </span>
    </div>
  );
}
