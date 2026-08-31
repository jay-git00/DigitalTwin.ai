"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { getApiBase } from "@/lib/utils";
import { Zap, Bug, RotateCcw, ChevronDown, Flame } from "lucide-react";

export default function DemoControls() {
  const [open,       setOpen]      = useState(false);
  const [injecting,  setInjecting] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  async function inject(type: "bottleneck" | "defect" | "chaos") {
    setInjecting(true);
    setLastAction(null);
    try {
      const endpoint = type === "chaos" ? "/api/demo/chaos" : "/api/demo/inject";
      const stationMap = { bottleneck: 12, defect: 7 };
      const body = type === "chaos"
        ? {}
        : { station_id: stationMap[type as "bottleneck" | "defect"], fault_type: type };
      await fetch(`${getApiBase()}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setLastAction(
        type === "chaos"       ? "🔥 Chaos injected — 8 stations faulted!"
        : type === "bottleneck" ? "⚡ Bottleneck injected at Station 12"
                                : "🐛 Defect injected at Station 7"
      );
    } finally {
      setInjecting(false);
    }
  }

  async function reset() {
    setInjecting(true);
    setLastAction(null);
    try {
      await fetch(`${getApiBase()}/api/demo/reset`, { method: "POST" });
      setLastAction("✅ Simulation fully reset");
    } finally {
      setInjecting(false);
    }
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        minWidth: 272,
      }}
    >
      {/* Toggle header */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-white/[0.03]"
        style={{ color: "var(--accent)" }}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
          <span className="text-xs font-bold tracking-widest">DEMO CONTROLS</span>
        </div>
        <ChevronDown
          size={14}
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        />
      </button>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="flex flex-col gap-2 px-4 pb-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-[10px] mt-2 tracking-wider font-semibold" style={{ color: "var(--muted)" }}>INJECT FAULT</p>

          {/* Bottleneck */}
          <button
            disabled={injecting}
            onClick={() => inject("bottleneck")}
            className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 transition-opacity"
            style={{
              background: "rgba(239,68,68,0.12)",
              color: "var(--danger)",
              border: "1px solid rgba(239,68,68,0.35)",
            }}
          >
            <Zap size={12} /> Bottleneck → Station 12
          </button>

          {/* Defect */}
          <button
            disabled={injecting}
            onClick={() => inject("defect")}
            className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 transition-opacity"
            style={{
              background: "rgba(245,158,11,0.12)",
              color: "var(--warning)",
              border: "1px solid rgba(245,158,11,0.35)",
            }}
          >
            <Bug size={12} /> Defect Risk → Station 7
          </button>

          {/* CHAOS */}
          <motion.button
            disabled={injecting}
            onClick={() => inject("chaos")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #ef4444, #991b1b)",
              color: "#fff",
              border: "1px solid #f87171",
              boxShadow: "0 0 20px rgba(239,68,68,0.45)",
              textShadow: "0 1px 2px rgba(0,0,0,0.5)",
            }}
          >
            <Flame size={13} /> INJECT CHAOS — STRESS TEST
          </motion.button>

          <div style={{ height: 1, background: "var(--border)" }} className="my-1" />

          {/* Reset */}
          <button
            disabled={injecting}
            onClick={reset}
            className="flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 transition-opacity"
            style={{
              background: "rgba(100,116,139,0.12)",
              color: "var(--muted)",
              border: "1px solid var(--border)",
            }}
          >
            <RotateCcw size={11} /> Reset Simulation
          </button>

          {/* Action confirmation */}
          {lastAction && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] text-center font-medium pt-1"
              style={{ color: "var(--success)" }}
            >
              {lastAction}
            </motion.p>
          )}
        </motion.div>
      )}
    </div>
  );
}
