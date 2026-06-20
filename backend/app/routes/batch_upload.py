import io

import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.prediction_service import predict_dataframe
from app.models.schemas import (
    BatchResponse,
    BatchSummary,
    BatchTransactionResult,
)

router = APIRouter()

REQUIRED_COLUMNS = [
    "type",
    "amount",
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest",
]


@router.post("/batch-predict", response_model=BatchResponse)
async def batch_predict(file: UploadFile = File(...)):
    """Accept a CSV of transactions and predict fraud for each row."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read the CSV file")

    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400, detail=f"Missing required columns: {missing}"
        )

    result = predict_dataframe(df)

    summary = BatchSummary(
        total=len(result),
        predicted_fraud=int((result["prediction"] == "Fraud").sum()),
        high_risk=int((result["risk_level"] == "High").sum()),
        medium_risk=int((result["risk_level"] == "Medium").sum()),
        low_risk=int((result["risk_level"] == "Low").sum()),
    )

    # Top 5 most suspicious transactions
    top = result.sort_values("fraud_probability", ascending=False).head(5)
    top_high_risk = [
        BatchTransactionResult(
            row=int(idx) + 1,
            transaction_type=str(r["type"]),
            amount=float(r["amount"]),
            fraud_probability=round(float(r["fraud_probability"]), 4),
            prediction=str(r["prediction"]),
            risk_level=str(r["risk_level"]),
        )
        for idx, r in top.iterrows()
    ]

    return BatchResponse(summary=summary, top_high_risk=top_high_risk)