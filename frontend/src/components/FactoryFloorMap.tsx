"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StationStatus } from "@/types";
import { stationColor, stationLabel, fetchJSON } from "@/lib/utils";
import StationDrawer from "./StationDrawer";
import Sparkline from "./Sparkline";
import ExplainabilityPanel from "./ExplainabilityPanel";

const ZONE_LAYOUT = [
  { zone: "body",  label: "ZONE A — Body Construction", ids: Array.from({ length: 15 }, (_, i) => i + 1)  },
  { zone: "paint", label: "ZONE B — Paint Shop",        ids: Array.from({ length: 13 }, (_, i) => i + 16) },
  { zone: "final", label: "ZONE C — Final Assembly",    ids: Array.from({ length: 17 }, (_, i) => i + 29) },
];

const ZONE_COLORS: Record<string, string> = {
  body:  "rgba(0,212,255,0.06)",
  paint: "rgba(124,58,237,0.06)",
  final: "rgba(16,185,129,0.06)",
};

// Animated vehicle dot that traverses station positions
function VehicleDot({ stationCount }: { stationCount: number }) {
  const [pos, setPos] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    ref.current = setInterval(() => {
      setPos((p) => (p + 1) % (stationCount + 20));
    }, 400);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [stationCount]);

  if (pos >= stationCount) return null;
  const pct = (pos / (stationCount - 1)) * 100;

  return (
    <motion.div
      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
      style={{
        left:       `${pct}%`,
        background: "#00d4ff",
        boxShadow:  "0 0 6px 2px rgba(0,212,255,0.6)",
        zIndex:     10,
      }}
      layoutId={`vehicle-${pos}`}
      transition={{ type: "tween", duration: 0.35 }}
    />
  );
}

interface Props {
  stations:        Record<number, StationStatus>;
  cycleHistories?: Record<number, number[]>;   // station_id → last N cycle times
}

export default function FactoryFloorMap({ stations, cycleHistories = {} }: Props) {
  const [selected,   setSelected]   = useState<number | null>(null);
  const [explainSid, setExplainSid] = useState<number | null>(null);

  const handleClick = useCallback((id: number) => {
    setSelected((prev) => (prev === id ? null : id));
    setExplainSid(null);
  }, []);

  const handleExplain = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setExplainSid((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="flex flex-col gap-4 w-full">
      {ZONE_LAYOUT.map(({ zone, label, ids }) => (
        <div
          key={zone}
          className="rounded-xl p-4"
          style={{
            background: ZONE_COLORS[zone],
            border: "1px solid var(--border)",
          }}
        >
          {/* Zone header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1" style={{ background: "var(--border)" }} />
            <span className="text-xs font-semibold tracking-widest" style={{ color: "var(--muted)" }}>
              {label}
            </span>
            <div className="h-px flex-1" style={{ background: "var(--border)" }} />
          </div>

          {/* Vehicle flow track */}
          <div className="relative h-1 mx-1 mb-3 rounded-full" style={{ background: "var(--border)" }}>
            <VehicleDot stationCount={ids.length} />
          </div>

          {/* Station grid */}
          <div className="flex flex-wrap gap-2 justify-center">
            {ids.map((sid) => {
              const st        = stations[sid];
              const color     = st ? stationColor(st) : "#334155";
              const lbl       = st ? stationLabel(st)  : "—";
              const isRed     = color === "#ef4444";
              const isAmber   = color === "#f59e0b";
              const isSelected = selected === sid;
              const history   = cycleHistories[sid] ?? [];

              return (
                <motion.div
                  key={sid}
                  onClick={() => handleClick(sid)}
                  whileHover={{ scale: 1.07, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className={`relative flex flex-col items-center justify-center rounded-xl cursor-pointer
                    ${isRed   ? "glow-pulse"  : ""}
                    ${isAmber ? "glow-amber"  : ""}
                  `}
                  style={{
                    width:      80,
                    height:     82,
                    background: isSelected ? `${color}22` : "var(--card)",
                    border:     `2px solid ${isSelected ? color : isRed ? `${color}88` : "var(--border)"}`,
                  }}
                >
                  {/* Status dot */}
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: color }} />

                  {/* Sensor-poor dot */}
                  {st?.is_sensor_poor && (
                    <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full"
                         style={{ background: "var(--muted)", opacity: 0.6 }} />
                  )}

                  {/* Station ID */}
                  <span className="text-[9px] font-bold" style={{ color: "var(--muted)" }}>
                    S{sid.toString().padStart(2, "0")}
                  </span>

                  {/* Cycle time */}
                  <span className="text-sm font-bold mt-0.5" style={{ color }}>
                    {st ? `${st.cycle_time_s.toFixed(0)}s` : "—"}
                  </span>

                  {/* Sparkline */}
                  <div className="mt-1">
                    <Sparkline data={history} color={color} width={52} height={16} />
                  </div>

                  {/* Status label */}
                  <span className="text-[8px] font-semibold tracking-wider mt-0.5" style={{ color }}>
                    {lbl}
                  </span>

                  {/* Explain button — only on anomaly */}
                  {(isRed || isAmber) && (
                    <button
                      onClick={(e) => handleExplain(e, sid)}
                      className="absolute -bottom-2 text-[8px] px-1.5 py-0.5 rounded"
                      style={{
                        background: "rgba(0,212,255,0.15)",
                        color:       "var(--accent)",
                        border:      "1px solid rgba(0,212,255,0.3)",
                      }}
                    >
                      WHY?
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Explainability panel */}
      <AnimatePresence>
        {explainSid !== null && (
          <ExplainabilityPanel
            key={explainSid}
            stationId={explainSid}
            onClose={() => setExplainSid(null)}
          />
        )}
      </AnimatePresence>

      {/* Station detail drawer */}
      <AnimatePresence>
        {selected !== null && stations[selected] && (
          <StationDrawer
            station={stations[selected]}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
