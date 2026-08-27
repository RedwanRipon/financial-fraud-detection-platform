"use client";

import { useState } from "react";
import { batchPredict, type BatchResponse } from "@/lib/api";

// SVG path data for the summary icons (Heroicons outline style)
const ICONS = {
  doc: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  shield:
    "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  alert:
    "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  check: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
};

export default function BatchUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [lastProcessed, setLastProcessed] = useState<string | null>(null);

  function pickFile(f: File | null) {
    setFile(f);
    setResult(null);
    setError(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  }

  async function handleUpload() {
    if (!file) {
      setError("Please choose a CSV file first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await batchPredict(file);
      setResult(data);
      setLastProcessed(new Date().toLocaleString());
    } catch {
      setError("Upload failed. Check the CSV format and that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!result) return;
    const header = "row,transaction_type,amount,fraud_probability,prediction,risk_level";
    const rows = result.results.map(
      (r) =>
        `${r.row},${r.transaction_type},${r.amount},${r.fraud_probability},${r.prediction},${r.risk_level}`
    );
    const csv = [header, ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "fraud_predictions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const s = result?.summary;
  const summaryRows = [
    { label: "Total Uploaded", sub: "Total transactions in this batch", value: s?.total, color: "text-blue-600", iconBg: "bg-blue-50", iconColor: "text-blue-600", icon: ICONS.doc },
    { label: "Predicted Fraud", sub: "Transactions predicted as fraud", value: s?.predicted_fraud, color: "text-red-600", iconBg: "bg-red-50", iconColor: "text-red-600", icon: ICONS.shield },
    { label: "High Risk", sub: "High risk transactions", value: s?.high_risk, color: "text-red-600", iconBg: "bg-red-50", iconColor: "text-red-600", icon: ICONS.alert },
    { label: "Medium Risk", sub: "Medium risk transactions", value: s?.medium_risk, color: "text-orange-500", iconBg: "bg-orange-50", iconColor: "text-orange-500", icon: ICONS.alert },
    { label: "Low Risk", sub: "Low risk transactions", value: s?.low_risk, color: "text-green-600", iconBg: "bg-green-50", iconColor: "text-green-600", icon: ICONS.check },
  ];

  const topFive = result
    ? [...result.results].sort((a, b) => b.fraud_probability - a.fraud_probability).slice(0, 5)
    : [];

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Batch Transaction Upload</h1>
      <p className="mt-1 text-slate-500">
        Upload a batch of transactions to detect potential fraud and analyze risk.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ---------- Upload card ---------- */}
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Upload CSV File</h2>

          <label
            htmlFor="csv-input"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${
              dragging ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-blue-400"
            }`}
          >
            <div className="text-4xl text-blue-500">☁️</div>
            <p className="mt-3 font-medium text-slate-700">
              Drag and drop your CSV file here
            </p>
            <p className="mt-1 text-sm font-medium text-blue-600">or click to browse</p>
            <p className="mt-2 text-xs text-slate-400">
              {file ? file.name : "Supports .csv files up to 50MB"}
            </p>
            <input
              id="csv-input"
              type="file"
              accept=".csv"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>

          <p className="mt-4 text-sm text-slate-500">
            Sample File:{" "}
            <span className="font-medium text-slate-700">sample_clean_5000.csv</span>
          </p>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Processing…" : "▶ Run Fraud Detection"}
          </button>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        {/* ---------- Batch Summary card ---------- */}
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Batch Summary</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {summaryRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between py-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${row.iconBg} ${row.iconColor}`}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={row.icon}
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{row.label}</p>
                    <p className="text-xs text-slate-400">{row.sub}</p>
                  </div>
                </div>
                <span className={`text-xl font-bold ${row.color}`}>
                  {row.value != null ? row.value.toLocaleString() : "—"}
                </span>
              </div>
            ))}
          </div>
          {lastProcessed && (
            <p className="mt-3 text-xs text-slate-400">
              Last processed: {lastProcessed}
            </p>
          )}
        </div>
      </div>

      {/* ---------- High-risk table ---------- */}
      {result && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            High-Risk Transactions (Top 5)
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                  <th className="py-3">Transaction ID</th>
                  <th className="py-3">Type</th>
                  <th className="py-3">Amount (USD)</th>
                  <th className="py-3">Fraud Probability</th>
                  <th className="py-3">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {topFive.map((t) => (
                  <tr key={t.row} className="border-b border-slate-100">
                    <td className="py-3.5 font-medium text-slate-700">
                      TXN-{String(t.row).padStart(6, "0")}
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
              </tbody>
            </table>
          </div>

          <button
            onClick={handleDownload}
            className="mt-5 flex items-center gap-2 rounded-lg border border-blue-600 px-4 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
          >
            ⬇ Download Prediction Results
          </button>
          <p className="mt-2 text-xs text-slate-400">
            Downloads the full prediction results for all uploaded transactions.
          </p>
        </div>
      )}
    </div>
  );
}
