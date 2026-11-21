import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "تحصيل · نظام أتمتة وإدارة التحصيل المالي",
  description:
    "منظومة Tahseel لإدارة ومتابعة تحصيل الديون والالتزامات المالية وفق سياسات ديناميكية ونماذج تدقيق ذكية.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${ibmPlexArabic.variable} h-full`}>
      <body className="min-h-screen bg-[var(--color-bg)] text-[var(--color-fg)] antialiased font-sans selection:bg-emerald-500 selection:text-white">
        <QueryProvider>
          {children}
          <ToastProvider />
        </QueryProvider>
      </body>
    </html>
  );
}
