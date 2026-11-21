"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { useBonds } from "@/hooks/useBonds";
import { api } from "@/lib/api";
import { aggregateClients } from "@/lib/bonds";
import { AggregatedClient } from "@/lib/types";
import { formatCurrencyAr, formatDateAr, formatNumberAr } from "@/lib/utils";
import {
  CheckCircle2,
  Layers,
  Settings2,
  Star,
  X,
} from "lucide-react";

export default function CustomersPage() {
  const [query, setQuery] = useState("");
  const [editingClient, setEditingClient] = useState<AggregatedClient | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [agreementToast, setAgreementToast] = useState<string | null>(null);

  // Form states for agreement modal
  const [modalTier, setModalTier] = useState<"standard" | "vip" | "strict">("standard");
  const [modalGrace, setModalGrace] = useState<number>(0);
  const [modalInstallments, setModalInstallments] = useState<number | null>(null);
  const [modalMaxLevel, setModalMaxLevel] = useState<number | null>(null);
  const [modalNotes, setModalNotes] = useState<string>("");

  const { data, isLoading, isError, error, refetch } = useBonds({
    status: "all",
    limit: 500,
  });

  const clients = useMemo(
    () => aggregateClients(data?.bonds ?? []),
    [data?.bonds]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return clients;
    const q = query.trim().toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q)
    );
  }, [clients, query]);

  const openAgreementModal = (c: AggregatedClient) => {
    setEditingClient(c);
    setModalTier(c.policy_tier || "standard");
    setModalGrace(c.custom_grace_days || 0);
    setModalInstallments(c.preferred_installments ?? null);
    setModalMaxLevel(c.max_escalation_level ?? null);
    setModalNotes(c.custom_notes || "");
  };

  const handleSaveAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient?.id) return;

    setIsSaving(true);
    try {
      await api.updateClientPolicy(editingClient.id, {
        policy_tier: modalTier,
        custom_grace_days: modalGrace,
        preferred_installments: modalInstallments,
        max_escalation_level: modalMaxLevel,
        custom_notes: modalNotes,
      });

      setAgreementToast(`تم تحديث اتفاقية وشروط السداد للعميل ${editingClient.name}`);
      setTimeout(() => setAgreementToast(null), 4000);
      setEditingClient(null);
      refetch();
    } catch (err) {
      console.error("Failed to update client agreement:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="العملاء واتفاقيات السداد"
        subtitle={`عدد العملاء: ${formatNumberAr(clients.length)} — تخصيص شروط الدفع وجدولة الأقساط لكل عميل على حدة`}
        action={
          agreementToast && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium animate-fadeIn">
              <CheckCircle2 size={14} />
              <span>{agreementToast}</span>
            </div>
          )
        }
      />

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            placeholder="ابحث باسم العميل، البريد، أو الهاتف…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full max-w-[320px] rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition"
          />
          <p className="text-xs text-slate-400">
            انقر على زر <span className="text-emerald-400 font-semibold">«تعديل الاتفاقية»</span> لتخصيص عدد الأقساط والمهلة لكل عميل
          </p>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState
            title="تعذّر تحميل العملاء"
            description={error?.detail || error?.message}
            onRetry={() => refetch()}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="لا يوجد عملاء بعد"
            description="ارفع أوّل سند ليتم إنشاء العميل تلقائيًا."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-separate border-spacing-y-2">
              <thead>
                <tr className="text-xs font-medium text-slate-400">
                  <th className="px-3.5 py-2 text-start font-medium">العميل</th>
                  <th className="px-3.5 py-2 text-start font-medium">اتفاقية السداد والتقسيط</th>
                  <th className="px-3.5 py-2 text-start font-medium">عدد السندات</th>
                  <th className="px-3.5 py-2 text-start font-medium">المستحقّ (ر.س)</th>
                  <th className="px-3.5 py-2 text-start font-medium">إجمالي التعامل (ر.س)</th>
                  <th className="px-3.5 py-2 text-start font-medium">عدد المتأخرات</th>
                  <th className="px-3.5 py-2 text-start font-medium">آخر تعامل</th>
                  <th className="px-3.5 py-2 text-start font-medium">درجة الخطر</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const tier = c.policy_tier || "standard";
                  const inst = c.preferred_installments;
                  const grace = c.custom_grace_days || 0;

                  return (
                    <tr
                      key={`${c.id ?? c.name}`}
                      className="bg-slate-900/40 hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="rounded-s-xl px-3.5 py-3 align-middle border-y border-s border-slate-800/70">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={c.name} />
                          <div className="flex min-w-0 flex-col text-start">
                            <p className="truncate text-xs font-semibold text-white">
                              {c.name}
                            </p>
                            <p className="truncate text-[11px] text-slate-400">
                              {c.email || c.phone || "—"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Agreement & Custom Terms Column */}
                      <td className="px-3.5 py-3 align-middle border-y border-slate-800/70">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-1 text-start">
                            <div className="flex items-center gap-1.5">
                              {tier === "vip" ? (
                                <Badge tone="success" pill>
                                  <Star size={10} className="fill-emerald-400 ml-1" />
                                  VIP استراتيجي
                                </Badge>
                              ) : tier === "strict" ? (
                                <Badge tone="danger" pill>
                                  صارم ومشدد
                                </Badge>
                              ) : (
                                <Badge tone="neutral" pill>
                                  قياسي (عام)
                                </Badge>
                              )}

                              {inst ? (
                                <span className="px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-400 text-[10px] font-bold border border-sky-500/20">
                                  {inst} دفعات
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">
                                  3 دفعات (افتراضي)
                                </span>
                              )}
                            </div>

                            {grace > 0 && (
                              <span className="text-[10px] text-amber-400 font-medium">
                                +{grace} يوم مهلة سماح خاصة
                              </span>
                            )}
                          </div>

                          {c.id && (
                            <button
                              type="button"
                              onClick={() => openAgreementModal(c)}
                              title="تعديل شروط الاتفاقية لهذا العميل"
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
                            >
                              <Settings2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="tabular px-3.5 py-3 align-middle text-xs text-slate-200 border-y border-slate-800/70">
                        {formatNumberAr(c.bonds_count)}
                      </td>
                      <td className="tabular px-3.5 py-3 align-middle text-xs font-semibold whitespace-nowrap text-white border-y border-slate-800/70">
                        {formatCurrencyAr(c.outstanding_amount)}
                      </td>
                      <td className="tabular px-3.5 py-3 align-middle text-xs whitespace-nowrap text-slate-400 border-y border-slate-800/70">
                        {formatCurrencyAr(c.total_amount)}
                      </td>
                      <td className="tabular px-3.5 py-3 align-middle text-xs text-rose-400 font-semibold border-y border-slate-800/70">
                        {formatNumberAr(c.overdue_count)}
                      </td>
                      <td className="tabular px-3.5 py-3 align-middle text-xs whitespace-nowrap text-slate-400 border-y border-slate-800/70">
                        {formatDateAr(c.last_bond_date)}
                      </td>
                      <td className="rounded-e-xl px-3.5 py-3 align-middle border-y border-e border-slate-800/70">
                        <RiskBadge score={c.risk_score} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Customer Custom Agreement Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-start">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers size={18} className="text-emerald-400" />
                  اتفاقية وشروط السداد المخصصة للعميل
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تحديد شروط التقسيط والمهل المبرمة في العقد مع:{" "}
                  <span className="text-white font-semibold">{editingClient.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAgreement} className="flex flex-col gap-4">
              {/* Field 1: Tier */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  فئة العلاقة والتصنيف التعاقدي
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "standard", label: "قياسي (المعاملة الافتراضية)" },
                    { key: "vip", label: "كبار العملاء (VIP - تواصل تنفيذي)" },
                    { key: "strict", label: "تحصيل صارم (متابعة قانونية حازمة)" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setModalTier(t.key as "standard" | "vip" | "strict")}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                        modalTier === t.key
                          ? "bg-emerald-500/10 border-emerald-500 text-white"
                          : "bg-slate-800/50 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Custom Installments (The core feature requested by user) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  خطة التقسيط المتفق عليها (عدد الدفعات الشهرية)
                </label>
                <select
                  value={modalInstallments ?? "default"}
                  onChange={(e) => {
                    const val = e.target.value;
                    setModalInstallments(val === "default" ? null : Number(val));
                  }}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="default">حسب سياسة الشركة العامة (افتراضي)</option>
                  <option value="2">دفعتان (شهرين — 2 أقساط)</option>
                  <option value="3">3 دفعات (3 أشهر — ربع سنوي)</option>
                  <option value="4">4 دفعات (4 أشهر)</option>
                  <option value="6">6 دفعات (نصف سنوي — 6 أقساط)</option>
                  <option value="12">12 دفعة (شهرياً لسنة كاملة)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  عند إرسال التنبيه العاجل، سيقسم الوكيل المبلغ الإجمالي على هذا العدد تحديداً في نص الرسالة.
                </p>
              </div>

              {/* Field 3: Grace Days */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  مهلة السماح التعاقدية الإضافية (بالأيام)
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={modalGrace}
                  onChange={(e) => setModalGrace(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder="0"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  عدد الأيام بعد تاريخ الاستحقاق التي لا يبدأ الوكيل فيها أي إجراء تصعيدي مراعاةً للاتفاق.
                </p>
              </div>

              {/* Field 4: Max Escalation Cap */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  سقف التصعيد المسموح به لهذا العميل
                </label>
                <select
                  value={modalMaxLevel ?? "none"}
                  onChange={(e) => {
                    const val = e.target.value;
                    setModalMaxLevel(val === "none" ? null : Number(val));
                  }}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="none">كامل التصعيد المسموح في النظام (حتى المستوى 4)</option>
                  <option value="3">سقف المستوى 3 (تنبيه عاجل وجدولة فقط — منع ناجز)</option>
                  <option value="2">سقف المستوى 2 (متابعة محاسبية ودية ورسمية فقط)</option>
                </select>
              </div>

              {/* Field 5: Custom Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  بنود أو ملاحظات الاتفاقية المكتوبة
                </label>
                <textarea
                  rows={2}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="مثال: تم الاتفاق على السداد في 25 من كل شهر بموجب الملحق التجاري رقم 4."
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition disabled:opacity-50"
                >
                  {isSaving ? "جاري الحفظ..." : "حفظ واعتماد شروط العميل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
