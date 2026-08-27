"use client";

import { useEffect, useState } from "react";
import {
  getRecentPredictions,
  getExplanation,
  type PredictionListItem,
  type ExplanationResponse,
} from "@/lib/api";

export default function ExplanationReportPage() {
  const [list, setList] = useState<PredictionListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [report, setReport] = useState<ExplanationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRecentPredictions()
      .then((rows) => {
        setList(rows);
        if (rows.length > 0) setSelectedId(rows[0].id);
      })
      .catch(() => setError("Could not load predictions. Is the backend running?"));
  }, []);

  async function handleGenerate() {
    if (selectedId === null) return;
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const data = await getExplanation(selectedId);
      setReport(data);
    } catch {
      setError("Could not generate the explanation. Is the OpenAI key set in .env?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold">Explanation Report</h1>
      <p className="mt-1 text-slate-600">
        Understand why a transaction was flagged as potentially fraudulent.
      </p>

      {/* Selector */}
      <div className="mt-6 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex-1 min-w-[260px]">
          <label className="block text-sm font-medium text-slate-700">
            Select a transaction
          </label>
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {list.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.id} · {p.transaction_type} · ${p.amount.toLocaleString()} ·{" "}
                {(p.fraud_probability * 100).toFixed(0)}% · {p.prediction}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || selectedId === null}
          className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Generating…" : "Generate Report"}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {report && (
        <div className="mt-6 space-y-6">
          {/* Summary + factors */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Prediction Summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <Row label="Prediction">
                  <span
                    className={
                      report.prediction === "Fraud"
                        ? "font-bold text-red-600"
                        : "font-bold text-green-600"
                    }
                  >
                    {report.prediction}
                  </span>
                </Row>
                <Row label="Fraud Probability">
                  {(report.fraud_probability * 100).toFixed(1)}%
                </Row>
                <Row label="Risk Level">{report.risk_level}</Row>
                <Row label="Type">{report.transaction_type}</Row>
                <Row label="Amount">${report.amount.toLocaleString()}</Row>
                <Row label="Hour">{report.transaction_hour}:00</Row>
              </dl>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Top Contributing Factors</h2>
              <div className="mt-4 space-y-3">
                {report.top_factors.map((f) => (
                  <div key={f.feature}>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{f.feature}</span>
                      <span className="font-medium">{f.importance}</span>
                    </div>
                    <div className="mt-1 h-2 rounded bg-slate-100">
                      <div
                        className="h-2 rounded bg-red-500"
                        style={{ width: `${Math.min(f.importance * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LLM explanation */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">LLM Explanation</h2>
            <p className="mt-3 leading-relaxed text-slate-700">
              {report.llm_explanation}
            </p>
          </div>

          {/* Recommended action */}
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-800">Recommended Action</h2>
            <p className="mt-2 leading-relaxed text-red-700">
              {report.recommended_action}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
