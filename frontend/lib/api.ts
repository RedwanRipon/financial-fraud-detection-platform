import axios from "axios";

// One configured axios client for the whole app
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

// The shape we SEND (matches the backend's TransactionRequest)
export interface TransactionRequest {
  transaction_type: string;
  amount: number;
  old_balance_origin: number;
  new_balance_origin: number;
  old_balance_destination: number;
  new_balance_destination: number;
  transaction_hour: number;
}

// The shape we RECEIVE (matches the backend's PredictionResponse)
export interface PredictionResponse {
  prediction: string;
  fraud_probability: number;
  risk_level: string;
}

export async function predictTransaction(
  data: TransactionRequest
): Promise<PredictionResponse> {
  const response = await api.post<PredictionResponse>("/predict", data);
  return response.data;
}

export interface BatchSummary {
  total: number;
  predicted_fraud: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
}

export interface BatchTransactionResult {
  row: number;
  transaction_type: string;
  amount: number;
  fraud_probability: number;
  prediction: string;
  risk_level: string;
}

export interface BatchResponse {
  summary: BatchSummary;
  top_high_risk: BatchTransactionResult[];
}

export async function batchPredict(file: File): Promise<BatchResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<BatchResponse>("/batch-predict", formData);
  return response.data;
}