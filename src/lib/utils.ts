import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

const numberLocale = "ar-SA-u-nu-arab";
const dateLocale = "ar-SA-u-ca-gregory-nu-arab";

export function formatNumberAr(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? Number(value.replace(/[^\d.-]/g, "")) : value;
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat(numberLocale, {
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatCurrencyAr(value: number | string | null | undefined): string {
  return formatNumberAr(value);
}

export function formatDateAr(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(dateLocale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

export function daysBetween(from: string | Date, to: string | Date = new Date()): number {
  const a = typeof from === "string" ? new Date(from) : from;
  const b = typeof to === "string" ? new Date(to) : to;
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function getInitial(name: string | null | undefined): string {
  if (!name) return "؟";
  const trimmed = name.trim();
  if (!trimmed) return "؟";
  return trimmed.charAt(0);
}
