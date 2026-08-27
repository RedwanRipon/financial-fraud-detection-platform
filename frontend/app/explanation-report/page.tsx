"use client";

import { useEffect, useState } from "react";
import {
  getRecentPredictions,
  getExplanation,
  type PredictionListItem,
  type ExplanationResponse,
} from "@/lib/api";

const ICONS = {
  shield:
    "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
  target:
    "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  alert:
    "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
  calendar:
    "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
  card: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z",
  dollar:
    "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

const FEATURE_LABELS: Record<string, string> = {
  balance_change_orig: "Balance Change (Origin)",
  balance_change_dest: "Balance Change (Dest.)",
  newbalanceOrig: "New Balance (Origin)",
  newbalanceDest: "New Balance (Dest.)",
  oldbalanceOrg: "Old Balance (Origin)",
  oldbalanceDest: "Old Balance (Dest.)",
  amount: "Transaction Amount",
  type_encoded: "Transaction Type",
  transaction_hour: "Transaction Hour",
};

function Icon({ path }: { path: string }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export default function ExplanationReportPage() {
  const [list, setList] = useState<PredictionListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [report, setReport] = useState<ExplanationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    getRecentPredictions()
      .then((rows) => {
        setList(rows);
        const urlId = new URLSearchParams(window.location.search).get("id");
        if (rows.length > 0 && !urlId) setSelectedId(rows[0].id);
      })
      .catch(() => setError("Could not load predictions. Is the backend running?"));
  }, []);

  // If opened with ?id=… (e.g. from a notification), auto-generate that report
  useEffect(() => {
    const urlId = new URLSearchParams(window.location.search).get("id");
    if (urlId) {
      const id = Number(urlId);
      setSelectedId(id);
      generate(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate(id: number | null = selectedId) {
    if (id === null) return;
    setLoading(true);
    setError(null);
    setReport(null);
    setReviewed(false);
    try {
      setReport(await getExplanation(id));
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setError(
          `No transaction found with ID ${id}. Pick one from the dropdown or try a different ID.`
        );
      } else {
        setError("Something went wrong generating the report. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const isFraud = report?.prediction === "Fraud";
  const maxImp = report ? Math.max(...report.top_factors.map((f) => f.importance), 0.01) : 1;

  const summaryRows = report
    ? [
        {
          icon: ICONS.shield,
          label: "Prediction",
          value: (
            <span className={isFraud ? "font-bold text-red-600" : "font-bold text-green-600"}>
              {report.prediction}
            </span>
          ),
        },
        {
          icon: ICONS.target,
          label: "Fraud Probability",
          value: (
            <span className="font-bold text-red-600">
              {report.fraud_probability.toFixed(2)} ({(report.fraud_probability * 100).toFixed(0)}%)
            </span>
          ),
        },
        {
          icon: ICONS.alert,
          label: "Risk Level",
          value: (
            <span
              className={`rounded-md px-3 py-1 text-sm font-semibold ${
                report.risk_level === "High"
                  ? "bg-red-500 text-white"
                  : report.risk_level === "Medium"
                  ? "bg-yellow-400 text-yellow-900"
                  : "bg-green-500 text-white"
              }`}
            >
              {report.risk_level}
            </span>
          ),
        },
        {
          icon: ICONS.calendar,
          label: "Date & Time",
          value: report.created_at ? new Date(report.created_at).toLocaleString() : "—",
        },
        { icon: ICONS.card, label: "Transaction Type", value: report.transaction_type },
        {
          icon: ICONS.dollar,
          label: "Amount (USD)",
          value: `$ ${report.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        },
      ]
    : [];

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Explanation Report</h1>
      <p className="mt-1 text-slate-500">
        Understand why a transaction was flagged as potentially fraudulent.
      </p>

      {/* ---------- Selector bar ---------- */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="font-semibold text-slate-700">Transaction ID</label>
        <select
          value={list.some((p) => p.id === selectedId) ? (selectedId ?? "") : ""}
          onChange={(e) => setSelectedId(Number(e.target.value))}
          className="min-w-[240px] flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-slate-700"
        >
          <option value="" disabled>
            Top high-risk transactions…
          </option>
          {list.map((p) => (
            <option key={p.id} value={p.id}>
              TXN-{String(p.id).padStart(6, "0")} · {p.transaction_type} · $
              {p.amount.toLocaleString()} · {(p.fraud_probability * 100).toFixed(0)}%
            </option>
          ))}
        </select>

        <span className="text-sm text-slate-400">or enter any ID</span>
        <input
          type="number"
          min={1}
          value={selectedId ?? ""}
          onChange={(e) =>
            setSelectedId(e.target.value ? Number(e.target.value) : null)
          }
          placeholder="e.g. 4237"
          className="w-32 rounded-lg border border-slate-300 px-3 py-2.5 text-slate-700"
        />

        <button
          onClick={() => generate()}
          disabled={loading || selectedId === null}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          📄 {loading ? "Generating…" : "Generate Report"}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {report && (
        <>
          {/* ---------- Summary + Factors ---------- */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Prediction Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Prediction Summary</h2>
              <div className="mt-5 divide-y divide-slate-100">
                {summaryRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Icon path={row.icon} />
                      </div>
                      <span className="text-slate-600">{row.label}</span>
                    </div>
                    <div className="text-right text-slate-800">{row.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Contributing Factors */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Top Contributing Factors</h2>
              <table className="mt-5 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-400">
                    <th className="pb-3 font-medium">Rank</th>
                    <th className="pb-3 font-medium">Feature</th>
                    <th className="pb-3 font-medium">Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {report.top_factors.map((f, i) => (
                    <tr key={f.feature} className="border-t border-slate-100">
                      <td className="py-3 font-semibold text-slate-700">{i + 1}</td>
                      <td className="py-3 text-slate-600">
                        {FEATURE_LABELS[f.feature] ?? f.feature}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-1 rounded-full bg-slate-100">
                            <div
                              className="h-2 rounded-full bg-red-500"
                              style={{ width: `${(f.importance / maxImp) * 100}%` }}
                            />
                          </div>
                          <span className="w-10 text-right font-medium text-slate-700">
                            {f.importance.toFixed(2)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ---------- LLM Explanation ---------- */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <span className="text-purple-500">✦</span> LLM Explanation
            </h2>
            <p className="mt-3 leading-relaxed text-slate-600">{report.llm_explanation}</p>
          </div>

          {/* ---------- Recommended Action ---------- */}
          <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-7 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white">
                <Icon path={ICONS.alert} />
              </div>
              <div>
                <h2 className="font-bold text-red-800">Recommended Action</h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-red-700">
                  {report.recommended_action}
                </p>
              </div>
            </div>
            <button
              onClick={() => setReviewed(true)}
              disabled={reviewed}
              className="shrink-0 rounded-lg border border-red-400 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-70"
            >
              {reviewed ? "✓ Review Initiated" : "🛡 Initiate Manual Review"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
