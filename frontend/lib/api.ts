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

// ---- Analytics ----
export interface OverviewStats {
  total_transactions: number;
  predicted_fraud: number;
  high_risk: number;
  avg_fraud_probability: number;
}

export interface CategoryCount {
  label: string;
  count: number;
}

export interface ProbabilityBucket {
  range: string;
  count: number;
}

export async function getOverview(): Promise<OverviewStats> {
  const response = await api.get<OverviewStats>("/analytics/overview");
  return response.data;
}

export async function getFraudByType(): Promise<CategoryCount[]> {
  const response = await api.get<CategoryCount[]>("/analytics/fraud-by-type");
  return response.data;
}

export async function getFraudByHour(): Promise<CategoryCount[]> {
  const response = await api.get<CategoryCount[]>("/analytics/fraud-by-hour");
  return response.data;
}

export async function getProbabilityDistribution(): Promise<ProbabilityBucket[]> {
  const response = await api.get<ProbabilityBucket[]>(
    "/analytics/probability-distribution"
  );
  return response.data;
}

// ---- Explanation Report ----
export interface PredictionListItem {
  id: number;
  transaction_type: string;
  amount: number;
  prediction: string;
  fraud_probability: number;
  risk_level: string;
}

export interface Factor {
  feature: string;
  importance: number;
}

export interface ExplanationResponse {
  transaction_id: number;
  transaction_type: string;
  amount: number;
  transaction_hour: number;
  prediction: string;
  fraud_probability: number;
  risk_level: string;
  top_factors: Factor[];
  llm_explanation: string;
  recommended_action: string;
}

export async function getRecentPredictions(): Promise<PredictionListItem[]> {
  const response = await api.get<PredictionListItem[]>("/predictions/recent");
  return response.data;
}

export async function getExplanation(id: number): Promise<ExplanationResponse> {
  const response = await api.get<ExplanationResponse>(`/explanation/${id}`);
  return response.data;
}