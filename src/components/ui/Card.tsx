import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "solid" | "soft" | "row";

const variants: Record<CardVariant, string> = {
  solid: "bg-[var(--color-bg-card)]",
  soft: "bg-[var(--color-bg-card-soft)]",
  row: "bg-[var(--color-bg-row)]",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

export function Card({ className, variant = "solid", ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-[14px]",
        variants[variant],
        className
      )}
    />
  );
}
