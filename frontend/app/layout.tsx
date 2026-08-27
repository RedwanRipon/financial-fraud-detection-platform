import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export const metadata: Metadata = {
  title: "Financial Fraud Detection Platform",
  description: "Detect and explain fraudulent financial transactions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex bg-slate-50 text-slate-900">
        <Sidebar />
        <main className="flex min-h-screen flex-1 flex-col">
          <TopBar />
          {/* Page content */}
          <div className="flex-1 p-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
