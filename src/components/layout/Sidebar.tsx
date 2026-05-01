"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems: Array<{ href: string; label: string }> = [
  { href: "/", label: "لوحة التحكم" },
  { href: "/customers", label: "العملاء" },
  { href: "/bonds", label: "الفواتير" },
  { href: "/reports", label: "التقارير" },
  { href: "/agent-logs", label: "نشاط الوكيل (Logs)" },
  { href: "/settings", label: "الإعدادات" },
];

export function Sidebar() {
  const pathname = usePathname();
  const company =
    process.env.NEXT_PUBLIC_COMPANY_NAME || "شركة الأمل للتجارة";
  const userName = process.env.NEXT_PUBLIC_USER_NAME || "عمر عبدالله";
  const userRole = process.env.NEXT_PUBLIC_USER_ROLE || "مدير التحصيل";

  return (
    <aside className="flex h-full w-[244px] shrink-0 flex-col gap-[22px] overflow-clip bg-[var(--color-bg-sidebar)] px-[18px] py-[22px]">
      <div className="flex flex-col gap-[2px] text-start">
        <p className="text-[22px] font-bold leading-tight text-[var(--color-fg)]">
          تحصيل
        </p>
        <p className="text-[11px] text-[var(--color-fg-subtle)]">
          منصّة التحصيل الذكية
        </p>
      </div>
      <div className="h-px w-full bg-[var(--color-border)]" />
      <nav className="flex min-h-0 flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-[8px] px-3 py-[11px] text-start transition-colors",
                active
                  ? "bg-[#898989]/95 text-white"
                  : "hover:bg-[var(--color-bg-card-soft)]/50"
              )}
            >
              <span
                className={cn(
                  "text-[13px]",
                  active
                    ? "font-semibold text-white"
                    : "font-normal text-[var(--color-fg-muted)]"
                )}
              >
                {item.label}
              </span>
              <span
                className={cn(
                  "size-[6px] shrink-0 rounded-full",
                  active ? "bg-[#e2efff]" : "bg-[var(--color-fg-faint)]"
                )}
              />
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-col gap-[4px] text-start">
        <p className="text-[12px] font-semibold text-[var(--color-fg-soft)]">
          {company}
        </p>
        <p className="text-[10px] text-[var(--color-fg-faint)]">
          {userName} · {userRole}
        </p>
      </div>
    </aside>
  );
}
