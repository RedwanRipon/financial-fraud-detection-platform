"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  LabelList,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  getFraudByType,
  getFraudByHour,
  getProbabilityDistribution,
  getAmountVsProbability,
  getTopHighRisk,
  type CategoryCount,
  type ProbabilityBucket,
  type ScatterPoint,
  type HighRiskItem,
  type AnalyticsFilters,
} from "@/lib/api";

const BAR_COLORS = ["#ef4444", "#f97316", "#eab308", "#14b8a6", "#3b82f6", "#a855f7"];
const PAGE_SIZE = 5;

function ScatterDot(props: { cx?: number; cy?: number; payload?: ScatterPoint }) {
  const { cx, cy, payload } = props;
  const p = payload?.fraud_probability ?? 0;
  const r = Math.round(59 + p * 180);
  const g = Math.round(130 - p * 62);
  const b = Math.round(246 - p * 178);
  return <circle cx={cx} cy={cy} r={3} fill={`rgb(${r},${g},${b})`} fillOpacity={0.7} />;
}

// Build a compact page list like [1, "…", 4, 5, 6, "…", 20]
function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push("…");
  for (let p = start; p <= end; p++) out.push(p);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
}

export default function FraudAnalyticsPage() {
  const [byType, setByType] = useState<CategoryCount[]>([]);
  const [byHour, setByHour] = useState<CategoryCount[]>([]);
  const [distribution, setDistribution] = useState<ProbabilityBucket[]>([]);
  const [scatter, setScatter] = useState<ScatterPoint[]>([]);
  const [topRisk, setTopRisk] = useState<HighRiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filter controls (what the user is picking)
  const [txType, setTxType] = useState("");
  const [risk, setRisk] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [page, setPage] = useState(1);

  const loadData = useCallback(async (filters: AnalyticsFilters) => {
    setLoading(true);
    setError(null);
    try {
      const [bt, bh, dist, sc, tr] = await Promise.all([
        getFraudByType(filters),
        getFraudByHour(filters),
        getProbabilityDistribution(filters),
        getAmountVsProbability(filters),
        // the table focuses on high-risk by default (unless a risk level is chosen)
        getTopHighRisk({ ...filters, risk_level: filters.risk_level || "High" }),
      ]);
      setByType(bt);
      setByHour(bh);
      setDistribution(dist);
      setScatter(sc);
      setTopRisk(tr);
      setPage(1);
    } catch {
      setError("Could not load analytics. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData({});
  }, [loadData]);

  function applyFilters() {
    loadData({
      transaction_type: txType || undefined,
      risk_level: risk || undefined,
      days: dateRange ? Number(dateRange) : undefined,
    });
  }

  function resetFilters() {
    setTxType("");
    setRisk("");
    setDateRange("");
    loadData({});
  }

  const totalPages = Math.max(1, Math.ceil(topRisk.length / PAGE_SIZE));
  const pageRows = topRisk.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Fraud Analytics Dashboard</h1>
      <p className="mt-1 text-slate-500">
        Advanced insights into fraud patterns, probability distributions, and
        high-risk activity.
      </p>

      {/* ---------- Filter bar ---------- */}
      <div className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Date Range
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-700"
          >
            <option value="">All time</option>
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>
        <div className="min-w-[180px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Transaction Type
          </label>
          <select
            value={txType}
            onChange={(e) => setTxType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-700"
          >
            <option value="">All Transaction Types</option>
            <option value="TRANSFER">Transfer</option>
            <option value="CASH_OUT">Cash Out</option>
          </select>
        </div>
        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Risk Level
          </label>
          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-700"
          >
            <option value="">All Risk Levels</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <button
          onClick={applyFilters}
          className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Apply Filters
        </button>
        <button
          onClick={resetFilters}
          className="rounded-lg border border-slate-300 px-5 py-2 font-semibold text-slate-600 hover:bg-slate-50"
        >
          Reset
        </button>
      </div>

      {error && <p className="mt-4 text-red-600">{error}</p>}
      {loading && <p className="mt-4 text-slate-500">Loading analytics…</p>}

      {!loading && !error && (
        <>
          {/* ---------- Charts 2x2 ---------- */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Fraud by Transaction Type */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-slate-900">
                Fraud by Transaction Type
              </h2>
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

            {/* Fraud by Hour of Day */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-slate-900">
                Fraud by Hour of Day
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={byHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Fraud Count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Fraud Probability Distribution */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-slate-900">
                Fraud Probability Distribution
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                  <XAxis dataKey="range" fontSize={11} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="count" position="top" fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Amount vs Fraud Probability */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-slate-900">
                Amount vs Fraud Probability
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis
                    type="number"
                    dataKey="amount"
                    name="Amount"
                    scale="log"
                    domain={["auto", "auto"]}
                    tickFormatter={(v) =>
                      v >= 1_000_000
                        ? `${v / 1_000_000}M`
                        : v >= 1000
                        ? `${v / 1000}K`
                        : `${v}`
                    }
                    fontSize={11}
                  />
                  <YAxis
                    type="number"
                    dataKey="fraud_probability"
                    name="Probability"
                    domain={[0, 1]}
                    fontSize={11}
                  />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={scatter} shape={<ScatterDot />} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ---------- Top High-Risk table ---------- */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Top High-Risk Transactions
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                    <th className="py-3">Transaction ID</th>
                    <th className="py-3">Date &amp; Time</th>
                    <th className="py-3">Type</th>
                    <th className="py-3">Amount (USD)</th>
                    <th className="py-3">Fraud Probability</th>
                    <th className="py-3">Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100">
                      <td className="py-3.5 font-medium text-slate-700">
                        TXN-{String(t.id).padStart(6, "0")}
                      </td>
                      <td className="py-3.5 text-slate-500">
                        {t.created_at
                          ? new Date(t.created_at).toLocaleString()
                          : "—"}
                      </td>
                      <td className="py-3.5 text-slate-600">{t.transaction_type}</td>
                      <td className="py-3.5 text-slate-600">
                        ${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 font-semibold text-red-600">
                        {t.fraud_probability.toFixed(2)}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            t.risk_level === "High"
                              ? "bg-red-100 text-red-700"
                              : t.risk_level === "Medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {t.risk_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No transactions match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* pagination */}
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-500">
                {topRisk.length === 0
                  ? "No results"
                  : `Showing ${(page - 1) * PAGE_SIZE + 1} to ${Math.min(
                      page * PAGE_SIZE,
                      topRisk.length
                    )} of ${topRisk.length} results`}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  ‹
                </button>
                {pageWindow(page, totalPages).map((p, idx) =>
                  p === "…" ? (
                    <span key={`e${idx}`} className="px-1 text-slate-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-8 w-8 rounded-md text-sm font-medium transition ${
                        p === page
                          ? "bg-blue-600 text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
