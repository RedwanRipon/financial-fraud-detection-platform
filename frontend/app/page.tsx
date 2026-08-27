"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  Cell,
  LabelList,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  getOverview,
  getFraudByHour,
  getFraudByType,
  getTopHighRisk,
  type OverviewStats,
  type CategoryCount,
  type HighRiskItem,
} from "@/lib/api";

const ICONS = {
  doc: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  alert:
    "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
  shield:
    "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
  chart:
    "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  target:
    "M12 21a9 9 0 100-18 9 9 0 000 18z M12 15a3 3 0 100-6 3 3 0 000 6z",
  trend:
    "M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.94",
};

const BAR_COLORS = ["#ef4444", "#f97316", "#eab308", "#14b8a6", "#3b82f6", "#a855f7"];

function Icon({ path }: { path: string }) {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export default function OverviewPage() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [byHour, setByHour] = useState<CategoryCount[]>([]);
  const [byType, setByType] = useState<CategoryCount[]>([]);
  const [recent, setRecent] = useState<HighRiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [ov, bh, bt, hr] = await Promise.all([
          getOverview(),
          getFraudByHour(),
          getFraudByType(),
          getTopHighRisk({ risk_level: "High" }),
        ]);
        setOverview(ov);
        setByHour(bh);
        setByType(bt);
        setRecent(hr);
      } catch {
        setError("Could not load the dashboard. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="text-slate-500">Loading dashboard…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  const kpis = [
    { label: "Total Transactions", value: overview!.total_transactions.toLocaleString(), icon: ICONS.doc, bg: "bg-blue-50", fg: "text-blue-600" },
    { label: "Fraud Alerts", value: overview!.predicted_fraud.toLocaleString(), icon: ICONS.alert, bg: "bg-red-50", fg: "text-red-600" },
    { label: "High Risk", value: overview!.high_risk.toLocaleString(), icon: ICONS.shield, bg: "bg-orange-50", fg: "text-orange-500" },
    { label: "Avg Fraud Score", value: overview!.avg_fraud_probability.toFixed(2), icon: ICONS.chart, bg: "bg-teal-50", fg: "text-teal-600" },
    { label: "Model Recall", value: "0.99", icon: ICONS.target, bg: "bg-purple-50", fg: "text-purple-600" },
    { label: "F1 Score", value: "0.60", icon: ICONS.trend, bg: "bg-sky-50", fg: "text-sky-600" },
  ];

  const recentTop = recent.slice(0, 6);

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">
        Financial <span className="text-blue-600">Fraud</span> Detection Platform
      </h1>
      <p className="mt-1 text-slate-500">
        Real-time overview of fraud detection activity and model performance.
      </p>

      {/* ---------- KPI cards ---------- */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`flex h-11 w-11 items-center justify-center rounded-full ${k.bg} ${k.fg}`}>
              <Icon path={k.icon} />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{k.value}</p>
            <p className="text-xs text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      {/* ---------- Charts ---------- */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Fraud by Hour of Day</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={byHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" name="Fraud Count" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Fraud by Transaction Type</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="count" position="top" fontSize={12} />
                {byType.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ---------- Recent high-risk table ---------- */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <span className="text-red-500">⚠️</span> Recent High-Risk Transactions
          </h2>
          <Link href="/fraud-analytics" className="text-sm font-semibold text-blue-600 hover:underline">
            View All →
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                <th className="py-3">Transaction ID</th>
                <th className="py-3">Amount (USD)</th>
                <th className="py-3">Type</th>
                <th className="py-3">Probability</th>
                <th className="py-3">Status</th>
                <th className="py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentTop.map((t) => (
                <tr key={t.id} className="border-b border-slate-100">
                  <td className="py-3.5 font-medium text-slate-700">
                    TXN-{String(t.id).padStart(6, "0")}
                  </td>
                  <td className="py-3.5 text-slate-600">
                    ${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 text-slate-600">{t.transaction_type}</td>
                  <td className="py-3.5 font-semibold text-red-600">
                    {t.fraud_probability.toFixed(2)}
                  </td>
                  <td className="py-3.5">
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                      High Risk
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-500">
                    {t.created_at ? new Date(t.created_at).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
              {recentTop.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No high-risk transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
