import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "danger" | "warn" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[var(--color-brand)] text-white hover:bg-[#2563eb]",
  danger: "bg-[var(--color-danger-bright)] text-white hover:bg-[#dc2626]",
  warn: "bg-[var(--color-orange)] text-white hover:bg-[#ea580c]",
  ghost:
    "bg-transparent text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-card-soft)]",
  outline:
    "border border-[var(--color-border)] bg-transparent text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-card-soft)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-[12px] rounded-md",
  md: "px-4 py-2.5 text-[13px] rounded-[8px]",
  lg: "px-5 py-3 text-[14px] rounded-[10px]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    />
  );
}
