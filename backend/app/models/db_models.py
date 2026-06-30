from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func

from app.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)

    # Transaction details
    transaction_type = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    old_balance_origin = Column(Float)
    new_balance_origin = Column(Float)
    old_balance_destination = Column(Float)
    new_balance_destination = Column(Float)
    transaction_hour = Column(Integer)

    # Model results
    prediction = Column(String, nullable=False)
    fraud_probability = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    model_version = Column(String, default="1.0.0")

    # LLM explanation (filled in later, for the Explanation Report)
    llm_explanation = Column(String, nullable=True)
    recommended_action = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())