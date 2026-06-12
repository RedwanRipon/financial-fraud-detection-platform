# Cloud-Based Financial Fraud Detection Platform

A full-stack financial fraud detection platform that detects suspicious transactions
using a machine learning model (XGBoost) and explains each prediction in plain English
using an LLM.

> **Core rule:** the ML model **decides** whether a transaction is fraud; the LLM only
> **explains** that decision. The LLM never makes the fraud call.

## Tech Stack

| Layer        | Technology              |
|--------------|-------------------------|
| ML model     | XGBoost (Python)        |
| Backend      | FastAPI (Python)        |
| Frontend     | Next.js (TypeScript)    |
| API calls    | Axios                   |
| Database     | Azure PostgreSQL        |
| LLM          | LLM API (explanations)  |
| Deployment   | Azure Container Apps + Docker |

## Dataset

[Synthetic Financial Datasets for Fraud Detection (PaySim)](https://www.kaggle.com/datasets/ealaxi/paysim1)
— ~6.3M simulated mobile-money transactions. Fraud occurs only in `TRANSFER` and
`CASH_OUT` types and is extremely rare (~0.13%), so **recall and precision** matter
more than raw accuracy.

## Project Structure

```
ml/        Train the XGBoost model -> produces fraud_model.pkl
backend/   FastAPI server: serves predictions, DB, LLM explanations
frontend/  Next.js app: Overview, Single Txn, Batch, Analytics, Report pages
```

## Build Phases

1. **Phase 1 - The Brain:** Train the XGBoost model locally.
2. **Phase 2 - The Engine:** FastAPI backend with `/predict`.
3. **Phase 3 - The Face:** Next.js frontend connected via Axios.
4. **Phase 4 - Memory + Smarts:** PostgreSQL, batch upload, dashboards, LLM explanations.
5. **Phase 5 - Going Live:** Dockerize and deploy backend + frontend to the cloud.

## Pages

- **Overview** — KPIs, fraud trends, recent high-risk transactions
- **Single Transaction** — real-time fraud check for one transaction
- **Batch Upload** — CSV upload for bulk fraud detection
- **Fraud Analytics** — fraud patterns and insights
- **Explanation Report** — why a transaction was flagged
