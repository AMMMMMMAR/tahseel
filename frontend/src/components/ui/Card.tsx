import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardVariant = "solid" | "soft" | "row";

const variants: Record<CardVariant, string> = {
  solid: "bg-slate-900/70 border border-slate-800/80 shadow-md backdrop-blur-md",
  soft: "bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm",
  row: "bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/70 transition-colors",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

export function Card({ className, variant = "solid", ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-2xl",
        variants[variant],
        className
      )}
    />
  );
}
