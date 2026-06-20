from fastapi import FastAPI
from app.routes import predict
from fastapi.middleware.cors import CORSMiddleware

# Create the FastAPI application
app = FastAPI(
    title="Financial Fraud Detection API",
    description="Detects fraudulent transactions using XGBoost and explains them.",
    version="1.0.0",
)

# Allow the Next.js frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

