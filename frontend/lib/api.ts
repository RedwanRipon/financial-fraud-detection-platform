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