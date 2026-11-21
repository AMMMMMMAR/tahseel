import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-[var(--color-bg)]">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6 lg:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
