import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 overflow-x-auto">
        <div className="mx-auto flex w-full max-w-[1060px] flex-col gap-[22px] px-[28px] py-[26px]">
          {children}
        </div>
      </main>
    </div>
  );
}
