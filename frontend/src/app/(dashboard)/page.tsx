"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  PriorityTable,
  PriorityTableSkeleton,
} from "@/components/dashboard/PriorityTable";
import { DecisionCard } from "@/components/dashboard/DecisionCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { useBonds } from "@/hooks/useBonds";
import { api } from "@/lib/api";
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

  const agentMutation = useMutation({
    mutationFn: () => api.runAgent(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["bonds"] });
      toast({
        tone: "success",
        title: "اكتملت دورة الوكيل بنجاح",
        description: `تم تحديث المخاطر وإرسال ${res.reminders_sent} تذكيرات.`,
      });
    },
    onError: (err: any) => {
      toast({
        tone: "error",
        title: "فشل تشغيل الوكيل",
        description: err.detail || err.message || "حدث خطأ غير معروف",
      });
    },
  });

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
      description: "سيتم تنفيذ الإجراء عبر الوكيل الذكي خلال الدقائق القادمة.",
    });
  };

  return (
    <>
      <PageHeader
        title="لوحة التحكم"
        subtitle={lastUpdate ? `آخر تحديث: ${lastUpdate}` : undefined}
        action={
          <div className="flex items-center gap-[10px]">
            <Button
              variant="outline"
              size="md"
              onClick={() => agentMutation.mutate()}
              disabled={agentMutation.isPending}
              className="bg-[var(--color-bg-card)] text-[var(--color-fg)] border-[var(--color-border)] hover:bg-[var(--color-bg-card-soft)]"
            >
              {agentMutation.isPending ? "الوكيل يعمل..." : "🤖 تشغيل الوكيل الذكي"}
            </Button>
            <Link
              href="/upload"
              className="rounded-[5px] bg-[var(--color-brand)] px-4 py-[9px] text-[13px] font-semibold text-white hover:bg-[#2563eb]"
            >
              + رفع سند جديد
            </Link>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
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
          caption="إجمالي السندات المسوّاة هذا الشهر"
          tone="success"
        />
        <KpiCard
          label="متوسط دورة التحصيل"
          value={formatNumberAr(summary.avgCycleDays)}
          unit="يوم"
          caption="تحسّن مستمر منذ تفعيل الوكيل"
          tone="success"
        />
      </section>

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

      <section className="flex flex-col gap-[14px]">
        <div className="flex min-h-[56px] flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-[2px] text-start">
            <h2 className="text-[18px] font-bold text-[var(--color-fg)]">
              قرارات اليوم المقترحة
            </h2>
            <p className="text-[12px] text-[var(--color-fg-subtle)]">
              {`${formatNumberAr(decisions.length)} توصيات بأولوية عالية · جاهزة للتنفيذ بنقرة واحدة`}
            </p>
          </div>
          <Badge tone="success" pill>
            <span className="size-[8px] rounded-full bg-[var(--color-success)]" />
            يعمل الآن
          </Badge>
        </div>

        {isLoading ? (
          <LoadingState label="جاري تحضير القرارات…" />
        ) : decisions.length === 0 ? (
          <Card className="p-4">
            <EmptyState
              title="لا توجد قرارات مقترحة اليوم"
              description="سيظهر هنا أعلى ٣ توصيات يحدّدها الوكيل الذكي بناءً على درجات المخاطر."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2 lg:grid-cols-3">
            {decisions.map((b) => (
              <DecisionCard key={b.id} bond={b} onExecute={onExecute} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
