"use client";
import { useEffect, useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { fetchJSON } from "@/lib/utils";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Feature {
  name: string;
  importance: number;
}

interface Props {
  stationId: number;
  onClose: () => void;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs"
         style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
      <p style={{ color: "var(--accent)" }}>{payload[0].payload.name}</p>
      <p style={{ color: "var(--text)" }}>Importance: {(payload[0].value * 100).toFixed(1)}%</p>
    </div>
  );
};

export default function ExplainabilityPanel({ stationId, onClose }: Props) {
  const [features, setFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    fetchJSON<{ station_id: number; features: Feature[] }>(`/api/explainability/${stationId}`)
      .then(({ features: f }) => setFeatures(f))
      .catch(() => {});
  }, [stationId]);

  const maxVal = features.length ? Math.max(...features.map((f) => f.importance)) : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{
        background: "var(--card)",
        border: "1px solid rgba(0,212,255,0.3)",
        boxShadow: "0 0 32px rgba(0,212,255,0.08)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold" style={{ color: "var(--text)" }}>
            AI Explainability — Station {stationId}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            Why did the model flag this station? (Feature importance)
          </p>
        </div>
        <button onClick={onClose} style={{ color: "var(--muted)" }}
                className="hover:opacity-70">
          <X size={16} />
        </button>
      </div>

      {/* Feature bars */}
      {features.length > 0 ? (
        <div className="flex flex-col gap-2">
          {features.map((f) => (
            <div key={f.name} className="flex items-center gap-3">
              <span className="text-xs w-28 shrink-0 font-mono" style={{ color: "var(--muted)" }}>
                {f.name}
              </span>
              <div className="flex-1 h-5 rounded-md overflow-hidden"
                   style={{ background: "var(--surface)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(f.importance / maxVal) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-md flex items-center justify-end pr-2"
                  style={{
                    background: `linear-gradient(90deg, rgba(0,212,255,0.4), rgba(0,212,255,0.9))`,
                  }}
                >
                  <span className="text-[9px] font-bold text-white">
                    {(f.importance * 100).toFixed(0)}%
                  </span>
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-center py-4" style={{ color: "var(--muted)" }}>
          Loading feature importances…
        </div>
      )}

      <p className="text-[10px] text-center" style={{ color: "var(--muted)" }}>
        Based on Random Forest feature importances from the Defect Predictor model
      </p>
    </motion.div>
  );
}
