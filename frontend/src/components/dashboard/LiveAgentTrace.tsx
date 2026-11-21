"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Activity,
  CheckCircle2,
  Cpu,
  Layers,
  Play,
  Radio,
  Send,
  Trash2,
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
  { key: "select_strategies", label: "٢. تحديد الإجراء", icon: Layers },
  { key: "draft_and_dispatch", label: "٣. إرسال التنبيه", icon: Send },
  { key: "generate_report", label: "٤. التقرير اليومي", icon: CheckCircle2 },
];

const EVENT_TYPE_LABELS: Record<string, string> = {
  node_started: "مرحلة جديدة",
  risk_assessment_completed: "تقييم المخاطر",
  strategies_selected: "اعتماد الإجراء",
  notification_dispatched: "إرسال إشعار",
  agent_finished: "اكتمال الدورة",
};

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
    <Card className="flex flex-col p-6 overflow-hidden relative">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-white tracking-tight">
                مركز المتابعة والتدقيق الآلي
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
                  className={`size-1.5 rounded-full ml-1.5 ${
                    status === "connected"
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-slate-400"
                  }`}
                />
                {status === "connected"
                  ? "متصل مباشرة"
                  : status === "connecting"
                  ? "جاري الاتصال…"
                  : "غير متصل"}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              متابعة فحص السندات واعتماد خطط السداد وإرسال الإشعارات لحظياً
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {events.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearLogs}
              className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
              title="مسح السجل"
            >
              <Trash2 size={13} className="ml-1" />
              مسح
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={onTriggerRun}
            disabled={isRunning}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-600/25 px-4 text-xs h-9"
          >
            {isRunning ? (
              <>
                <Radio size={14} className="ml-1.5 animate-spin" />
                جاري تنفيذ الدورة…
              </>
            ) : (
              <>
                <Play size={14} className="ml-1.5 fill-current" />
                تشغيل دورة المتابعة الآلية
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stepper Node Progress */}
      <div className="py-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 border-b border-slate-800/80">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.key;
          const isPassed = stepIndex > idx || currentStep === "finished";

          return (
            <div
              key={step.key}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all duration-300 ${
                isActive
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10 scale-[1.01]"
                  : isPassed
                  ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400"
                  : "bg-slate-900/50 border-slate-800 text-slate-500"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive
                    ? "bg-emerald-500 text-white animate-pulse"
                    : isPassed
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                <Icon size={14} />
              </div>
              <span className="text-xs font-medium truncate">{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Event Stream Clean Feed */}
      <div className="mt-4 flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pl-1">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-slate-400">
              <Cpu size={22} />
            </div>
            <p className="text-sm font-medium text-slate-300">
              في انتظار تشغيل دورة المتابعة الآلية
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              اضغط على زر &ldquo;تشغيل دورة المتابعة الآلية&rdquo; لبدء تحليل الالتزامات وبث مراحل المعالجة في الوقت الفعلي.
            </p>
          </div>
        ) : (
          events.map((evt) => {
            const isDispatched = evt.type === "notification_dispatched";
            const isFinish = evt.type === "agent_finished";
            const typeLabel = EVENT_TYPE_LABELS[evt.type] || "إشعار";

            return (
              <div
                key={evt.id}
                className={`p-3.5 rounded-xl border text-xs transition-all ${
                  isDispatched
                    ? "bg-emerald-950/20 border-emerald-500/30"
                    : isFinish
                    ? "bg-teal-950/20 border-teal-500/30"
                    : "bg-slate-900/60 border-slate-800/80"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="tabular text-[11px] text-slate-400">
                      {evt.timestamp}
                    </span>
                    <span className="font-semibold text-slate-100">
                      {evt.title}
                    </span>
                  </div>

                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                    {typeLabel}
                  </span>
                </div>

                {evt.description && (
                  <p className="text-slate-300 leading-relaxed text-xs">
                    {evt.description}
                  </p>
                )}

                {/* Additional contextual badges */}
                {isDispatched && evt.data && (
                  <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-emerald-500/15 text-[11px]">
                    <span className="text-emerald-400 font-medium">
                      المستلم: {String(evt.data.recipient || "")}
                    </span>
                    {evt.data.amount ? (
                      <span className="text-slate-200 tabular font-medium bg-slate-800 px-2 py-0.5 rounded">
                        {Number(evt.data.amount).toLocaleString()} ر.س
                      </span>
                    ) : null}
                    {evt.data.label ? (
                      <span className="text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                        {String(evt.data.label)}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <span>تحديث فوري للسجلات عبر اتصال آمن</span>
        <span className="text-emerald-400/80 font-medium">نظام تحصيل مؤتمت</span>
      </div>
    </Card>
  );
}
