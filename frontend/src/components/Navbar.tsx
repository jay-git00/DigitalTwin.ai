"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bell, BarChart2, GitBranch, Cpu, Wrench, Globe } from "lucide-react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/",             label: "Live Floor",   icon: Activity   },
  { href: "/alerts",       label: "Alerts",       icon: Bell       },
  { href: "/analytics",    label: "Analytics",    icon: BarChart2  },
  { href: "/defect-trace", label: "Defect Trace", icon: GitBranch  },
  { href: "/maintenance",  label: "Maintenance",  icon: Wrench     },
  { href: "/multisite",    label: "Multi-Site",   icon: Globe      },
];

export default function Navbar() {
  const path = usePathname();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-16"
      style={{
        background:     "rgba(10,14,26,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom:   "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: "linear-gradient(135deg,#00d4ff,#7c3aed)" }}
        >
          <Cpu size={16} color="#fff" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-sm tracking-tight" style={{ color: "var(--text)" }}>
            AI <span style={{ color: "var(--accent)" }}>AssemblyTwin</span>
          </span>
          <span className="text-[9px] font-medium tracking-widest uppercase"
                style={{ color: "var(--muted)" }}>
            Accenture Innovation Challenge 2026
          </span>
        </div>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link key={href} href={href} style={{ textDecoration: "none" }}>
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                style={{
                  color:      active ? "var(--accent)"          : "var(--muted)",
                  background: active ? "rgba(0,212,255,0.08)"   : "transparent",
                  border:     active ? "1px solid rgba(0,212,255,0.2)" : "1px solid transparent",
                }}
              >
                <Icon size={13} />
                {label}
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Live badge */}
      <div className="flex items-center gap-2 text-xs font-semibold shrink-0"
           style={{ color: "var(--success)" }}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: "var(--success)" }} />
          <span className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: "var(--success)" }} />
        </span>
        LIVE
      </div>
    </nav>
  );
}
