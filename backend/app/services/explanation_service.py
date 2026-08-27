import os
import json

from dotenv import load_dotenv
from openai import OpenAI

from app.models import db_models

# Make sure .env is loaded (OPENAI_API_KEY lives there)
load_dotenv()


def _client() -> OpenAI:
    """Create the OpenAI client lazily, so a missing key doesn't crash startup."""
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_explanation(pred: db_models.Prediction) -> dict:
    """Ask the LLM to explain (NOT decide) the model's fraud prediction."""
    facts = (
        f"Transaction type: {pred.transaction_type}\n"
        f"Amount: ${pred.amount:,.2f}\n"
        f"Sender balance: {pred.old_balance_origin:,.2f} -> {pred.new_balance_origin:,.2f}\n"
        f"Receiver balance: {pred.old_balance_destination:,.2f} -> {pred.new_balance_destination:,.2f}\n"
        f"Hour of day: {pred.transaction_hour}\n"
        f"Model prediction: {pred.prediction}\n"
        f"Fraud probability: {pred.fraud_probability:.2%}\n"
        f"Risk level: {pred.risk_level}"
    )

    system = (
        "You are a fraud-analysis assistant. An XGBoost model has ALREADY decided "
        "whether this transaction is fraud. Your job is ONLY to explain that decision "
        "in clear, simple language for a human analyst. Do NOT change or second-guess "
        "the model's decision. Respond in JSON with exactly two keys: "
        "'explanation' (2-4 sentences on why the model likely flagged or cleared it, "
        "referencing the numbers) and 'recommended_action' (1-2 sentences on what the "
        "analyst should do next)."
    )

    response = _client().chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        temperature=0.3,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": facts},
        ],
    )

    data = json.loads(response.choices[0].message.content)
    return {
        "explanation": data.get("explanation", ""),
        "recommended_action": data.get("recommended_action", ""),
    }
