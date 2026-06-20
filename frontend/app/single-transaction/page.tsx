"use client";

import { useState } from "react";
import { predictTransaction, type PredictionResponse } from "@/lib/api";

const initialForm = {
  transaction_type: "TRANSFER",
  amount: 9000,
  old_balance_origin: 9000,
  new_balance_origin: 0,
  old_balance_destination: 0,
  new_balance_destination: 0,
  transaction_hour: 3,
};

const numberFields = [
  { name: "amount", label: "Amount (USD)" },
  { name: "old_balance_origin", label: "Old Balance Origin" },
  { name: "new_balance_origin", label: "New Balance Origin" },
  { name: "old_balance_destination", label: "Old Balance Destination" },
  { name: "new_balance_destination", label: "New Balance Destination" },
  { name: "transaction_hour", label: "Transaction Hour (0-23)" },
];

export default function SingleTransactionPage() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "transaction_type" ? value : Number(value),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await predictTransaction(form);
      setResult(data);
    } catch {
      setError("Could not get a prediction. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold">Single Transaction Fraud Check</h1>
      <p className="mt-1 text-slate-600">
        Enter transaction details to get an AI-powered fraud prediction.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Transaction Type
              </label>
              <select
                name="transaction_type"
                value={form.transaction_type}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="TRANSFER">TRANSFER</option>
                <option value="CASH_OUT">CASH_OUT</option>
              </select>
            </div>

            {numberFields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-slate-700">
                  {field.label}
                </label>
                <input
                  type="number"
                  step="any"
                  name={field.name}
                  value={form[field.name as keyof typeof form]}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Predicting..." : "Predict Fraud"}
          </button>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </form>

        {/* Result */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Prediction Result</h2>

          {!result && !loading && (
            <p className="mt-4 text-slate-500">
              Submit a transaction to see the prediction.
            </p>
          )}

          {result && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Prediction</span>
                <span
                  className={`font-bold ${
                    result.prediction === "Fraud"
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {result.prediction}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Fraud Probability</span>
                <span className="font-semibold">
                  {(result.fraud_probability * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Risk Level</span>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    result.risk_level === "High"
                      ? "bg-red-100 text-red-700"
                      : result.risk_level === "Medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {result.risk_level}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}