from fastapi import FastAPI
from app.routes import predict

# Create the FastAPI application
app = FastAPI(
    title="Financial Fraud Detection API",
    description="Detects fraudulent transactions using XGBoost and explains them.",
    version="1.0.0",
)

# Connect the prediction routes to the app
app.include_router(predict.router)

@app.get("/")
def read_root():
    return {"message": "Fraud Detection API is running"}

# A health-check endpoint (common in real APIs)
@app.get("/health")
def health_check():
    return {"status": "healthy"}

