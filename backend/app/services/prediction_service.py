import os
import joblib
import pandas as pd
import numpy as np

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

def predict_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Predict fraud for every row in a DataFrame (used for batch upload)."""
    df = df.copy()

    # Recreate the same engineered features as training
    df["type_encoded"] = df["type"].str.upper().map(TYPE_MAP).fillna(0).astype(int)
    df["balance_change_orig"] = df["oldbalanceOrg"] - df["newbalanceOrig"]
    df["balance_change_dest"] = df["newbalanceDest"] - df["oldbalanceDest"]

    # If the CSV has 'step' but no hour, derive the hour
    if "transaction_hour" not in df.columns:
        df["transaction_hour"] = df["step"] % 24

    # Predict probabilities for ALL rows at once (fast, vectorized)
    X = df[feature_names]
    proba = model.predict_proba(X)[:, 1]

    df["fraud_probability"] = proba
    df["prediction"] = np.where(proba >= 0.5, "Fraud", "Normal")
    df["risk_level"] = np.select(
        [proba >= 0.80, proba >= 0.50],
        ["High", "Medium"],
        default="Low",
    )
    return df