"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart3,
  FileText,
  LayoutDashboard,
  Settings,
  UploadCloud,
  Users,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const navItems: NavItem[] = [
  { href: "/", label: "لوحة المتابعة", icon: LayoutDashboard },
  { href: "/bonds", label: "السندات والفواتير", icon: FileText },
  { href: "/customers", label: "سجل العملاء", icon: Users },
  { href: "/reports", label: "التقارير المالية", icon: BarChart3 },
  { href: "/upload", label: "فحص سند جديد (OCR)", icon: UploadCloud },
  { href: "/agent-logs", label: "سجل القرارات", icon: Activity },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex h-screen w-64 shrink-0 flex-col justify-between border-l border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-4 py-6 sticky top-0">
      {/* Brand Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 px-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-bold text-lg shadow-lg shadow-emerald-500/20">
            ت
          </div>
          <div className="flex flex-col text-start">
            <span className="text-lg font-bold text-white tracking-tight">
              تحصيل
            </span>
            <span className="text-[11px] text-slate-400">
              منظومة تحصيل المالية
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200",
                  active
                    ? "bg-emerald-500/15 text-emerald-400 font-semibold shadow-sm border border-emerald-500/30"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 font-normal"
                )}
              >
                <Icon
                  size={18}
                  className={cn(
                    "shrink-0 transition-colors",
                    active ? "text-emerald-400" : "text-slate-500"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="flex items-center justify-between rounded-xl bg-slate-900/40 border border-slate-800/60 px-3.5 py-2.5 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-slate-300">النظام المحلي</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">v1.0.0</span>
      </div>
    </aside>
  );
}
