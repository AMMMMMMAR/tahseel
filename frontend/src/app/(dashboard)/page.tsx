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
import { LiveAgentTrace } from "@/components/dashboard/LiveAgentTrace";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/States";
import { useBonds } from "@/hooks/useBonds";
import { useAgentWebSocket } from "@/hooks/useAgentWebSocket";
import { getPriorityBonds, summarizeBonds } from "@/lib/bonds";
import { formatNumberAr } from "@/lib/utils";
import { toast } from "@/components/providers/ToastProvider";

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
        title: "اكتملت دورة التحصيل الآلية",
        description: "تم تحديث درجات المخاطر وبث التنبيهات وإصدار التقرير بنجاح.",
      });
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "تعذر تشغيل دورة المتابعة الآلية.";
      toast({
        tone: "error",
        title: "خطأ أثناء تشغيل الدورة",
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

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="لوحة المتابعة والتحصيل"
        subtitle={lastUpdate ? `تحديث البيانات: ${lastUpdate}` : undefined}
        action={
          <div className="flex items-center gap-3">
            <Link
              href="/upload"
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
            >
              <span>+ فحص سند جديد</span>
            </Link>
          </div>
        }
      />

      {/* KPI Stats Row */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          caption={`${formatNumberAr(summary.overdueCount)} سندات متأخرة عن موعدها`}
          tone="danger"
        />
        <KpiCard
          label="المحصّل هذا الشهر"
          value={formatNumberAr(summary.collectedThisMonth)}
          unit="ر.س"
          caption="إجمالي المبالغ المسددة فعلياً"
          tone="success"
        />
        <KpiCard
          label="متوسط سرعة الاسترداد"
          value={formatNumberAr(summary.avgCycleDays)}
          unit="يوم"
          caption="متوسط المدة الزمنية للتسوية"
        />
      </section>

      {/* Operational Center: Live Agent Activity & Full Priority Matrix */}
      <section className="flex flex-col gap-6">
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
            <div className="text-start">
              <h3 className="text-base font-bold text-white">
                قائمة السندات ذات الأولوية والمخاطر العالية
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                سندات متأخرة أو تقترب من موعد الاستحقاق وتتطلب إجراءً ومتابعة فورية
              </p>
            </div>
            <Link
              href="/bonds"
              className="text-xs text-emerald-400 hover:text-emerald-300 transition font-medium flex items-center gap-1"
            >
              <span>عرض كافة السندات</span>
              <span>←</span>
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
      </section>
    </div>
  );
}
