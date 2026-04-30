import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "high" | "medium" | "low" | "success" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  high: "bg-[var(--color-danger)] text-[var(--color-danger-soft)]",
  medium: "bg-[var(--color-warn)] text-white",
  low: "bg-[var(--color-info)] text-[var(--color-success-soft)]",
  success: "bg-[var(--color-success)] text-white",
  neutral: "bg-[var(--color-bg-action)] text-[var(--color-fg-subtle)]",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  pill?: boolean;
}

export function Badge({
  className,
  tone = "neutral",
  pill = false,
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center px-[10px] py-[5px] text-[11px] font-semibold leading-none whitespace-nowrap",
        pill ? "rounded-full" : "rounded-[5px]",
        toneClasses[tone],
        className
      )}
    />
  );
}
