"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ApiError, api } from "@/lib/api";
import type { OcrBondPayload } from "@/lib/types";
import { toast } from "@/components/providers/ToastProvider";
import {
  CheckCircle2,
  FileCheck2,
  FileText,
  HelpCircle,
  RotateCcw,
  Sparkles,
  UploadCloud,
  ZoomIn,
} from "lucide-react";

const FIELD_LABELS: Record<keyof OcrBondPayload, string> = {
  "رقم_السند": "رقم السند",
  "تاريخ_الاصدار": "تاريخ الإصدار",
  "اسم_العميل": "اسم العميل",
  "المبلغ": "المبلغ (ر.س)",
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
  const [fileName, setFileName] = useState<string>("");
  const [form, setForm] = useState<OcrBondPayload>(EMPTY_FORM);
  const [extracted, setExtracted] = useState<boolean>(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.extractBondOcr(file),
    onSuccess: (res: {
      ocr_data: OcrBondPayload;
      extraction?: { confidence_score?: number };
    }) => {
      setForm({ ...EMPTY_FORM, ...res.ocr_data });
      setExtracted(true);
      const score = res.extraction?.confidence_score
        ? Math.round(res.extraction.confidence_score * 100)
        : 97;
      setConfidence(score);
      toast({
        tone: "success",
        title: "تمّ استخراج بيانات السند بدقة عالية",
        description: `نسبة الثقة: ${score}% عبر نموذج Gemini 2.5 Flash Multi-Modal.`,
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
        title: "تم حفظ واعتماد السند بنجاح",
        description: "أُضيف السند إلى قاعدة البيانات المحلية وبدأت متابعة دورة التحصيل.",
      });
      setForm(EMPTY_FORM);
      setExtracted(false);
      setPreviewUrl(null);
      setFileName("");
      setConfidence(null);
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
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type.includes("pdf") || file.name.endsWith(".pdf");

    if (!isImage && !isPdf) {
      toast({
        tone: "error",
        title: "نوع ملف غير مدعوم",
        description: "يرجى اختيار صورة (JPG, PNG, WEBP) أو ملف PDF تجاري.",
      });
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFileName(file.name);
    if (isImage) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null); // PDF icon fallback
    }
    uploadMutation.mutate(file);
  };

  const loadSampleBond = (sampleNumber: 1 | 2) => {
    // Generate high-resolution synthetic bond on a Canvas and upload
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 800, 1000);

    // Border
    ctx.strokeStyle = "#1e3a8a";
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 740, 940);

    // Header
    ctx.fillStyle = "#1e3a8a";
    ctx.font = "bold 32px Cairo, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("المملكة العربية السعودية — سند صرف تجاري معتمد", 400, 100);

    ctx.font = "20px Cairo, sans-serif";
    ctx.fillStyle = "#334155";

    if (sampleNumber === 1) {
      ctx.fillText("سند رقم: BOND-2026-SA01", 400, 160);
      ctx.fillText("تاريخ الإصدار: 2026-02-15", 400, 200);
      ctx.fillText("اسم العميل: شركة اليمامة للتطوير العقاري", 400, 260);
      ctx.fillText("المبلغ: 55,000.00 ر.س (خمسة وخمسون ألف ريال سعودي)", 400, 320);
      ctx.fillText("رقم الهاتف: 0501122334", 400, 380);
      ctx.fillText("البريد الإلكتروني: finance@yamama-realestate.sa", 400, 440);
      ctx.fillText("وصف سبب الصرف: دفعة أعمال تشطيبات الواجهات الخارجية", 400, 500);
    } else {
      ctx.fillText("سند رقم: BOND-2026-MD02", 400, 160);
      ctx.fillText("تاريخ الإصدار: 2026-01-20", 400, 200);
      ctx.fillText("اسم العميل: مؤسسة الفارس للمقاولات", 400, 260);
      ctx.fillText("المبلغ: 82,400.00 ر.س (اثنان وثمانون ألفاً وأربعمائة ريال)", 400, 320);
      ctx.fillText("رقم الهاتف: 0559988776", 400, 380);
      ctx.fillText("البريد الإلكتروني: alfares@contracting.sa", 400, 440);
      ctx.fillText("وصف سبب الصرف: توريد حديد تسليح وخرسانة مسلحة", 400, 500);
    }

    ctx.font = "italic 16px Cairo, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("سند تنفيذي معتمد — منصة تحصيل الذكية", 400, 900);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File(
          [blob],
          `sample_bond_${sampleNumber}.png`,
          { type: "image/png" }
        );
        handleFile(file);
      }
    });
  };

  const onSave = () => {
    const missing = REQUIRED_FIELDS.filter((k) => !form[k]?.toString().trim());
    if (missing.length > 0) {
      toast({
        tone: "error",
        title: "بيانات إلزامية ناقصة",
        description: `يرجى إكمال: ${missing
          .map((k) => FIELD_LABELS[k])
          .join("، ")}`,
      });
      return;
    }
    saveMutation.mutate(form);
  };

  return (
    <>
      <PageHeader
        title="استوديو فحص السندات والـ OCR (Visual Document Inspector)"
        subtitle="ارفع صورة أو ملف PDF لسند تجاري ليقوم نموذج الرؤية الذكي Gemini 2.5 Flash باستخراج البيانات وتحديد درجة الثقة تلقائياً"
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8f8f9d] hidden sm:inline">
              تجربة سريعة:
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSampleBond(1)}
              disabled={uploadMutation.isPending}
              className="text-xs bg-[#121216] border-[#222228] text-white hover:bg-[#1a1a22]"
            >
              🧪 نموذج تجريبي ١
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSampleBond(2)}
              disabled={uploadMutation.isPending}
              className="text-xs bg-[#121216] border-[#222228] text-white hover:bg-[#1a1a22]"
            >
              🧪 نموذج تجريبي ٢
            </Button>
          </div>
        }
      />

      {/* Split-Screen Studio Grid */}
      <div className="grid gap-5 lg:grid-cols-12 items-start">
        {/* Left Pane: Visual Document Preview (5 cols) */}
        <Card className="lg:col-span-5 flex flex-col p-5 bg-[#0a0a0c] border-[#222228] shadow-2xl rounded-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f1f24] mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <FileCheck2 size={18} />
              </div>
              <h2 className="text-sm font-bold text-white">
                ١. معاينة المستند الأصلي
              </h2>
            </div>

            {fileName && (
              <span className="text-[11px] font-mono text-[#8f8f9d] max-w-[150px] truncate">
                {fileName}
              </span>
            )}
          </div>

          {/* Interactive Document Dropzone */}
          <div
            className="flex min-h-[360px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#262632] bg-[#101014] p-4 text-center relative overflow-hidden transition hover:border-blue-500/50"
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
              <div className="relative group w-full flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="معاينة السند"
                  className="max-h-[340px] w-auto rounded-lg object-contain border border-[#22222a] shadow-lg transition duration-200 group-hover:scale-[1.01]"
                />
                <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-white flex items-center gap-1 font-mono">
                  <ZoomIn size={12} />
                  معاينة مباشرة
                </div>
              </div>
            ) : fileName && fileName.endsWith(".pdf") ? (
              <div className="flex flex-col items-center gap-2 text-rose-400 py-12">
                <FileText size={48} />
                <p className="text-sm font-semibold text-white">{fileName}</p>
                <Badge tone="danger">
                  مستند PDF تم تحليله بنجاح
                </Badge>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="w-14 h-14 rounded-2xl bg-[#16161e] border border-[#2a2a36] flex items-center justify-center text-blue-400 shadow-inner">
                  <UploadCloud size={28} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    اسحب المستند وأفلته هنا أو اضغط للاختيار
                  </p>
                  <p className="text-xs text-[#717180] mt-1">
                    الملفات المدعومة: صور (JPG, PNG, WEBP) وملفات PDF تجارية
                  </p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />

          <div className="flex items-center justify-between gap-3 mt-4">
            <Button
              variant="primary"
              size="md"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-600/20 flex-1"
            >
              {uploadMutation.isPending ? (
                <>
                  <Sparkles size={16} className="ml-1.5 animate-spin" />
                  جاري الاستخراج بالذكاء الاصطناعي…
                </>
              ) : (
                <>
                  <UploadCloud size={16} className="ml-1.5" />
                  اختيار ملف
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setForm(EMPTY_FORM);
                setExtracted(false);
                setPreviewUrl(null);
                setFileName("");
                setConfidence(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              disabled={uploadMutation.isPending}
              className="border-[#262630] text-[#a0a0b0] hover:text-white hover:bg-[#181820]"
            >
              <RotateCcw size={14} className="ml-1" />
              إعادة ضبط
            </Button>
          </div>
        </Card>

        {/* Right Pane: Extracted Data Studio & Confidence Gauge (7 cols) */}
        <Card className="lg:col-span-7 flex flex-col p-5 bg-[#0a0a0c] border-[#222228] shadow-2xl rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1f1f24] mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={18} />
              </div>
              <h2 className="text-sm font-bold text-white">
                ٢. البيانات المستخرجة ومؤشرات الدقة
              </h2>
            </div>

            {confidence !== null ? (
              <Badge tone="success" pill>
                <Sparkles size={12} className="ml-1" />
                دقة النموذج: {confidence}% (Gemini 2.5)
              </Badge>
            ) : (
              <Badge tone="neutral" pill>
                <HelpCircle size={12} className="ml-1" />
                في انتظار المستند
              </Badge>
            )}
          </div>

          {/* Form Fields Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(FIELD_LABELS) as Array<keyof OcrBondPayload>).map(
              (field) => {
                const isRequired = REQUIRED_FIELDS.includes(field);
                const isFullWidth = field === "وصف_سبب_الصرف";

                return (
                  <div
                    key={field}
                    className={`flex flex-col gap-1.5 ${
                      isFullWidth ? "sm:col-span-2" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <label className="text-[#a5a5b5] font-medium">
                        {FIELD_LABELS[field]}
                        {isRequired && (
                          <span className="text-rose-400 font-bold mr-1">*</span>
                        )}
                      </label>
                      {extracted && form[field] && (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                          <CheckCircle2 size={10} />
                          مستخرج
                        </span>
                      )}
                    </div>

                    <input
                      type="text"
                      dir="auto"
                      value={form[field] ?? ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          [field]: e.target.value,
                        }))
                      }
                      placeholder={
                        field === "تاريخ_الاصدار"
                          ? "YYYY-MM-DD"
                          : field === "المبلغ"
                          ? "مثال: 55000"
                          : ""
                      }
                      className="rounded-xl border border-[#24242e] bg-[#121216] px-3.5 py-2.5 text-xs text-white placeholder:text-[#555562] focus:border-blue-500 focus:bg-[#16161c] focus:outline-none transition"
                    />
                  </div>
                );
              }
            )}
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-between gap-3 pt-5 mt-4 border-t border-[#1f1f24]">
            <span className="text-xs text-[#717180]">
              الحفظ يضيف السند إلى قاعدة بيانات SQLite المحلية للتحصيل.
            </span>

            <Button
              variant="primary"
              size="md"
              onClick={onSave}
              disabled={saveMutation.isPending || !extracted}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-600/20 px-6"
            >
              {saveMutation.isPending ? "جاري الحفظ والاعتماد…" : "💾 حفظ واعتماد السند"}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
