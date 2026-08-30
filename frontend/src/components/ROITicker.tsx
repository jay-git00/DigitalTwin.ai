"use client";
import { useEffect, useState, useRef } from "react";
import { IndianRupee } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Savings accumulate as the demo runs based on:
// - Each approved intervention → ₹3,50,000 saved
// - Background baseline: ~₹800 per minute of normal operation (avoided scrap)
const BASE_RATE_PER_SEC = 800 / 60;  // ₹/s

interface Props {
  interventionsApproved: number;
}

function formatINRLive(n: number): string {
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)}L`;
  return `₹${Math.floor(n).toLocaleString("en-IN")}`;
}

export default function ROITicker({ interventionsApproved }: Props) {
  const [total,    setTotal]    = useState(0);
  const [flash,    setFlash]    = useState(false);
  const prevRef = useRef(interventionsApproved);
  const startRef = useRef(Date.now());

  // Tick up continuously
  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      setTotal(elapsed * BASE_RATE_PER_SEC + interventionsApproved * 350_000);
    }, 500);
    return () => clearInterval(id);
  }, [interventionsApproved]);

  // Flash on new intervention
  useEffect(() => {
    if (interventionsApproved > prevRef.current) {
      prevRef.current = interventionsApproved;
      setFlash(true);
      setTimeout(() => setFlash(false), 1200);
    }
  }, [interventionsApproved]);

  return (
    <motion.div
      animate={flash ? { scale: [1, 1.06, 1], boxShadow: ["0 0 0px #10b98100", "0 0 20px #10b98166", "0 0 0px #10b98100"] } : {}}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center px-5 py-3 rounded-xl"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <IndianRupee size={14} color="var(--success)" />
      <span className="text-xl font-bold mt-1 tabular-nums" style={{ color: "var(--success)" }}>
        {formatINRLive(total)}
      </span>
      <span className="text-[10px]" style={{ color: "var(--muted)" }}>Saved This Session</span>
    </motion.div>
  );
}
