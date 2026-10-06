"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";

export type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";

export interface AgentTraceEvent {
  id: string;
  timestamp: string;
  type: string;
  step?: string;
  title?: string;
  description?: string;
  data?: Record<string, unknown>;
}

export interface DispatchedReminder {
  id: string;
  recipient: string;
  bond_number?: string;
  amount?: number;
  level?: number;
  label?: string;
  simulation?: boolean;
  timestamp: string;
  body?: string;
}

const DEFAULT_WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/agent";

export function useAgentWebSocket() {
  const [status, setStatus] = useState<WebSocketStatus>("connecting");
  const [events, setEvents] = useState<AgentTraceEvent[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [latestReminder, setLatestReminder] = useState<DispatchedReminder | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [finalReport, setFinalReport] = useState<Record<string, unknown> | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const ws = new WebSocket(DEFAULT_WS_URL);
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const type = payload.type;
          const data = payload.data || {};
          const now = new Date().toLocaleTimeString("ar-SA", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          const traceItem: AgentTraceEvent = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            timestamp: now,
            type,
            step: data.step,
            title: data.title || type,
            description: data.description || data.message,
            data,
          };

          setEvents((prev) => [traceItem, ...prev]);

          if (type === "agent_start") {
            setIsRunning(true);
            setCurrentStep("start");
            setFinalReport(null);
          } else if (type === "agent_step") {
            setCurrentStep(data.step || null);
          } else if (type === "notification_dispatched") {
            const reminder: DispatchedReminder = {
              id: `${Date.now()}`,
              recipient: data.recipient,
              bond_number: data.bond_number,
              amount: data.amount,
              level: data.level,
              label: data.label,
              simulation: data.simulation ?? true,
              timestamp: now,
            };
            setLatestReminder(reminder);
          } else if (type === "agent_finished") {
            setIsRunning(false);
            setCurrentStep("finished");
            if (data.report) {
              setFinalReport(data.report);
            }
          } else if (type === "agent_error") {
            setIsRunning(false);
            setCurrentStep("error");
          }
        } catch {
          // If message is plain text (like ping-pong)
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
        socketRef.current = null;
        // Auto reconnect attempt after 4s
        reconnectTimeoutRef.current = setTimeout(() => {
          connectRef.current();
        }, 4000);
      };

      ws.onerror = () => {
        setStatus("error");
      };
    } catch {
      setStatus("error");
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  const clearLogs = useCallback(() => {
    setEvents([]);
    setCurrentStep(null);
    setLatestReminder(null);
    setFinalReport(null);
  }, []);

  const triggerRun = useCallback(async () => {
    setIsRunning(true);
    try {
      await api.runAgent();
    } catch (err) {
      setIsRunning(false);
      throw err;
    }
  }, []);

  useEffect(() => {
    connectRef.current = connect;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    status,
    events,
    currentStep,
    latestReminder,
    isRunning,
    finalReport,
    connect,
    disconnect,
    clearLogs,
    triggerRun,
  };
}
