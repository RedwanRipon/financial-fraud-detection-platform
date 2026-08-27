from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schemas import TransactionRequest, PredictionResponse
from app.services.prediction_service import predict_transaction
from app.services.database_service import save_prediction

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
def predict(transaction: TransactionRequest, db: Session = Depends(get_db)):
    """Predict fraud for a single transaction and store the result."""
    result = predict_transaction(transaction)
    record = save_prediction(db, transaction, result)
    result.id = record.id  # so the UI can fetch this prediction's explanation
    return result