"use client";

import { useState } from "react";
import {
  predictTransaction,
  getExplanation,
  type PredictionResponse,
  type ExplanationResponse,
} from "@/lib/api";

const initialForm = {
  transaction_type: "TRANSFER",
  amount: 8750,
  old_balance_origin: 12342.1,
  new_balance_origin: 3592.1,
  old_balance_destination: 125,
  new_balance_destination: 9125,
  transaction_hour: 22,
};

const numberFields = [
  { name: "amount", label: "Amount (USD)" },
  { name: "old_balance_origin", label: "Old Balance Origin (USD)" },
  { name: "new_balance_origin", label: "New Balance Origin (USD)" },
  { name: "old_balance_destination", label: "Old Balance Destination (USD)" },
  { name: "new_balance_destination", label: "New Balance Destination (USD)" },
  { name: "transaction_hour", label: "Transaction Hour (0–23)" },
];

export default function SingleTransactionPage() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    const isText = name === "transaction_type";
    setForm((prev) => ({ ...prev, [name]: isText ? value : Number(value) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setExplanation(null);
    try {
      const res = await predictTransaction({
        transaction_type: form.transaction_type,
        amount: form.amount,
        old_balance_origin: form.old_balance_origin,
        new_balance_origin: form.new_balance_origin,
        old_balance_destination: form.old_balance_destination,
        new_balance_destination: form.new_balance_destination,
        transaction_hour: form.transaction_hour,
      });
      setResult(res);

      // Fetch the AI explanation for this saved prediction
      if (res.id != null) {
        setExplaining(true);
        try {
          const exp = await getExplanation(res.id);
          setExplanation(exp);
        } catch {
          /* explanation is optional; ignore if it fails */
        } finally {
          setExplaining(false);
        }
      }
    } catch {
      setError("Could not get a prediction. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  const isFraud = result?.prediction === "Fraud";
  const riskBadge =
    result?.risk_level === "High"
      ? "bg-red-500 text-white"
      : result?.risk_level === "Medium"
      ? "bg-yellow-400 text-yellow-900"
      : "bg-green-500 text-white";

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">
        Single Transaction Fraud Check
      </h1>
      <p className="mt-1 text-slate-500">
        Enter transaction details to get an AI-powered fraud prediction and
        explanation.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ---------- FORM ---------- */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
        >
          <h2 className="text-xl font-bold text-slate-900">Transaction Details</h2>
          <p className="mt-1 text-sm text-slate-500">
            Provide accurate transaction information for best prediction results.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Transaction type */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Transaction Type
              </label>
              <select
                name="transaction_type"
                value={form.transaction_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="TRANSFER">Transfer (E-Wallet)</option>
                <option value="CASH_OUT">Cash Out</option>
              </select>
            </div>

            {numberFields.map((f) => (
              <div key={f.name}>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  {f.label}
                </label>
                <input
                  type="number"
                  step="any"
                  name={f.name}
                  value={form[f.name as keyof typeof form]}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            ))}

          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Predicting…" : "🛡️ Predict Fraud"}
          </button>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <p className="mt-4 text-center text-xs text-slate-400">
            All inputs are used solely for fraud detection.
          </p>
        </form>

        {/* ---------- RESULTS ---------- */}
        <div className="space-y-6">
          {/* Prediction card */}
          <div
            className={`rounded-2xl border p-7 shadow-sm ${
              !result
                ? "border-slate-200 bg-white"
                : isFraud
                ? "border-red-200 bg-red-50"
                : "border-green-200 bg-green-50"
            }`}
          >
            {!result ? (
              <p className="text-slate-400">
                Submit a transaction to see the prediction, explanation, and
                contributing factors.
              </p>
            ) : (
              <div className="flex items-center gap-6">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${
                    isFraud ? "bg-red-500" : "bg-green-500"
                  }`}
                >
                  {isFraud ? "❗" : "✓"}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-500">Prediction</p>
                  <p
                    className={`text-2xl font-bold ${
                      isFraud ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {result.prediction}
                  </p>
                  <div className="mt-3 flex items-center gap-8">
                    <div>
                      <p className="text-xs text-slate-500">Fraud Probability</p>
                      <p
                        className={`text-xl font-bold ${
                          isFraud ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {(result.fraud_probability * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Risk Level</p>
                      <span
                        className={`mt-1 inline-block rounded-md px-3 py-1 text-sm font-semibold ${riskBadge}`}
                      >
                        {result.risk_level}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LLM Explanation */}
          {result && (
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <span className="text-purple-500">✦</span> LLM Explanation
              </h2>
              <p className="mt-3 leading-relaxed text-slate-600">
                {explaining
                  ? "Generating explanation…"
                  : explanation?.llm_explanation ??
                    "No explanation available."}
              </p>
            </div>
          )}

          {/* Top Contributing Factors */}
          {explanation && explanation.top_factors.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Top Contributing Factors
              </h2>
              <div className="mt-5 space-y-4">
                {explanation.top_factors.map((f) => (
                  <div key={f.feature} className="flex items-center gap-4">
                    <span className="w-40 shrink-0 text-sm text-slate-600">
                      {f.feature}
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-red-500"
                        style={{ width: `${Math.min(f.importance * 100, 100)}%` }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-sm font-medium text-slate-700">
                      {f.importance.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
