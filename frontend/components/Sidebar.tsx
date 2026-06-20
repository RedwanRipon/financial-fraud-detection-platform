"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Overview", href: "/" },
  { label: "Single Transaction", href: "/single-transaction" },
  { label: "Batch Upload", href: "/batch-upload" },
  { label: "Fraud Analytics", href: "/fraud-analytics" },
  { label: "Explanation Report", href: "/explanation-report" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 min-h-screen flex-col bg-slate-900 text-slate-100">
      <div className="border-b border-slate-700 px-6 py-6">
        <h1 className="text-lg font-bold leading-tight">
          Financial Fraud
          <br />
          Detection Platform
        </h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-700 px-6 py-4 text-xs text-slate-400">
        <p>Model Version v1.0.0</p>
        <p className="mt-1 text-green-400">● All systems operational</p>
      </div>
    </aside>
  );
}