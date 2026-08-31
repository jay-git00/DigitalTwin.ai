"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { Alert, WSMessage } from "@/types";
import { useWebSocket } from "@/lib/useWebSocket";
import { fetchJSON } from "@/lib/utils";
import AlertPanel from "@/components/AlertPanel";
import DemoControls from "@/components/DemoControls";
import HealthGauge from "@/components/HealthGauge";
import ROITicker from "@/components/ROITicker";
import BeforeAfterToggle from "@/components/BeforeAfterToggle";
import FactoryFloorMap from "@/components/FactoryFloorMap";
import TwinGPT from "@/components/TwinGPT";
import ESGWidget from "@/components/ESGWidget";
import { StationStatus, WSMessage as WS } from "@/types";
import { Activity, Bell, Zap } from "lucide-react";

export default function LiveFloorPage() {
  const [stations,         setStations]         = useState<Record<number, StationStatus>>({});
  const [alerts,           setAlerts]           = useState<Alert[]>([]);
  const [vehicles,         setVehicles]         = useState(0);
  const [wsConnected,      setWsConnected]      = useState(false);
  const [cycleHistories,   setCycleHistories]   = useState<Record<number, number[]>>({});
  const [interventionCount,setInterventionCount]= useState(0);

  const activeSessionRef = useRef<number>(1);

  useEffect(() => {
    fetchJSON<{ stations: StationStatus[]; vehicles_completed?: number }>("/api/stations/status")
      .then((data) => {
        const map: Record<number, StationStatus> = {};
        (data.stations || []).forEach((st) => { map[st.station_id] = st; });
        setStations(map);
        if (data.vehicles_completed != null) {
          setVehicles(data.vehicles_completed);
        }
      }).catch(() => {});
    fetchJSON<{ alerts: Alert[] }>("/api/alerts")
      .then(({ alerts: a }) => setAlerts(a)).catch(() => {});
  }, []);

  const updateHistory = useCallback((station: StationStatus) => {
    setCycleHistories((prev) => {
      const existing = prev[station.station_id] ?? [];
      const updated  = [...existing, station.cycle_time_s].slice(-20);
      return { ...prev, [station.station_id]: updated };
    });
  }, []);

  const handleWS = useCallback((msg: WS) => {
    setWsConnected(true);
    if (msg.type === "init") {
      setAlerts(msg.alerts);
    } else if (msg.type === "station_update") {
      if (msg.data.sim_session_id != null && msg.data.sim_session_id !== activeSessionRef.current) {
        return; // Discard stale telemetry from previous simulation session
      }
      setStations((prev) => ({ ...prev, [msg.data.station_id]: msg.data }));
      updateHistory(msg.data);
      if (msg.data.vehicles_completed != null) {
        setVehicles(msg.data.vehicles_completed);
      }
    } else if (msg.type === "alert") {
      setAlerts((prev) => [...prev.filter(a => a.id !== msg.alert.id), msg.alert]);
    } else if (msg.type === "alert_resolved") {
      setAlerts((prev) => prev.map((a) => a.id === msg.alert_id ? { ...a, status: "approved" } : a));
      setInterventionCount((n) => n + 1);
    } else if (msg.type === "reset") {
      if (msg.sim_session_id != null) {
        activeSessionRef.current = msg.sim_session_id;
      }
      setStations({});
      setAlerts([]);
      setVehicles(0);
      setCycleHistories({});
      setInterventionCount(0);
    }
  }, [updateHistory]);

  useWebSocket(handleWS, setWsConnected);

  const activeAlerts = alerts.filter((a) => a.status === "active");
  const anomalyCount = Object.values(stations).filter((s) => (s.anomaly_score ?? 0) < -0.05).length;

  return (
    <div className="flex flex-col min-h-screen p-6 gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Live Factory Floor</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            45-station vehicle assembly · Real-time digital twin · Chennai Plant
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <HealthGauge />
          <ROITicker interventionsApproved={interventionCount} />
          {[
            { icon: Activity, label: "Vehicles", value: vehicles.toLocaleString(),  color: "var(--accent)" },
            { icon: Zap,      label: "Anomalies", value: anomalyCount,              color: anomalyCount > 0 ? "var(--danger)" : "var(--success)" },
            { icon: Bell,     label: "Alerts",    value: activeAlerts.length,       color: activeAlerts.length > 0 ? "var(--danger)" : "var(--success)" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex flex-col items-center px-4 py-3 rounded-xl"
                 style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <Icon size={13} color={color as string} />
              <span className="text-xl font-bold mt-0.5" style={{ color: color as string }}>{value}</span>
              <span className="text-[10px]" style={{ color: "var(--muted)" }}>{label}</span>
            </div>
          ))}
          {/* WS indicator */}
          <div className="flex items-center gap-1.5 text-xs"
               style={{ color: wsConnected ? "var(--success)" : "var(--warning)" }}>
            <span className="relative flex h-2 w-2">
              <span className={`${wsConnected ? "animate-ping" : ""} absolute inline-flex h-full w-full rounded-full opacity-75`}
                    style={{ background: wsConnected ? "var(--success)" : "var(--warning)" }} />
              <span className="relative inline-flex rounded-full h-2 w-2"
                    style={{ background: wsConnected ? "var(--success)" : "var(--warning)" }} />
            </span>
            {wsConnected ? "Connected" : "Connecting…"}
          </div>
        </div>
      </div>

      {/* Before/After toggle — THE killer demo moment */}
      <BeforeAfterToggle interventionsApproved={interventionCount} />

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs flex-wrap" style={{ color: "var(--muted)" }}>
        {[
          { color: "#10b981", label: "Normal" },
          { color: "#f59e0b", label: "Watch — click WHY? to explain" },
          { color: "#ef4444", label: "Fault / Anomaly" },
          { color: "var(--muted)", label: "· Legacy (GP imputed)", opacity: 0.6 },
        ].map(({ color, label, opacity }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color, opacity }} />
            {label}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex gap-6 flex-1">
        <div className="flex-1 min-w-0">
          <FactoryFloorMap stations={stations} cycleHistories={cycleHistories} />
        </div>
        <div className="w-80 shrink-0 flex flex-col gap-4">
          {/* ESG Live Monitor */}
          <ESGWidget stations={stations} />
          <div className="flex items-center gap-2">
            <Bell size={14} color="var(--danger)" />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Active Alerts</h2>
            {activeAlerts.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: "var(--danger)", color: "#fff" }}>
                {activeAlerts.length}
              </span>
            )}
          </div>
          <AlertPanel
            alerts={alerts}
            onResolved={(id) =>
              setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: "dismissed" } : a))
            }
          />
        </div>
      </div>
      {/* TwinGPT floating AI assistant */}
      <TwinGPT stations={stations} vehicles={vehicles} anomalyCount={anomalyCount} alertCount={activeAlerts.length} />

      <DemoControls />
    </div>
  );
}
