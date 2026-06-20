import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

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
        <main className="min-h-screen flex-1 p-8">{children}</main>
      </body>
    </html>
  );
}