"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastContextValue {
  notify: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      notify: ({ title }) => {
        if (typeof window !== "undefined") console.warn("[toast]", title);
      },
    };
  }
  return ctx;
}

let externalNotify: ((toast: Omit<Toast, "id">) => void) | null = null;
export function toast(input: Omit<Toast, "id">): void {
  externalNotify?.(input);
}

export function ToastProvider() {
  const [items, setItems] = useState<Toast[]>([]);

  const notify = useCallback((toast: Omit<Toast, "id">) => {
    counter += 1;
    const id = counter;
    setItems((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  useEffect(() => {
    externalNotify = notify;
    return () => {
      externalNotify = null;
    };
  }, [notify]);

  return (
    <ToastContext.Provider value={{ notify }}>
      <div className="pointer-events-none fixed bottom-6 left-6 z-50 flex flex-col gap-3">
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto min-w-[260px] max-w-[360px] rounded-xl border px-4 py-3 text-start shadow-lg backdrop-blur-sm ${
              t.tone === "success"
                ? "border-[var(--color-success)]/40 bg-[#0a1f12] text-[var(--color-success-soft)]"
                : t.tone === "error"
                  ? "border-[var(--color-danger)]/50 bg-[#1a0a0a] text-[var(--color-danger-soft)]"
                  : "border-[var(--color-border)] bg-[var(--color-bg-card-soft)] text-[var(--color-fg)]"
            }`}
          >
            <p className="text-[13px] font-bold">{t.title}</p>
            {t.description ? (
              <p className="mt-1 text-[12px] text-[var(--color-fg-subtle)]">
                {t.description}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
