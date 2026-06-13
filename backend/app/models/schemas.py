from pydantic import BaseModel, Field


# What the user SENDS to /predict (the request)
class TransactionRequest(BaseModel):
    transaction_type: str = Field(
        ..., description="TRANSFER or CASH_OUT", examples=["TRANSFER"]
    )
    amount: float = Field(..., ge=0, description="Transaction amount in USD")
    old_balance_origin: float = Field(..., ge=0, description="Sender balance before")
    new_balance_origin: float = Field(..., ge=0, description="Sender balance after")
    old_balance_destination: float = Field(..., ge=0, description="Receiver balance before")
    new_balance_destination: float = Field(..., ge=0, description="Receiver balance after")
    transaction_hour: int = Field(..., ge=0, le=23, description="Hour of day (0-23)")

    # Example shown in the /docs page
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "transaction_type": "TRANSFER",
                    "amount": 8750.00,
                    "old_balance_origin": 12342.10,
                    "new_balance_origin": 3592.10,
                    "old_balance_destination": 125.00,
                    "new_balance_destination": 9125.00,
                    "transaction_hour": 22,
                }
            ]
        }
    }


# What the API SENDS BACK (the response)
class PredictionResponse(BaseModel):
    prediction: str = Field(..., description="Fraud or Normal")
    fraud_probability: float = Field(..., description="Probability between 0 and 1")
    risk_level: str = Field(..., description="High, Medium, or Low")