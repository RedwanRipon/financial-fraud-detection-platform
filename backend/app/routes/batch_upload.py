import io

import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.prediction_service import predict_dataframe
from app.services.database_service import save_predictions_bulk
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
async def batch_predict(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    ):
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
    save_predictions_bulk(db, result) 
    summary = BatchSummary(
        total=len(result),
        predicted_fraud=int((result["prediction"] == "Fraud").sum()),
        high_risk=int((result["risk_level"] == "High").sum()),
        medium_risk=int((result["risk_level"] == "Medium").sum()),
        low_risk=int((result["risk_level"] == "Low").sum()),
    )

    # All rows (fast, vectorized) — the frontend derives the top-5 and CSV download
    res = result.reset_index(drop=True)
    results = [
        BatchTransactionResult(
            row=i + 1,
            transaction_type=str(t),
            amount=float(a),
            fraud_probability=round(float(p), 4),
            prediction=str(pr),
            risk_level=str(rl),
        )
        for i, (t, a, p, pr, rl) in enumerate(
            zip(
                res["type"],
                res["amount"],
                res["fraud_probability"],
                res["prediction"],
                res["risk_level"],
            )
        )
    ]

    return BatchResponse(summary=summary, results=results)