"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/components/providers/ToastProvider";
import { ArchitectureModal } from "@/components/modals/ArchitectureModal";
import { GithubIcon } from "@/components/icons/GithubIcon";
import {
  Code2,
  Database,
  ExternalLink,
  HelpCircle,
  Sparkles,
  Zap,
} from "lucide-react";

export function OpenSourceBanner() {
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const seedMutation = useMutation({
    mutationFn: () => api.seedDemoData(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["bonds"] });
      queryClient.invalidateQueries({ queryKey: ["agent-logs"] });
      toast({
        tone: "success",
        title: "تم شحن البيانات التجريبية بنجاح",
        description: `أُضيفت ${res.created_count} سندات وفواتير تجريبية واقعية جاهزة للفحص والتحصيل.`,
      });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "فشل شحن البيانات التجريبية";
      toast({
        tone: "error",
        title: "خطأ أثناء شحن البيانات",
        description: msg,
      });
    },
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-md text-xs">
        {/* Left: Open Source Tag & Stack */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="flex items-center gap-1.5 font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
            <Code2 size={14} />
            <span>مشروع مفتوح المصدر</span>
          </span>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
            <span className="text-slate-300">LangGraph</span>
            <span>•</span>
            <span className="text-slate-300">Gemini 2.5</span>
            <span>•</span>
            <span className="text-slate-300">FastAPI</span>
            <span>•</span>
            <span className="text-slate-300">Next.js 16</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Architecture explainer button */}
          <button
            type="button"
            onClick={() => setIsArchModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white transition font-medium text-xs border border-slate-700/60"
            title="استعراض بنية ومعمارية الوكيل الذكي"
          >
            <HelpCircle size={14} className="text-sky-400" />
            <span>معمارية النظام</span>
          </button>

          {/* 1-Click Demo Seed Button */}
          <button
            type="button"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 transition font-medium text-xs border border-emerald-500/30"
            title="إعادة تعبئة 5 سندات تجريبية واقعية"
          >
            <Database size={13} className={seedMutation.isPending ? "animate-spin" : ""} />
            <span>{seedMutation.isPending ? "جاري الشحن…" : "شحن بيانات تجريبية"}</span>
          </button>

          {/* GitHub Repo Link */}
          <a
            href="https://github.com/AMMMMMMAR/tahseel"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition font-semibold text-xs border border-slate-700"
            title="الانتقال إلى مستودع المشروع على GitHub"
          >
            <GithubIcon className="size-3.5" />
            <span className="hidden sm:inline">GitHub</span>
            <span className="text-amber-400">⭐</span>
          </a>
        </div>
      </div>

      <ArchitectureModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />
    </>
  );
}
