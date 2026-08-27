"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTopHighRisk, type HighRiskItem } from "@/lib/api";

export default function TopBar() {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [alerts, setAlerts] = useState<HighRiskItem[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    getTopHighRisk({ risk_level: "High" })
      .then((rows) => {
        const a = rows.slice(0, 6);
        setAlerts(a);
        setUnread(a.length);
      })
      .catch(() => setAlerts([]));
  }, []);

  function closeAll() {
    setNotifOpen(false);
    setUserOpen(false);
  }

  return (
    <header className="relative flex items-center justify-end gap-5 border-b border-slate-200 bg-white px-8 py-3.5">
      {/* Backdrop to close dropdowns when clicking outside */}
      {(notifOpen || userOpen) && (
        <div className="fixed inset-0 z-10" onClick={closeAll} />
      )}

      {/* ---------- Notifications ---------- */}
      <div className="relative z-20">
        <button
          onClick={() => {
            setNotifOpen((o) => {
              if (!o) setUnread(0); // opening marks all as read
              return !o;
            });
            setUserOpen(false);
          }}
          className="relative text-slate-500 hover:text-slate-700"
          aria-label="Notifications"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="font-semibold text-slate-800">Notifications</p>
              <p className="text-xs text-slate-400">{alerts.length} high-risk alerts</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {alerts.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-slate-400">No alerts</p>
              )}
              {alerts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    closeAll();
                    router.push(`/explanation-report?id=${a.id}`);
                  }}
                  className="flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
                >
                  <span className="mt-0.5 text-red-500">🚨</span>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      High-risk {a.transaction_type} — TXN-{String(a.id).padStart(6, "0")}
                    </p>
                    <p className="text-xs text-slate-500">
                      ${a.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ·{" "}
                      {(a.fraud_probability * 100).toFixed(0)}% fraud probability
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-blue-600">
                      View explanation →
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---------- Help (static) ---------- */}
      <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 17.25h.007v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      {/* ---------- Admin user ---------- */}
      <div className="relative z-20">
        <button
          onClick={() => {
            setUserOpen((o) => !o);
            setNotifOpen(false);
          }}
          className="flex items-center gap-2"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500 text-sm font-bold text-white">
            AD
          </div>
          <span className="text-sm font-medium text-slate-700">Admin User</span>
          <svg
            className={`h-4 w-4 text-slate-400 transition-transform ${userOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {userOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="font-semibold text-slate-800">Admin User</p>
              <p className="text-xs text-slate-400">admin@frauddetection.app</p>
            </div>
            <button onClick={closeAll} className="block w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50">
              👤 Profile
            </button>
            <button onClick={closeAll} className="block w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50">
              ⚙️ Settings
            </button>
            <button onClick={closeAll} className="block w-full border-t border-slate-100 px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">
              ⏻ Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
