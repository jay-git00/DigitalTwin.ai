"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, X } from "lucide-react";
import { StationStatus } from "@/types";

// Generate a unique, deterministic dependency topology for each station
function getDepsForStation(sid: number): number[] {
  if (sid >= 45) return [];
  // Use a pseudo-random seed based on the station ID to create varied graph shapes
  const seed = (sid * 37) % 100;
  
  // Create different branching patterns so each station's graph looks visually distinct
  if (seed < 15) return [sid + 1, sid + 2, sid + 3, sid + 4].filter(x => x <= 45); // Massive cascade
  if (seed < 45) return [sid + 1, sid + 2].filter(x => x <= 45);                   // Standard fork
  if (seed < 70) return [sid + 2, sid + 3].filter(x => x <= 45);                   // Delayed fork
  if (seed < 85) return [sid + 1, sid + 4].filter(x => x <= 45);                   // Wide fork
  return [sid + 1].filter(x => x <= 45);                                           // Linear
}

function getColor(st: StationStatus | undefined): string {
  if (!st) return "#334155";
  if (st.fault_active || (st.anomaly_score ?? 0) < -0.05) return "#ef4444";
  if ((st.anomaly_score ?? 0) < 0.05) return "#f59e0b";
  return "#10b981";
}

function getAllDownstream(sid: number, visited = new Set<number>(), currentDepth = 0): Set<number> {
  if (visited.has(sid) || currentDepth > 5) return visited;
  visited.add(sid);
  
  // Probabilistic cascade: risk diminishes at deeper levels to create contrast
  getDepsForStation(sid).forEach(d => {
    // 85% chance to propagate to depth 1, 70% to depth 2, etc.
    const propChance = 100 - (currentDepth * 15);
    const seed = (sid * 11 + d * 17) % 100;
    if (seed < propChance) {
      getAllDownstream(d, visited, currentDepth + 1);
    }
  });
  return visited;
}

interface Props {
  stations: Record<number, StationStatus>;
  triggerId: number;
  onClose: () => void;
}

export default function CascadeGraph({ stations, triggerId, onClose }: Props) {
  const affected = useMemo(() => getAllDownstream(triggerId), [triggerId]);

  // Build node positions in a radial tree layout
  const nodes = useMemo(() => {
    const result: { id: number; x: number; y: number; depth: number }[] = [];
    const levels: number[][] = [];
    const seen = new Set<number>();

    function buildLevels(ids: number[], depth: number) {
      if (depth > 5 || ids.length === 0) return;
      const newIds = ids.filter(id => !seen.has(id));
      if (newIds.length === 0) return;
      newIds.forEach(id => seen.add(id));
      
      levels[depth] = newIds;
      const next = [...new Set(newIds.flatMap(id => getDepsForStation(id)))];
      buildLevels(next, depth + 1);
    }

    buildLevels([triggerId], 0);
    const W = 520, H = 360;
    levels.forEach((ids, depth) => {
      ids.forEach((id, i) => {
        result.push({
          id,
          x: (depth / Math.max(levels.length - 1, 1)) * (W - 80) + 40,
          y: ((i + 1) / (ids.length + 1)) * H,
          depth,
        });
      });
    });
    return result;
  }, [triggerId]);

  const edges = useMemo(() => {
    const result: { from: number; to: number }[] = [];
    nodes.forEach(({ id }) => {
      getDepsForStation(id).forEach(to => {
        if (nodes.find(n => n.id === to)) result.push({ from: id, to });
      });
    });
    return result;
  }, [nodes]);

  const getNode = (id: number) => nodes.find(n => n.id === id);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        className="rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "rgba(10,14,27,0.98)", border: "1px solid rgba(0,212,255,0.25)", width: 620, maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
             style={{ borderBottom: "1px solid rgba(0,212,255,0.15)", background: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(245,158,11,0.1))" }}>
          <div className="flex items-center gap-2">
            <GitBranch size={16} color="#ef4444" />
            <span className="text-sm font-bold" style={{ color: "#fff" }}>
              Cascade Impact — Station S{triggerId.toString().padStart(2,"0")}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
              {affected.size - 1} stations at risk
            </span>
          </div>
          <button onClick={onClose}><X size={16} color="rgba(255,255,255,0.5)" /></button>
        </div>

        {/* Graph */}
        <div className="p-4">
          <svg width="100%" viewBox="0 0 520 360" style={{ overflow: "visible" }}>
            {/* Edges */}
            {edges.map(({ from, to }) => {
              const f = getNode(from); const t = getNode(to);
              if (!f || !t) return null;
              const isRed = affected.has(to);
              return (
                <motion.line key={`${from}-${to}`}
                  x1={f.x} y1={f.y} x2={t.x} y2={t.y}
                  stroke={isRed ? "#ef444488" : "#33415566"}
                  strokeWidth={isRed ? 2 : 1}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                />
              );
            })}
            {/* Nodes */}
            {nodes.map(({ id, x, y, depth }) => {
              const st = stations[id];
              // If it's in 'affected' (and not trigger), it's Amber. Otherwise, use its real live color.
              const isAffected = affected.has(id);
              const color = getNode(id) ? (isAffected && id !== triggerId ? "#f59e0b" : getColor(st)) : "#334155";
              const isSource = id === triggerId;
              
              return (
                <g key={id}>
                  <motion.circle
                    cx={x} cy={y} r={isSource ? 20 : 14}
                    fill={isSource ? "#ef4444" : `${color}22`}
                    stroke={isSource ? "#ef4444" : color}
                    strokeWidth={isSource ? 3 : 2}
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: depth * 0.1 }}
                    style={{ filter: isSource ? "drop-shadow(0 0 8px #ef4444)" : undefined }}
                  />
                  <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                        fontSize={isSource ? 9 : 8} fontWeight="bold"
                        fill={isSource ? "#fff" : color}>
                    S{id.toString().padStart(2,"0")}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-2">
            {[
              { color: "#ef4444", label: "Failure Source" },
              { color: "#f59e0b", label: "At Risk (Cascade)" },
              { color: "#10b981", label: "Normal" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>
            Click anywhere outside to close · AI computed dependency graph
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
