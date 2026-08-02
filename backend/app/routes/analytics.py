from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import database_service as db_service
from app.models.schemas import OverviewStats, CategoryCount, ProbabilityBucket

router = APIRouter(prefix="/analytics")


@router.get("/overview", response_model=OverviewStats)
def overview(db: Session = Depends(get_db)):
    return db_service.get_overview(db)


@router.get("/fraud-by-type", response_model=list[CategoryCount])
def fraud_by_type(db: Session = Depends(get_db)):
    return db_service.get_fraud_by_type(db)


@router.get("/fraud-by-hour", response_model=list[CategoryCount])
def fraud_by_hour(db: Session = Depends(get_db)):
    return db_service.get_fraud_by_hour(db)


@router.get("/probability-distribution", response_model=list[ProbabilityBucket])
def probability_distribution(db: Session = Depends(get_db)):
    return db_service.get_probability_distribution(db)
