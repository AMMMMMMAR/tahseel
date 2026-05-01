"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { api } from "@/lib/api";
import { formatDateAr, formatNumberAr } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Mail, Clock, ShieldAlert, Bot, Activity, FileText } from "lucide-react";

export default function AgentLogsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["agent-logs"],
    queryFn: () => api.getAgentLogs(50),
    refetchInterval: 30000, // Refresh every 30s
  });

  return (
    <>
      <PageHeader
        title="نشاط الوكيل (AI Agent Logs)"
        subtitle="سجل مفصل لكل الإجراءات التلقائية والتنبيهات التي اتخذها الوكيل الذكي"
        action={
          <Badge tone="brand" pill>
            <span className="size-[8px] rounded-full bg-[var(--color-brand)] animate-pulse" />
            يعمل في الخلفية
          </Badge>
        }
      />

      <div className="flex flex-col gap-[14px]">
        {isLoading ? (
          <LoadingState label="جاري تحميل سجل النشاط..." />
        ) : isError ? (
          <Card className="p-4">
            <ErrorState
              title="تعذّر تحميل السجل"
              description={(error as any)?.detail || error.message}
              onRetry={() => refetch()}
            />
          </Card>
        ) : !data?.logs || data.logs.length === 0 ? (
          <Card className="p-4">
            <EmptyState
              title="لا يوجد أي نشاط للوكيل بعد"
              description="بمجرد أن يقوم الوكيل باتخاذ أي إجراء (مثل إرسال تذكيرات) سيظهر هنا."
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {data.logs.map((log) => {
              const dateObj = new Date(log.executed_at);
              const time = dateObj.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
              const dateStr = formatDateAr(log.executed_at);
              
              let title = "إجراء غير معروف";
              let description = "";
              let badgeText = "";
              let badgeTone: "brand" | "danger" | "success" | "warning" | "info" = "info";
              let icon = <Bot size={24} />;
              let iconBg = "bg-[#f0f5ff]";
              let iconColor = "text-[var(--color-brand)]";

              if (log.action_type === "reminder_sent") {
                const clientName = log.bonds?.clients?.name || "عميل غير معروف";
                const bondNum = log.bonds?.bond_number || "سند غير معروف";
                const amount = formatNumberAr(log.bonds?.amount || 0);
                
                title = `إرسال رسالة تذكير إلى ${clientName}`;
                description = `قام الوكيل بإرسال رسالة إلى ${log.details?.to} بخصوص الفاتورة ${bondNum} بمبلغ ${amount} ر.س. التأخير كان ${log.details?.days_overdue} يوماً.`;
                badgeText = log.details?.tone || "تنبيه";
                badgeTone = log.details?.days_overdue > 7 ? "danger" : "warning";
                icon = <Mail size={24} />;
                iconBg = "bg-[#fff0f0]";
                iconColor = "text-[#dc2626]";
                
              } else if (log.action_type === "analyze_risks") {
                title = "تحليل وتحديث مخاطر العملاء";
                description = log.details?.message || `تم تقييم وتحديث درجات المخاطر لـ ${log.details?.updated_count || 0} سند/فاتورة.`;
                badgeText = "تقييم دوري";
                badgeTone = "info";
                icon = <Activity size={24} />;
                iconBg = "bg-[#f0f9ff]";
                iconColor = "text-[#0284c7]";
                
              } else if (log.action_type === "find_high_risk") {
                title = "اكتشاف حالات ذات مخاطر عالية";
                description = log.details?.message || `تم اكتشاف ${log.details?.high_risk_count || 0} حالات ذات مخاطر عالية تتطلب تدخلاً.`;
                badgeText = "خطر عالٍ";
                badgeTone = "danger";
                icon = <ShieldAlert size={24} />;
                iconBg = "bg-[#fff0f0]";
                iconColor = "text-[#dc2626]";
                
              } else if (log.action_type === "daily_report_generated") {
                title = "إنشاء التقرير اليومي للإدارة";
                description = `إجمالي الديون: ${log.details?.["إجمالي_الديون_النشطة"] || "0"} | المتأخرات: ${log.details?.["المتأخرات"] || "0"} | المحصل هذا الشهر: ${log.details?.["المحصّل_هذا_الشهر"] || "0"}.`;
                badgeText = "مكتمل";
                badgeTone = "success";
                icon = <FileText size={24} />;
                iconBg = "bg-[#f0fdf4]";
                iconColor = "text-[#16a34a]";
              }

              return (
                <Card key={log.id} className="overflow-hidden">
                  <div className="flex flex-col sm:flex-row gap-4 p-4 items-start sm:items-center">
                    {/* Icon */}
                    <div className={`flex size-[48px] shrink-0 items-center justify-center rounded-full ${iconBg} ${iconColor}`}>
                      {icon}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col gap-1 text-start">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-bold text-[var(--color-fg)]">
                          {title}
                        </h3>
                        {badgeText && (
                          <Badge tone={badgeTone} pill>
                            {badgeText}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[13px] text-[var(--color-fg-subtle)] leading-relaxed">
                        {description}
                      </p>
                      
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-[12px] text-[var(--color-fg-faint)]">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} />
                          <span>{time} — {dateStr}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Bot size={14} />
                          <span>إجراء آلي (Agent)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
