import { StationStatus } from "@/types";

/** Maps anomaly_score → colour hex. Isolation Forest: negative = anomaly. */
export function stationColor(station: StationStatus): string {
  if (!station || station.cycle_time_s === 0) return "#475569";
  if (station.fault_active) return "#ef4444";        // confirmed fault
  const s = station.anomaly_score ?? 0;
  if (s < -0.05) return "#ef4444";                  // strong anomaly — red
  if (s < 0.05)  return "#f59e0b";                  // borderline — amber
  return "#10b981";                                  // normal — green
}

export function stationLabel(station: StationStatus): string {
  if (!station || station.cycle_time_s === 0) return "IDLE";
  if (station.fault_active) return "FAULT";
  const s = station.anomaly_score ?? 0;
  if (s < -0.05) return "ANOMALY";
  if (s < 0.05)  return "WATCH";
  return "OK";
}

/** Zone display name */
export const ZONE_NAMES: Record<string, string> = {
  body:  "Body Construction",
  paint: "Paint Shop",
  final: "Final Assembly",
};

export function getApiBase(): string {
  // Hardcoded for Vercel production deployment
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "https://digitaltwin-backend-b54j.onrender.com";
  }
  return "http://localhost:8000";
}

export async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export function formatINR(n: number): string {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)} Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(1)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

/** Backward-compat alias */
export const API_BASE = "https://digitaltwin-backend-b54j.onrender.com";
