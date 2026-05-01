import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="flex min-h-[70px] flex-wrap items-center justify-between gap-4 py-2">
      <div className="flex flex-col gap-1 text-start">
        <h1 className="text-[26px] font-bold leading-tight text-[var(--color-fg)]">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-[12px] text-[var(--color-fg-subtle)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex items-center">{action}</div> : null}
    </header>
  );
}
