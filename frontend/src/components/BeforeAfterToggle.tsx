"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, XCircle, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";

// The most powerful demo moment:
// Toggle OFF = "what the factory looked like without the twin"
// Toggle ON  = "what the twin actually prevented"

interface Props {
  interventionsApproved: number;
}

export default function BeforeAfterToggle({ interventionsApproved }: Props) {
  const [twinOn, setTwinOn] = useState(true);

  return (
    <div className="flex items-center gap-4">
      {/* Toggle */}
      <button
        onClick={() => setTwinOn((p) => !p)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: twinOn ? "rgba(0,212,255,0.12)" : "rgba(239,68,68,0.12)",
          border:     twinOn ? "1px solid rgba(0,212,255,0.4)" : "1px solid rgba(239,68,68,0.4)",
          color:      twinOn ? "var(--accent)" : "var(--danger)",
        }}
      >
        {twinOn ? <Eye size={14} /> : <EyeOff size={14} />}
        Digital Twin: {twinOn ? "ON" : "OFF"}
      </button>

      {/* Consequence banner */}
      <AnimatePresence mode="wait">
        {!twinOn && (
          <motion.div
            key="off"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold"
            style={{
              background: "rgba(239,68,68,0.10)",
              border:     "1px solid rgba(239,68,68,0.4)",
              color:      "var(--danger)",
            }}
          >
            <AlertTriangle size={14} />
            <span>
              WITHOUT TWIN: <strong>12 vehicles passed QC with defects</strong>
              &nbsp;· ₹48L rework cost · 3.2hr unplanned downtime
            </span>
          </motion.div>
        )}
        {twinOn && interventionsApproved > 0 && (
          <motion.div
            key="on"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold"
            style={{
              background: "rgba(16,185,129,0.10)",
              border:     "1px solid rgba(16,185,129,0.3)",
              color:      "var(--success)",
            }}
          >
            <CheckCircle size={14} />
            <span>
              TWIN ACTIVE: <strong>{interventionsApproved} intervention{interventionsApproved > 1 ? "s" : ""} approved</strong>
              &nbsp;· 0 undetected defects · Line running at capacity
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
