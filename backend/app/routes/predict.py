from fastapi import APIRouter

from app.models.schemas import TransactionRequest, PredictionResponse
from app.services.prediction_service import predict_transaction

# A router groups related endpoints together
router = APIRouter()

@router.post("/predict", response_model=PredictionResponse)

def predict(transaction: TransactionRequest):
    """
    Predict if a transaction is fraudulent or not.
    """
    return predict_transaction(transaction)