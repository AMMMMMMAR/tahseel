import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LoadingState({
  label = "جاري التحميل…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-center text-[var(--color-fg-subtle)]",
        className
      )}
    >
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-brand)]" />
      <p className="text-[13px]">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      {icon ? (
        <div className="rounded-full bg-[var(--color-bg-action)] p-3 text-[var(--color-fg-subtle)]">
          {icon}
        </div>
      ) : null}
      <p className="text-[15px] font-bold text-[var(--color-fg)]">{title}</p>
      {description ? (
        <p className="max-w-md text-[12px] leading-relaxed text-[var(--color-fg-subtle)]">
          {description}
        </p>
      ) : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "حدث خطأ أثناء تحميل البيانات",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="rounded-full bg-[var(--color-danger)]/15 p-3 text-[var(--color-danger-bright)]">
        <span className="text-lg font-bold">!</span>
      </div>
      <p className="text-[15px] font-bold text-[var(--color-fg)]">{title}</p>
      {description ? (
        <p className="max-w-md text-[12px] leading-relaxed text-[var(--color-fg-subtle)]">
          {description}
        </p>
      ) : null}
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-1 rounded-md border border-[var(--color-border)] bg-transparent px-4 py-2 text-[12px] font-semibold text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-card-soft)]"
        >
          إعادة المحاولة
        </button>
      ) : null}
    </div>
  );
}
