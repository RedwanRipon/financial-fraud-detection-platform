"use client";

import { useState } from "react";
import { batchPredict, type BatchResponse } from "@/lib/api";

export default function BatchUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    setResult(null);
    setError(null);
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
    } catch {
      setError("Upload failed. Check the CSV format and that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  const summaryCards = result
    ? [
        { label: "Total Uploaded", value: result.summary.total, color: "text-slate-900" },
        { label: "Predicted Fraud", value: result.summary.predicted_fraud, color: "text-red-600" },
        { label: "High Risk", value: result.summary.high_risk, color: "text-red-600" },
        { label: "Medium Risk", value: result.summary.medium_risk, color: "text-yellow-600" },
        { label: "Low Risk", value: result.summary.low_risk, color: "text-green-600" },
      ]
    : [];

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold">Batch Transaction Upload</h1>
      <p className="mt-1 text-slate-600">
        Upload a CSV of transactions to detect potential fraud across the batch.
      </p>

      {/* Upload card */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <label
          htmlFor="csv-input"
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 px-6 py-10 text-center hover:border-blue-400"
        >
          <span className="text-sm font-medium text-blue-600">Click to browse</span>
          <span className="mt-1 text-xs text-slate-500">
            {file ? file.name : "Supports .csv files"}
          </span>
          <input
            id="csv-input"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        <button
          onClick={handleUpload}
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Processing..." : "Run Fraud Detection"}
        </button>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {result && (
        <>
          {/* Summary cards */}
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Top high-risk table */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Top High-Risk Transactions</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2">Row</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Fraud Probability</th>
                    <th className="py-2">Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {result.top_high_risk.map((t) => (
                    <tr key={t.row} className="border-b border-slate-100">
                      <td className="py-2">{t.row}</td>
                      <td className="py-2">{t.transaction_type}</td>
                      <td className="py-2">${t.amount.toLocaleString()}</td>
                      <td className="py-2 font-semibold text-red-600">
                        {(t.fraud_probability * 100).toFixed(1)}%
                      </td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
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
          </div>
        </>
      )}
    </div>
  );
}