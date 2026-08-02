"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  getOverview,
  getFraudByType,
  getFraudByHour,
  getProbabilityDistribution,
  type OverviewStats,
  type CategoryCount,
  type ProbabilityBucket,
} from "@/lib/api";

export default function FraudAnalyticsPage() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [byType, setByType] = useState<CategoryCount[]>([]);
  const [byHour, setByHour] = useState<CategoryCount[]>([]);
  const [distribution, setDistribution] = useState<ProbabilityBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [ov, bt, bh, dist] = await Promise.all([
          getOverview(),
          getFraudByType(),
          getFraudByHour(),
          getProbabilityDistribution(),
        ]);
        setOverview(ov);
        setByType(bt);
        setByHour(bh);
        setDistribution(dist);
      } catch {
        setError("Could not load analytics. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <p className="text-slate-500">Loading analytics…</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  const cards = [
    { label: "Total Transactions", value: overview?.total_transactions ?? 0, color: "text-slate-900" },
    { label: "Predicted Fraud", value: overview?.predicted_fraud ?? 0, color: "text-red-600" },
    { label: "High Risk", value: overview?.high_risk ?? 0, color: "text-orange-600" },
    {
      label: "Avg Fraud Score",
      value: ((overview?.avg_fraud_probability ?? 0)).toFixed(3),
      color: "text-blue-600",
    },
  ];

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold">Fraud Analytics Dashboard</h1>
      <p className="mt-1 text-slate-600">
        Insights into fraud patterns from all stored predictions.
      </p>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className={`mt-1 text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Fraud by Type */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Fraud by Transaction Type</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fraud by Hour */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Fraud by Hour of Day</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={byHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Probability Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Fraud Probability Distribution</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="range" fontSize={11} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
