from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import database_service as db_service
from app.models.schemas import (
    OverviewStats,
    CategoryCount,
    ProbabilityBucket,
    ScatterPoint,
    HighRiskItem,
)

router = APIRouter(prefix="/analytics")


@router.get("/overview", response_model=OverviewStats)
def overview(
    transaction_type: str | None = None,
    risk_level: str | None = None,
    days: int | None = None,
    db: Session = Depends(get_db),
):
    return db_service.get_overview(db, transaction_type, risk_level, days)


@router.get("/fraud-by-type", response_model=list[CategoryCount])
def fraud_by_type(
    transaction_type: str | None = None,
    risk_level: str | None = None,
    days: int | None = None,
    db: Session = Depends(get_db),
):
    return db_service.get_fraud_by_type(db, transaction_type, risk_level, days)


@router.get("/fraud-by-hour", response_model=list[CategoryCount])
def fraud_by_hour(
    transaction_type: str | None = None,
    risk_level: str | None = None,
    days: int | None = None,
    db: Session = Depends(get_db),
):
    return db_service.get_fraud_by_hour(db, transaction_type, risk_level, days)


@router.get("/probability-distribution", response_model=list[ProbabilityBucket])
def probability_distribution(
    transaction_type: str | None = None,
    risk_level: str | None = None,
    days: int | None = None,
    db: Session = Depends(get_db),
):
    return db_service.get_probability_distribution(db, transaction_type, risk_level, days)


@router.get("/amount-vs-probability", response_model=list[ScatterPoint])
def amount_vs_probability(
    transaction_type: str | None = None,
    risk_level: str | None = None,
    days: int | None = None,
    db: Session = Depends(get_db),
):
    return db_service.get_amount_vs_probability(db, transaction_type, risk_level, days)


@router.get("/top-high-risk", response_model=list[HighRiskItem])
def top_high_risk(
    transaction_type: str | None = None,
    risk_level: str | None = None,
    days: int | None = None,
    db: Session = Depends(get_db),
):
    return db_service.get_top_high_risk(db, transaction_type, risk_level, days)
