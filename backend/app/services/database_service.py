from datetime import datetime, timedelta, timezone

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
def _apply_filters(query, transaction_type=None, risk_level=None, days=None):
    """Apply the optional Type / Risk Level / Date-range filters to any query."""
    if transaction_type:
        query = query.filter(
            db_models.Prediction.transaction_type == transaction_type
        )
    if risk_level:
        query = query.filter(db_models.Prediction.risk_level == risk_level)
    if days:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        query = query.filter(db_models.Prediction.created_at >= cutoff)
    return query


def get_overview(db: Session, transaction_type=None, risk_level=None, days=None) -> dict:
    base = _apply_filters(
        db.query(db_models.Prediction), transaction_type, risk_level, days
    )
    total = base.count()
    fraud = base.filter(db_models.Prediction.prediction == "Fraud").count()
    high = base.filter(db_models.Prediction.risk_level == "High").count()
    avg = (
        _apply_filters(
            db.query(func.avg(db_models.Prediction.fraud_probability)),
            transaction_type,
            risk_level,
            days,
        ).scalar()
        or 0.0
    )
    return {
        "total_transactions": total,
        "predicted_fraud": fraud,
        "high_risk": high,
        "avg_fraud_probability": round(float(avg), 4),
    }


def get_fraud_by_type(
    db: Session, transaction_type=None, risk_level=None, days=None
) -> list[dict]:
    q = db.query(
        db_models.Prediction.transaction_type, func.count(db_models.Prediction.id)
    ).filter(db_models.Prediction.prediction == "Fraud")
    q = _apply_filters(q, transaction_type, risk_level, days)
    rows = q.group_by(db_models.Prediction.transaction_type).all()
    return [{"label": t, "count": c} for t, c in rows]


def get_fraud_by_hour(
    db: Session, transaction_type=None, risk_level=None, days=None
) -> list[dict]:
    q = db.query(
        db_models.Prediction.transaction_hour, func.count(db_models.Prediction.id)
    ).filter(db_models.Prediction.prediction == "Fraud")
    q = _apply_filters(q, transaction_type, risk_level, days)
    rows = q.group_by(db_models.Prediction.transaction_hour).order_by(
        db_models.Prediction.transaction_hour
    ).all()
    return [{"label": str(h), "count": c} for h, c in rows]


def get_probability_distribution(
    db: Session, transaction_type=None, risk_level=None, days=None
) -> list[dict]:
    q = _apply_filters(
        db.query(db_models.Prediction.fraud_probability),
        transaction_type,
        risk_level,
        days,
    )
    probs = [row[0] for row in q.all()]
    buckets = [0] * 10
    for p in probs:
        idx = min(int(p * 10), 9)
        buckets[idx] += 1
    labels = [f"{i/10:.1f}-{(i+1)/10:.1f}" for i in range(10)]
    return [{"range": labels[i], "count": buckets[i]} for i in range(10)]


def get_amount_vs_probability(
    db: Session, transaction_type=None, risk_level=None, days=None, limit=800
) -> list[dict]:
    q = _apply_filters(
        db.query(db_models.Prediction.amount, db_models.Prediction.fraud_probability),
        transaction_type,
        risk_level,
        days,
    )
    rows = q.limit(limit).all()
    return [
        {"amount": float(a), "fraud_probability": round(float(p), 4)}
        for a, p in rows
        if a and a > 0
    ]


def get_top_high_risk(
    db: Session, transaction_type=None, risk_level=None, days=None, limit=None
) -> list[dict]:
    q = _apply_filters(
        db.query(db_models.Prediction), transaction_type, risk_level, days
    )
    q = q.order_by(db_models.Prediction.fraud_probability.desc())
    if limit:
        q = q.limit(limit)
    rows = q.all()
    return [
        {
            "id": r.id,
            "transaction_type": r.transaction_type,
            "amount": r.amount,
            "fraud_probability": r.fraud_probability,
            "risk_level": r.risk_level,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]