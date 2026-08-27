from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import db_models
from app.models.schemas import ExplanationResponse, PredictionListItem
from app.services.explanation_service import generate_explanation
from app.services.prediction_service import get_top_factors

router = APIRouter()


@router.get("/predictions/recent", response_model=list[PredictionListItem])
def recent_predictions(db: Session = Depends(get_db)):
    """List recent predictions (most suspicious first) for the report dropdown."""
    rows = (
        db.query(db_models.Prediction)
        .order_by(db_models.Prediction.fraud_probability.desc())
        .limit(20)
        .all()
    )
    return [
        PredictionListItem(
            id=r.id,
            transaction_type=r.transaction_type,
            amount=r.amount,
            prediction=r.prediction,
            fraud_probability=r.fraud_probability,
            risk_level=r.risk_level,
        )
        for r in rows
    ]


@router.get("/explanation/{prediction_id}", response_model=ExplanationResponse)
def explanation(prediction_id: int, db: Session = Depends(get_db)):
    """Return (and generate + cache if missing) an LLM explanation for a prediction."""
    pred = (
        db.query(db_models.Prediction)
        .filter(db_models.Prediction.id == prediction_id)
        .first()
    )
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found")

    # Generate the explanation only once, then reuse the stored version
    if not pred.llm_explanation:
        result = generate_explanation(pred)
        pred.llm_explanation = result["explanation"]
        pred.recommended_action = result["recommended_action"]
        db.commit()
        db.refresh(pred)

    return ExplanationResponse(
        transaction_id=pred.id,
        transaction_type=pred.transaction_type,
        amount=pred.amount,
        transaction_hour=pred.transaction_hour,
        prediction=pred.prediction,
        fraud_probability=pred.fraud_probability,
        risk_level=pred.risk_level,
        top_factors=get_top_factors(),
        llm_explanation=pred.llm_explanation,
        recommended_action=pred.recommended_action,
        created_at=pred.created_at.isoformat() if pred.created_at else None,
    )
