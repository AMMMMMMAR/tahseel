"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApiError, api } from "@/lib/api";
import type { OcrBondPayload } from "@/lib/types";
import { toast } from "@/components/providers/ToastProvider";

const FIELD_LABELS: Record<keyof OcrBondPayload, string> = {
  "رقم_السند": "رقم السند",
  "تاريخ_الاصدار": "تاريخ الإصدار",
  "اسم_العميل": "اسم العميل",
  "المبلغ": "المبلغ",
  "رقم_الهاتف": "رقم الهاتف",
  "ايميل_العميل": "البريد الإلكتروني",
  "وصف_سبب_الصرف": "وصف / سبب الصرف",
};

const REQUIRED_FIELDS: Array<keyof OcrBondPayload> = [
  "رقم_السند",
  "تاريخ_الاصدار",
  "اسم_العميل",
  "المبلغ",
];

const EMPTY_FORM: OcrBondPayload = {
  "رقم_السند": "",
  "تاريخ_الاصدار": "",
  "اسم_العميل": "",
  "المبلغ": "",
  "رقم_الهاتف": "",
  "ايميل_العميل": "",
  "وصف_سبب_الصرف": "",
};

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState<OcrBondPayload>(EMPTY_FORM);
  const [extracted, setExtracted] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadBondImage(file),
    onSuccess: (res) => {
      setForm({ ...EMPTY_FORM, ...res.ocr_data });
      setExtracted(true);
      queryClient.invalidateQueries({ queryKey: ["bonds"] });
      toast({
        tone: "success",
        title: "تمّ استخراج بيانات السند بنجاح",
        description: "راجع البيانات بالأسفل ثم احفظ السند.",
      });
    },
    onError: (err: ApiError) => {
      toast({
        tone: "error",
        title: "فشل استخراج البيانات",
        description: err.detail || err.message,
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (payload: OcrBondPayload) => api.createBondFromOcr(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bonds"] });
      toast({
        tone: "success",
        title: "تم حفظ السند",
        description: "أُضيف السند إلى قاعدة البيانات وستظهر الأثر في لوحة التحكم.",
      });
      setForm(EMPTY_FORM);
      setExtracted(false);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err: ApiError) => {
      toast({
        tone: "error",
        title: "فشل حفظ السند",
        description: err.detail || err.message,
      });
    },
  });

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        tone: "error",
        title: "نوع ملف غير مدعوم",
        description: "يرجى اختيار صورة (JPG, PNG, WEBP).",
      });
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    uploadMutation.mutate(file);
  };

  const onSave = () => {
    const missing = REQUIRED_FIELDS.filter((k) => !form[k]?.toString().trim());
    if (missing.length > 0) {
      toast({
        tone: "error",
        title: "بيانات ناقصة",
        description: `يرجى إكمال: ${missing.map((k) => FIELD_LABELS[k]).join("، ")}`,
      });
      return;
    }
    saveMutation.mutate(form);
  };

  return (
    <>
      <PageHeader
        title="رفع سند جديد"
        subtitle="ارفع صورة السند ليقوم الذكاء الاصطناعي باستخراج البيانات تلقائيًا"
      />

      <div className="grid gap-[14px] lg:grid-cols-2">
        <Card className="flex flex-col gap-3 p-[18px]">
          <h2 className="text-start text-[16px] font-bold text-[var(--color-fg)]">
            ١. رفع الصورة
          </h2>
          <div
            className="flex h-[280px] flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-row)] p-4 text-center"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="معاينة السند"
                className="max-h-[240px] max-w-full rounded-md object-contain"
              />
            ) : (
              <>
                <p className="text-[14px] font-semibold text-[var(--color-fg)]">
                  اسحب الصورة هنا أو اضغط للاختيار
                </p>
                <p className="text-[12px] text-[var(--color-fg-subtle)]">
                  الصور المدعومة: JPG, PNG, WEBP
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "جاري الاستخراج…" : "اختيار صورة"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setForm(EMPTY_FORM);
                setExtracted(false);
                setPreviewUrl(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              disabled={uploadMutation.isPending}
            >
              مسح
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col gap-3 p-[18px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-start text-[16px] font-bold text-[var(--color-fg)]">
              ٢. مراجعة البيانات
            </h2>
            <span
              className={
                extracted
                  ? "text-[11px] font-semibold text-[var(--color-success)]"
                  : "text-[11px] text-[var(--color-fg-faint)]"
              }
            >
              {extracted ? "تم الاستخراج" : "في انتظار الصورة"}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {(Object.keys(FIELD_LABELS) as Array<keyof OcrBondPayload>).map(
              (field) => (
                <div key={field} className="flex flex-col gap-1 text-start">
                  <label className="text-[12px] text-[var(--color-fg-subtle)]">
                    {FIELD_LABELS[field]}
                    {REQUIRED_FIELDS.includes(field) ? (
                      <span className="text-[var(--color-danger-bright)]"> *</span>
                    ) : null}
                  </label>
                  <input
                    type="text"
                    dir="auto"
                    value={form[field] ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [field]: e.target.value }))
                    }
                    placeholder={
                      field === "تاريخ_الاصدار" ? "YYYY-MM-DD" : ""
                    }
                    className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-bg-row)] px-3 py-2 text-start text-[13px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-faint)] focus:border-[var(--color-brand)] focus:outline-none"
                  />
                </div>
              )
            )}
          </div>

          <div className="flex items-center justify-start pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={onSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "جاري الحفظ…" : "حفظ السند"}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
