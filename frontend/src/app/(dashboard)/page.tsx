"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  PriorityTable,
  PriorityTableSkeleton,
} from "@/components/dashboard/PriorityTable";
import { DecisionCard } from "@/components/dashboard/DecisionCard";
import { LiveAgentTrace } from "@/components/dashboard/LiveAgentTrace";
import { MobileSimulator } from "@/components/dashboard/MobileSimulator";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { useBonds } from "@/hooks/useBonds";
import { useAgentWebSocket } from "@/hooks/useAgentWebSocket";
import { getPriorityBonds, summarizeBonds } from "@/lib/bonds";
import { formatNumberAr } from "@/lib/utils";
import { toast } from "@/components/providers/ToastProvider";
import type { Bond } from "@/lib/types";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useBonds({
    status: "all",
    limit: 100,
  });

  const {
    status: wsStatus,
    events,
    currentStep,
    latestReminder,
    isRunning: isAgentRunning,
    triggerRun,
    clearLogs,
  } = useAgentWebSocket();

  const handleRunAgent = async () => {
    try {
      await triggerRun();
      queryClient.invalidateQueries({ queryKey: ["bonds"] });
      toast({
        tone: "success",
        title: "اكتملت دورة التحصيل الذاتية",
        description: "تم تحديث درجات المخاطر وبث التنبيهات وإصدار التقرير بنجاح.",
      });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "تعذر تشغيل الوكيل الذكي.";
      toast({
        tone: "error",
        title: "خطأ أثناء تشغيل الوكيل",
        description: errorMsg,
      });
    }
  };

  const summary = useMemo(
    () => summarizeBonds(data?.bonds ?? []),
    [data?.bonds]
  );

  const priority = useMemo(
    () => getPriorityBonds(data?.bonds ?? [], 4),
    [data?.bonds]
  );

  const decisions = useMemo(
    () => getPriorityBonds(data?.bonds ?? [], 3),
    [data?.bonds]
  );

  const [lastUpdate, setLastUpdate] = useState<string>("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLastUpdate(
      new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-arab", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(new Date())
    );
  }, []);

  const onExecute = (bond: Bond) => {
    toast({
      tone: "info",
      title: `تم تسجيل القرار للعميل ${bond.clients?.name ?? ""}`,
      description: "سيتم تطبيق إجراء التصعيد عبر الوكيل الذكي في الدورة القادمة.",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="مركز قيادة تحصيل الديون الذكي"
        subtitle={lastUpdate ? `تحديث البيانات: ${lastUpdate}` : undefined}
        action={
          <div className="flex items-center gap-3">
            <Link
              href="/upload"
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 shadow-md shadow-blue-600/20 transition"
            >
              + فحص سند جديد (OCR)
            </Link>
          </div>
        }
      />

      {/* KPI Stats Row */}
      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="إجمالي المستحقات"
          value={formatNumberAr(summary.totalReceivables)}
          unit="ر.س"
          caption={`موزّعة على ${formatNumberAr(summary.totalClients)} عميل`}
        />
        <KpiCard
          label="المتأخر سداده"
          value={formatNumberAr(summary.overdueAmount)}
          unit="ر.س"
          caption={`${formatNumberAr(summary.overdueCount)} عملاء · يحتاج إجراءً اليوم`}
          tone="danger"
        />
        <KpiCard
          label="المحصّل هذا الشهر"
          value={formatNumberAr(summary.collectedThisMonth)}
          unit="ر.س"
          caption="إجمالي السندات المسوّاة بنجاح"
          tone="success"
        />
        <KpiCard
          label="متوسط دورة التحصيل"
          value={formatNumberAr(summary.avgCycleDays)}
          unit="يوم"
          caption="معدل استرداد قياسي عبر الوكيل الذكي"
          tone="success"
        />
      </section>

      {/* Split-Screen Interactive Command Center: Live Trace + Mobile Simulator */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Column: Live Agent Trace Terminal (7 or 8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-5">
          <LiveAgentTrace
            status={wsStatus}
            events={events}
            currentStep={currentStep}
            isRunning={isAgentRunning}
            onTriggerRun={handleRunAgent}
            onClearLogs={clearLogs}
          />

          {/* Priority Debtor Matrix Table */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  أولويات المتابعة العاجلة
                </h3>
                <p className="text-xs text-[#8f8f9d]">
                  السندات الأعلى خطورة التي تخضع لمستويات التصعيد من 1 إلى 4
                </p>
              </div>
              <Link
                href="/bonds"
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                عرض كل السندات ←
              </Link>
            </div>

            {isLoading ? (
              <PriorityTableSkeleton />
            ) : isError ? (
              <Card className="p-4">
                <ErrorState
                  title="تعذّر تحميل قائمة الأولوية"
                  description={error?.detail || error?.message}
                  onRetry={() => refetch()}
                />
              </Card>
            ) : (
              <PriorityTable bonds={priority} />
            )}
          </div>
        </div>

        {/* Right Column: Real-Time Mobile Simulator (4 cols) */}
        <div className="xl:col-span-4 flex flex-col items-center">
          <div className="w-full mb-3 text-center sm:text-start">
            <h3 className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-2">
              <span>محاكي تجربة المدين</span>
              <Badge tone="success" pill>
                تفاعل حي
              </Badge>
            </h3>
            <p className="text-xs text-[#8f8f9d]">
              استقبال رسائل التذكير التفاعلية والردود السريعة لحظياً عبر واتساب
            </p>
          </div>

          <MobileSimulator latestReminder={latestReminder} />
        </div>
      </section>

      {/* Recommended Decisions Section */}
      <section className="flex flex-col gap-3.5 pt-4 border-t border-[#1f1f24]">
        <div className="flex min-h-[40px] flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-[2px] text-start">
            <h3 className="text-base font-bold text-white">
              قرارات اليوم المقترحة (AI Recommendations)
            </h3>
            <p className="text-xs text-[#8f8f9d]">
              {`${formatNumberAr(decisions.length)} توصيات بأولوية عالية جاهزة للتنفيذ بنقرة واحدة`}
            </p>
          </div>
          <Badge tone="success" pill>
            <span className="size-[8px] rounded-full bg-emerald-400 mr-1 animate-pulse" />
            تحليل مستمر
          </Badge>
        </div>

        {isLoading ? (
          <LoadingState label="جاري تحضير القرارات…" />
        ) : decisions.length === 0 ? (
          <Card className="p-4">
            <EmptyState
              title="لا توجد قرارات مقترحة اليوم"
              description="سيظهر هنا أعلى توصيات يحدّدها الوكيل الذكي بناءً على درجات المخاطر."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
            {decisions.map((b) => (
              <DecisionCard key={b.id} bond={b} onExecute={onExecute} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
