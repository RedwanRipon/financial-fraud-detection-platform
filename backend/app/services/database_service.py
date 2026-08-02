from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import db_models
from app.models.schemas import TransactionRequest, PredictionResponse


def save_prediction(
    db: Session,
    txn: TransactionRequest,
    result: PredictionResponse,
) -> db_models.Prediction:
    """Save one transaction + its prediction to the database."""
    record = db_models.Prediction(
        transaction_type=txn.transaction_type,
        amount=txn.amount,
        old_balance_origin=txn.old_balance_origin,
        new_balance_origin=txn.new_balance_origin,
        old_balance_destination=txn.old_balance_destination,
        new_balance_destination=txn.new_balance_destination,
        transaction_hour=txn.transaction_hour,
        prediction=result.prediction,
        fraud_probability=result.fraud_probability,
        risk_level=result.risk_level,
    )
    db.add(record)       # stage the new row
    db.commit()          # save it permanently
    db.refresh(record)   # reload it (gets the auto-generated id + created_at)
    return record

def save_predictions_bulk(db: Session, result_df) -> None:
    """Save all rows of a batch-prediction DataFrame to the database."""
    records = [
        {
            "transaction_type": str(r["type"]),
            "amount": float(r["amount"]),
            "old_balance_origin": float(r["oldbalanceOrg"]),
            "new_balance_origin": float(r["newbalanceOrig"]),
            "old_balance_destination": float(r["oldbalanceDest"]),
            "new_balance_destination": float(r["newbalanceDest"]),
            "transaction_hour": int(r["transaction_hour"]),
            "prediction": str(r["prediction"]),
            "fraud_probability": round(float(r["fraud_probability"]), 4),
            "risk_level": str(r["risk_level"]),
        }
        for _, r in result_df.iterrows()
    ]
    db.bulk_insert_mappings(db_models.Prediction, records)
    db.commit()


# ---- Analytics queries ----
def get_overview(db: Session) -> dict:
    total = db.query(func.count(db_models.Prediction.id)).scalar() or 0
    fraud = (
        db.query(func.count(db_models.Prediction.id))
        .filter(db_models.Prediction.prediction == "Fraud")
        .scalar()
        or 0
    )
    high = (
        db.query(func.count(db_models.Prediction.id))
        .filter(db_models.Prediction.risk_level == "High")
        .scalar()
        or 0
    )
    avg = db.query(func.avg(db_models.Prediction.fraud_probability)).scalar() or 0.0
    return {
        "total_transactions": total,
        "predicted_fraud": fraud,
        "high_risk": high,
        "avg_fraud_probability": round(float(avg), 4),
    }


def get_fraud_by_type(db: Session) -> list[dict]:
    rows = (
        db.query(
            db_models.Prediction.transaction_type,
            func.count(db_models.Prediction.id),
        )
        .filter(db_models.Prediction.prediction == "Fraud")
        .group_by(db_models.Prediction.transaction_type)
        .all()
    )
    return [{"label": t, "count": c} for t, c in rows]


def get_fraud_by_hour(db: Session) -> list[dict]:
    rows = (
        db.query(
            db_models.Prediction.transaction_hour,
            func.count(db_models.Prediction.id),
        )
        .filter(db_models.Prediction.prediction == "Fraud")
        .group_by(db_models.Prediction.transaction_hour)
        .order_by(db_models.Prediction.transaction_hour)
        .all()
    )
    return [{"label": str(h), "count": c} for h, c in rows]


def get_probability_distribution(db: Session) -> list[dict]:
    probs = [row[0] for row in db.query(db_models.Prediction.fraud_probability).all()]
    buckets = [0] * 10
    for p in probs:
        idx = min(int(p * 10), 9)
        buckets[idx] += 1
    labels = [f"{i/10:.1f}-{(i+1)/10:.1f}" for i in range(10)]
    return [{"range": labels[i], "count": buckets[i]} for i in range(10)]