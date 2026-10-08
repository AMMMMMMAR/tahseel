import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/40">
      <div className="flex flex-col gap-1 text-start">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-xs text-slate-400">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex items-center gap-3">{action}</div> : null}
    </header>
  );
}
