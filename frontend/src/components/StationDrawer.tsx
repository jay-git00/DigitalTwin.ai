"use client";
import { motion } from "framer-motion";
import { X, Wifi, WifiOff, GitBranch, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { StationStatus } from "@/types";
import { stationColor } from "@/lib/utils";

// Helper component for live countdown timer
function CountdownTimer({ drift }: { drift: number }) {
  const [secondsLeft, setSecondsLeft] = useState(
    Math.floor((0.05 - drift) * 120000) + 7200
  );

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const hrs = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;
  return (
    <div className="flex items-center justify-between p-3 rounded-xl mt-2"
         style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>
      <div className="flex items-center gap-2">
        <Clock size={16} color="#f59e0b" className="animate-pulse" />
        <span className="text-xs font-bold" style={{ color: "#f59e0b" }}>Predictive Failure</span>
      </div>
      <span className="text-sm font-bold font-mono tracking-wider" style={{ color: "#f59e0b" }}>
        {hrs}h {m.toString().padStart(2,"0")}m {s.toString().padStart(2,"0")}s
      </span>
    </div>
  );
}

interface Props {
  station: StationStatus;
  onClose: () => void;
  onOpenCascade?: () => void;
}

function MetricRow({
  label, value, imputed, unit, uncertainty,
}: {
  label: string;
  value: number | null | undefined;
  imputed?: number | null;
  unit: string;
  uncertainty?: number | null;
}) {
  const display = value ?? imputed;
  const isImputed = value == null && imputed != null;

  return (
    <div className="flex justify-between items-center py-2"
         style={{ borderBottom: "1px solid var(--border)" }}>
      <span className="text-xs" style={{ color: "var(--muted)" }}>{label}</span>
      <div className="text-right flex flex-col items-end gap-0.5">
        {display != null ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {display.toFixed(2)} {unit}
              </span>
              {isImputed && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: "rgba(245,158,11,0.15)",
                    color: "#f59e0b",
                    border: "1px solid rgba(245,158,11,0.3)",
                  }}
                >
                  GP Est.
                </span>
              )}
            </div>
            {isImputed && uncertainty != null && uncertainty > 0 && (
              <div className="text-[10px]" style={{ color: "var(--muted)" }}>
                ± {uncertainty.toFixed(2)} {unit} confidence
              </div>
            )}
          </>
        ) : (
          <span className="text-xs italic" style={{ color: "var(--muted)" }}>awaiting data</span>
        )}
      </div>
    </div>
  );
}

export default function StationDrawer({ station, onClose, onOpenCascade }: Props) {
  const color = stationColor(station);

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0,      opacity: 1 }}
      exit={{    x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed right-0 top-16 bottom-0 w-80 z-40 overflow-y-auto"
      style={{
        background: "var(--surface)",
        borderLeft: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4"
           style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ background: color }} />
          <div>
            <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>
              Station {station.station_id.toString().padStart(2, "0")}
            </h3>
            <p className="text-xs capitalize" style={{ color: "var(--muted)" }}>
              {station.zone} zone
            </p>
          </div>
        </div>
        <button onClick={onClose} style={{ color: "var(--muted)" }}
                className="hover:opacity-70 transition-opacity">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Sensor coverage badge */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{
            background: station.is_sensor_poor
              ? "rgba(245,158,11,0.1)"
              : "rgba(16,185,129,0.1)",
            border: `1px solid ${station.is_sensor_poor ? "var(--warning)" : "var(--success)"}`,
            color: station.is_sensor_poor ? "var(--warning)" : "var(--success)",
          }}
        >
          {station.is_sensor_poor ? <WifiOff size={12} /> : <Wifi size={12} />}
          {station.is_sensor_poor
            ? "Legacy station — GP imputation active"
            : "Full telemetry coverage"}
        </div>

        {/* Predictive Countdown (Only if Amber/Watch state) */}
        {color === "#f59e0b" && (
          <CountdownTimer drift={station.anomaly_score ?? 0} />
        )}

        {/* Anomaly score */}
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>Anomaly Score</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full" style={{ background: "var(--border)" }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.max(0, (-(station.anomaly_score ?? 0)) * 200))}%`,
                  background: color,
                }}
              />
            </div>
            <span className="text-xs font-mono" style={{ color }}>
              {(station.anomaly_score ?? 0).toFixed(3)}
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div>
          <p className="text-xs mb-2 font-semibold" style={{ color: "var(--muted)" }}>
            TELEMETRY
          </p>
          <MetricRow label="Cycle Time"   value={station.cycle_time_s}   unit="s" />
          <MetricRow
            label="Torque"
            value={station.torque_nm}
            imputed={station.torque_nm_imputed}
            unit="Nm"
            uncertainty={station.is_sensor_poor ? station.imputation_uncertainty : null}
          />
          <MetricRow
            label="Vibration"
            value={station.vibration_g}
            imputed={station.vibration_g_imputed}
            unit="g"
            uncertainty={station.is_sensor_poor ? station.vibration_uncertainty : null}
          />
          <MetricRow
            label="Temperature"
            value={station.temperature_c}
            imputed={station.temperature_c_imputed}
            unit="°C"
            uncertainty={station.is_sensor_poor ? station.temperature_uncertainty : null}
          />
        </div>

        {/* Fault status */}
        {station.fault_active && (
          <div
            className="px-3 py-2 rounded-lg text-xs font-semibold glow-pulse"
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid var(--danger)",
              color: "var(--danger)",
            }}
          >
            ⚠ ACTIVE FAULT DETECTED
          </div>
        )}

        {/* Network Cascade Button */}
        {onOpenCascade && (
          <button
            onClick={onOpenCascade}
            className="mt-4 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold"
            style={{
              background: "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.15))",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#f59e0b",
            }}
          >
            <GitBranch size={14} /> VIEW NETWORK CASCADE IMPACT
          </button>
        )}
      </div>
    </motion.div>
  );
}
