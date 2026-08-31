"use client";
import { useEffect, useRef } from "react";
import { WSMessage } from "@/types";

function getWsUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (api) {
    return api.replace(/^http/, "ws") + "/ws/live";
  }
  return "ws://127.0.0.1:8000/ws/live";
}

type Handler = (msg: WSMessage) => void;

export function useWebSocket(onMessage: Handler) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlerRef = useRef<Handler>(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let isDisposed = false;

    function connect() {
      if (isDisposed) return;
      if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
        return;
      }

      try {
        const ws = new WebSocket(getWsUrl());
        wsRef.current = ws;

        ws.onmessage = (e) => {
          try {
            const msg: WSMessage = JSON.parse(e.data);
            handlerRef.current(msg);
          } catch { /* ignore malformed */ }
        };

        ws.onclose = () => {
          wsRef.current = null;
          if (!isDisposed) {
            timer = setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          // Let onclose handle clean reconnection
        };
      } catch {
        if (!isDisposed) {
          timer = setTimeout(connect, 3000);
        }
      }
    }

    connect();

    return () => {
      isDisposed = true;
      if (timer) clearTimeout(timer);
      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null;
        ws.onclose = null;
        ws.onerror = null;
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => ws.close();
        } else if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      }
    };
  }, []);
}
