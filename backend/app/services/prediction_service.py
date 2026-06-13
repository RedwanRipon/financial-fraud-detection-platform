import os
import joblib
import pandas as pd

from app.models.schemas import TransactionRequest, PredictionResponse

# ---- Locate and load the model (once, when the app starts) ----
# BASE_DIR points to the "app" folder
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "fraud_model.pkl")
FEATURES_PATH = os.path.join(BASE_DIR, "models", "feature_names.pkl")

model = joblib.load(MODEL_PATH)
feature_names = joblib.load(FEATURES_PATH)

# Map transaction type text -> number (same encoding we trained with)
TYPE_MAP = {"TRANSFER": 0, "CASH_OUT": 1}


def predict_transaction(txn: TransactionRequest) -> PredictionResponse:
    # 1. Recreate the engineered features (same as in the notebook)
    type_encoded = TYPE_MAP.get(txn.transaction_type.upper(), 0)
    balance_change_orig = txn.old_balance_origin - txn.new_balance_origin
    balance_change_dest = txn.new_balance_destination - txn.old_balance_destination

    # 2. Assemble all 9 features into a single-row DataFrame
    row = {
        "type_encoded": type_encoded,
        "amount": txn.amount,
        "oldbalanceOrg": txn.old_balance_origin,
        "newbalanceOrig": txn.new_balance_origin,
        "oldbalanceDest": txn.old_balance_destination,
        "newbalanceDest": txn.new_balance_destination,
        "balance_change_orig": balance_change_orig,
        "balance_change_dest": balance_change_dest,
        "transaction_hour": txn.transaction_hour,
    }
    # Reorder columns to EXACTLY match training order
    X = pd.DataFrame([row])[feature_names]

    # 3. Ask the model for the fraud probability
    fraud_probability = float(model.predict_proba(X)[0][1])

    # 4. Derive the label and risk level from the probability
    prediction = "Fraud" if fraud_probability >= 0.5 else "Normal"
    if fraud_probability >= 0.80:
        risk_level = "High"
    elif fraud_probability >= 0.50:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # 5. Fill the response container
    return PredictionResponse(
        prediction=prediction, 
        fraud_probability=round(fraud_probability, 4),
        risk_level=risk_level,
    )