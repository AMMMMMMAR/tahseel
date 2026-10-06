"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Activity,
  Bot,
  CheckCircle2,
  ChevronDown,
  Layers,
  Radio,
  Send,
  Terminal,
  Trash2,
  Zap,
} from "lucide-react";
import type { AgentTraceEvent, WebSocketStatus } from "@/hooks/useAgentWebSocket";

interface LiveAgentTraceProps {
  status: WebSocketStatus;
  events: AgentTraceEvent[];
  currentStep: string | null;
  isRunning: boolean;
  onTriggerRun: () => void;
  onClearLogs: () => void;
}

const STEPS = [
  { key: "assess_risks", label: "١. تقييم المخاطر", icon: Activity },
  { key: "select_strategies", label: "٢. تصنيف التصعيد", icon: Layers },
  { key: "draft_and_dispatch", label: "٣. صياغة وإرسال", icon: Send },
  { key: "generate_report", label: "٤. التقرير اليومي", icon: CheckCircle2 },
];

export function LiveAgentTrace({
  status,
  events,
  currentStep,
  isRunning,
  onTriggerRun,
  onClearLogs,
}: LiveAgentTraceProps) {
  const stepIndex = useMemo(() => {
    return STEPS.findIndex((s) => s.key === currentStep);
  }, [currentStep]);

  return (
    <Card className="flex flex-col p-5 bg-[#0a0a0c] border-[#222228] shadow-2xl rounded-2xl overflow-hidden relative">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1f1f24]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Terminal size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                مسار قرارات الوكيل الذكي (Live Agent Trace)
              </h3>
              <Badge
                tone={
                  status === "connected"
                    ? "success"
                    : status === "connecting"
                    ? "warning"
                    : "neutral"
                }
                pill
              >
                <span
                  className={`size-[7px] rounded-full mr-1 ${
                    status === "connected"
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-gray-400"
                  }`}
                />
                {status === "connected"
                  ? "متصل بالبث الحي"
                  : status === "connecting"
                  ? "جاري الاتصال..."
                  : "غير متصل"}
              </Badge>
            </div>
            <p className="text-xs text-[#8f8f9d]">
              بث مباشر لقرارات وتفكير نموذج LangGraph خطوة بخطوة عبر WebSocket
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {events.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearLogs}
              className="text-[#8f8f9d] hover:text-white hover:bg-[#1a1a20]"
              title="مسح السجل"
            >
              <Trash2 size={14} className="ml-1" />
              مسح
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={onTriggerRun}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-600/20 px-4"
          >
            {isRunning ? (
              <>
                <Radio size={14} className="ml-1.5 animate-spin" />
                جاري تنفيذ الدورة...
              </>
            ) : (
              <>
                <Zap size={14} className="ml-1.5" />
                تشغيل الوكيل (بث حي)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Visual Stepper Node Progress */}
      <div className="py-4 grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-[#1f1f24]/80">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.key;
          const isPassed = stepIndex > idx || currentStep === "finished";

          return (
            <div
              key={step.key}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all duration-300 ${
                isActive
                  ? "bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-md shadow-blue-500/10 scale-[1.02]"
                  : isPassed
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                  : "bg-[#121216] border-[#1e1e24] text-[#6b6b78]"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive
                    ? "bg-blue-500 text-white animate-pulse"
                    : isPassed
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-[#181820] text-[#6b6b78]"
                }`}
              >
                <Icon size={14} />
              </div>
              <span className="text-xs font-semibold truncate">{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Event Stream Terminal Feed */}
      <div className="mt-3 flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-[#737380]">
            <div className="w-12 h-12 rounded-2xl bg-[#141418] border border-[#222228] flex items-center justify-center mb-3 text-[#50505c]">
              <Bot size={24} />
            </div>
            <p className="text-sm font-medium text-[#a0a0b0]">
              في انتظار بدء دورة التحصيل الذاتية
            </p>
            <p className="text-xs text-[#6e6e7c] mt-1 max-w-sm">
              اضغط على زر &ldquo;تشغيل الوكيل (بث حي)&rdquo; بالأعلى لمشاهدة تحليل المخاطر، واختيار مستويات التصعيد، وإرسال التنبيهات في الوقت الفعلي.
            </p>
          </div>
        ) : (
          events.map((evt) => {
            const isDispatched = evt.type === "notification_dispatched";
            const isFinish = evt.type === "agent_finished";

            return (
              <div
                key={evt.id}
                className={`p-3 rounded-xl border text-xs transition-all ${
                  isDispatched
                    ? "bg-amber-500/5 border-amber-500/20"
                    : isFinish
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-[#121216] border-[#1c1c22]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#6b6b78]">
                      {evt.timestamp}
                    </span>
                    <span className="font-semibold text-white">
                      {evt.title}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1b1b22] text-[#8e8e9c]">
                    {evt.type}
                  </span>
                </div>

                {evt.description && (
                  <p className="text-[#a5a5b5] leading-relaxed">
                    {evt.description}
                  </p>
                )}

                {/* Additional contextual pills */}
                {isDispatched && evt.data && (
                  <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-amber-500/10 text-[11px]">
                    <span className="text-amber-400 font-medium">
                      المستلم: {String(evt.data.recipient || "")}
                    </span>
                    {evt.data.amount ? (
                      <span className="text-white font-mono bg-[#1b1b24] px-1.5 py-0.5 rounded">
                        {Number(evt.data.amount).toLocaleString()} ر.س
                      </span>
                    ) : null}
                    <Badge tone="warning">
                      المستوى {String(evt.data.level || "")} ({String(evt.data.label || "")})
                    </Badge>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-[#1f1f24] flex items-center justify-between text-[11px] text-[#6e6e7c]">
        <span>نواة الوكيل: Google Gemini 2.5 Flash + LangGraph</span>
        <span className="flex items-center gap-1 font-mono">
          <span>WebSocket Trace Engine</span>
          <ChevronDown size={12} className="rotate-180" />
        </span>
      </div>
    </Card>
  );
}
