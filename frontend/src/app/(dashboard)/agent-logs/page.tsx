"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { api } from "@/lib/api";
import { formatDateAr, formatNumberAr, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import {
  Activity,
  CheckCircle2,
  Clock,
  Cpu,
  FileText,
  Mail,
  ShieldAlert,
} from "lucide-react";

export default function AgentLogsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["agent-logs"],
    queryFn: () => api.getAgentLogs(50),
    refetchInterval: 30000,
  });

  const logs = useMemo(() => data?.logs ?? [], [data?.logs]);

  // Metrics
  const metrics = useMemo(() => {
    const reminders = logs.filter(
      (l) => l.action_type === "reminder_sent" || l.action_type === "reminder_simulated"
    ).length;
    const risks = logs.filter(
      (l) => l.action_type === "analyze_risks" || l.action_type === "find_high_risk"
    ).length;
    const reports = logs.filter((l) => l.action_type === "daily_report_generated").length;
    return { total: logs.length, reminders, risks, reports };
  }, [logs]);

  // Filtered logs
  const filtered = useMemo(() => {
    let result = logs;

    if (filter === "reminders") {
      result = result.filter(
        (l) => l.action_type === "reminder_sent" || l.action_type === "reminder_simulated"
      );
    } else if (filter === "risks") {
      result = result.filter(
        (l) => l.action_type === "analyze_risks" || l.action_type === "find_high_risk"
      );
    } else if (filter === "reports") {
      result = result.filter((l) => l.action_type === "daily_report_generated");
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((l) => {
        const clientName = l.client_name || l.bonds?.clients?.name || l.details?.recipient || "";
        const bondNum = l.bond_number || l.bonds?.bond_number || "";
        const summary = l.details?.summary || l.details?.message || "";
        const label = l.details?.label || "";
        const desc = JSON.stringify(l.details || "");
        return (
          clientName.toLowerCase().includes(q) ||
          bondNum.toLowerCase().includes(q) ||
          summary.toLowerCase().includes(q) ||
          label.toLowerCase().includes(q) ||
          desc.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [logs, filter, search]);

  return (
    <>
      <PageHeader
        title="سجل إجراءات وقرارات المتابعة الآلية"
        subtitle="سجل تدقيق كامل لكافة القرارات والرسائل التلقائية المعتمدة من نظام التحصيل"
        action={
          <Badge tone="success" pill>
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse ml-1.5" />
            تدقيق مستمر للقرارات
          </Badge>
        }
      />

      {/* 3 Summary Activity Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card className="p-4 flex items-center justify-between">
          <div className="text-start">
            <span className="text-xs text-slate-400 font-medium">إجمالي الإجراءات المنفذة</span>
            <p className="text-2xl font-bold text-white tabular mt-1">{formatNumberAr(metrics.total)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
            <Activity size={18} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div className="text-start">
            <span className="text-xs text-slate-400 font-medium">إشعارات وتنبيهات أُرسلت</span>
            <p className="text-2xl font-bold text-rose-400 tabular mt-1">{formatNumberAr(metrics.reminders)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
            <Mail size={18} />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div className="text-start">
            <span className="text-xs text-slate-400 font-medium">تقارير وتقييمات مكتملة</span>
            <p className="text-2xl font-bold text-emerald-400 tabular mt-1">{formatNumberAr(metrics.risks + metrics.reports)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <input
          type="search"
          placeholder="ابحث باسم العميل أو رقم السند في السجل…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition"
        />

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "all", label: "كل العمليات" },
            { key: "reminders", label: "رسائل التنبيه" },
            { key: "risks", label: "فحص المخاطر" },
            { key: "reports", label: "التقارير اليومية" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                filter === tab.key
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Cards List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <LoadingState label="جاري تحميل سجل النشاط..." />
        ) : isError ? (
          <Card className="p-5">
            <ErrorState
              title="تعذّر تحميل السجل"
              description={(error as Error & { detail?: string })?.detail || error.message}
              onRetry={() => refetch()}
            />
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-6">
            <EmptyState
              title="لا توجد إجراءات مطابقة"
              description="لم يتم العثور على أي نشاط مطابق للبحث أو الفلتر المحدد."
            />
          </Card>
        ) : (
          filtered.map((log) => {
            const dateObj = new Date(log.executed_at);
            const time = dateObj.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
            const dateStr = formatDateAr(log.executed_at);

            let title = "إجراء بالنظام";
            let description = "";
            let badgeText = "";
            let badgeTone: "brand" | "danger" | "success" | "warning" | "info" = "info";
            let icon = <Cpu size={20} />;
            let iconColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

            if (log.action_type === "reminder_sent" || log.action_type === "reminder_simulated") {
              const clientName = log.client_name || log.bonds?.clients?.name || log.details?.recipient || "عميل غير معروف";
              const bondNum = log.bond_number || log.bonds?.bond_number || "سند غير معروف";
              const amountVal = (log.details?.amount as number) ?? log.bonds?.amount ?? 0;
              const amount = formatNumberAr(amountVal);
              const label = (log.details?.label as string) || "تذكير بالسداد";
              const daysOverdue = (log.details?.days_overdue as number) ?? 0;

              title = `${label} — ${clientName}`;
              description =
                (log.details?.summary as string) ||
                `تم إرسال ${label} آلياً بخصوص السند ${bondNum} بمبلغ ${amount} ر.س. (تأخير ${daysOverdue} يوم).`;
              badgeText = label;
              badgeTone = daysOverdue > 60 ? "danger" : daysOverdue > 14 ? "warning" : "info";
              icon = <Mail size={20} />;
              iconColor = daysOverdue > 60
                ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                : "text-amber-400 bg-amber-500/10 border-amber-500/20";
            } else if (log.action_type === "analyze_risks") {
              title = "تحليل وتحديث مخاطر السندات والعملاء";
              description =
                (log.details?.message as string) ||
                `تم تقييم وتحديث درجات المخاطر لـ ${log.details?.updated_count || 0} سندات وفواتير نشطة.`;
              badgeText = "تقييم دوري";
              badgeTone = "info";
              icon = <Activity size={20} />;
              iconColor = "text-sky-400 bg-sky-500/10 border-sky-500/20";
            } else if (log.action_type === "find_high_risk") {
              title = "اكتشاف الحالات الأكثر خطورة للمتابعة";
              description =
                (log.details?.message as string) ||
                `تم اكتشاف ${log.details?.high_risk_count || 0} حالة تتطلب التدخل والمتابعة الفورية.`;
              badgeText = "خطر عالٍ";
              badgeTone = "danger";
              icon = <ShieldAlert size={20} />;
              iconColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
            } else if (log.action_type === "daily_report_generated") {
              title = "إصدار التقرير اليومي لمحفظة التحصيل";
              const debts = (log.details?.["إجمالي_الديون_النشطة"] as string) || "0 ر.س";
              const overdueDebt = (log.details?.["المتأخرات_المتراكمة"] as string) || (log.details?.["المتأخرات"] as string) || "0 ر.س";
              const recoveryRate = (log.details?.["معدل_التعافي_المقدر"] as string) || "";
              const activeCount = (log.details?.["عدد_السندات_النشطة"] as number) ?? 0;

              description = `تقرير تحليلي للمحفظة: إجمالي الديون ${debts} | المتأخرات ${overdueDebt} | السندات النشطة (${activeCount}) | معدل الاسترداد ${recoveryRate}`;
              badgeText = "تقرير تنفيذي";
              badgeTone = "success";
              icon = <FileText size={20} />;
              iconColor = "text-teal-400 bg-teal-500/10 border-teal-500/20";
            } else {
              title = `إجراء في النظام (${log.action_type})`;
              description = (log.details?.message as string) || (log.details?.summary as string) || "تم تنفيذ الإجراء بنجاح وفق السياسة المعتمدة.";
              badgeText = "إجراء معتمد";
              badgeTone = "info";
            }

            return (
              <Card key={log.id} className="p-4 transition-colors hover:border-slate-700/80">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  {/* Icon */}
                  <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl border ${iconColor}`}>
                    {icon}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col gap-1 text-start">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">
                        {title}
                      </h3>
                      {badgeText && (
                        <Badge tone={badgeTone} pill>
                          {badgeText}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {description}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} />
                        <span className="tabular">{time} — {dateStr}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-400" />
                        <span>إجراء آلي معتمد</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
