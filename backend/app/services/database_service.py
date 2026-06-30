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