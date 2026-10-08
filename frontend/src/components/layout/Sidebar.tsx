"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Activity,
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
  { href: "/upload", label: "فحص سند جديد (OCR)", icon: UploadCloud },
  { href: "/agent-logs", label: "سجل القرارات", icon: Activity },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const company =
    process.env.NEXT_PUBLIC_COMPANY_NAME || "شركة الأمل للتجارة";
  const userName = process.env.NEXT_PUBLIC_USER_NAME || "عمر عبدالله";
  const userRole = process.env.NEXT_PUBLIC_USER_ROLE || "مدير التحصيل";

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
              إدارة التحصيل الذكية
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

      {/* User Footer Profile */}
      <div className="flex items-center gap-3 rounded-xl bg-slate-900/50 border border-slate-800/60 p-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          {userName.slice(0, 2)}
        </div>
        <div className="flex flex-col min-w-0 text-start">
          <p className="truncate text-xs font-semibold text-slate-200">
            {userName}
          </p>
          <p className="truncate text-[11px] text-slate-500">
            {company}
          </p>
        </div>
      </div>
    </aside>
  );
}
