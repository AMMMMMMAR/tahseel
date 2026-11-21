"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GithubIcon } from "@/components/icons/GithubIcon";
import {
  Cpu,
  Eye,
  GitBranch,
  MessageSquare,
  Radio,
  X,
} from "lucide-react";

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ArchitectureModal({ isOpen, onClose }: ArchitectureModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <Card className="flex flex-col w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 bg-slate-900 border-slate-800 shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 left-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          title="إغلاق"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col gap-1 text-start pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Cpu size={20} />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              معمارية نظام تحصيل المالي (System Architecture)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            نظام مفتوح المصدر لأتمتة دورة التحصيل المالي المبني على محرك الرؤية الحاسوبية ومعمارية LangGraph
          </p>
        </div>

        {/* 4 Pipeline Pillars */}
        <div className="grid gap-3.5 sm:grid-cols-2 my-5">
          {/* Pillar 1: Multi-Modal OCR */}
          <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 text-start flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sky-400">
              <Eye size={18} />
              <h3 className="text-sm font-bold text-white">١. استخراج المستندات (OCR)</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              محرك رؤية حاسوبية يعتمد على <span className="text-sky-300 font-mono">Gemini 2.5 Flash</span> لاستخراج بيانات السندات والفواتير العربية مع معالجة الأرقام والتواريخ وتحديد نسبة الثقة آلياً.
            </p>
          </div>

          {/* Pillar 2: LangGraph Agent */}
          <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 text-start flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <GitBranch size={18} />
              <h3 className="text-sm font-bold text-white">٢. محرك اتخاذ القرار (LangGraph)</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              رسم بياني حركي للحالات (<span className="text-emerald-300 font-mono">StateGraph</span>) مكوّن من 4 مراحل متسلسلة: تقييم المخاطر ← اختيار الإجراء ← إرسال التنبيه ← إصدار التقرير.
            </p>
          </div>

          {/* Pillar 3: Delivery Channels */}
          <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 text-start flex flex-col gap-2">
            <div className="flex items-center gap-2 text-teal-400">
              <MessageSquare size={18} />
              <h3 className="text-sm font-bold text-white">٣. قنوات الإشعار المباشرة (WhatsApp & Email)</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              توليد وإرسال خطابات المطالبات والتذكيرات الرسمية عبر قنوات التواصل المباشرة (WhatsApp Business و Resend) وفق سلّم التصعيد المعتمد.
            </p>
          </div>

          {/* Pillar 4: Live WebSocket Tracing */}
          <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 text-start flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-400">
              <Radio size={18} />
              <h3 className="text-sm font-bold text-white">٤. بث ومراقبة الأحداث المباشرة (WebSockets)</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              بث حي في الوقت الفعلي لمراحل دورة التحصيل وتحديث شاشات الإشراف لحظة بلحظة.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800 text-xs">
          <a
            href="https://github.com/AMMMMMMAR/tahseel"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition font-medium"
          >
            <GithubIcon className="size-4" />
            <span>عرض المستودع على GitHub</span>
          </a>

          <Button variant="primary" size="sm" onClick={onClose} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5">
            فهمت، إغلاق
          </Button>
        </div>
      </Card>
    </div>
  );
}
