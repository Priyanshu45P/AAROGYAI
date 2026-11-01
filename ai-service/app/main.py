from fastapi import FastAPI, HTTPException
from .schemas import PredictionInput, PredictionOutput
from .prediction import predict

app = FastAPI(
    title="AAROGYAI AI Service",
    version="1.0.0",
    description="Clinical risk prediction and SHAP explainability service."
)

@app.get("/health")
def health():
    return {"success": True, "status": "healthy"}

@app.post("/predict", response_model=PredictionOutput)
def make_prediction(data: PredictionInput):
    try:
        # Predict risk only from clinical variables.
        return predict(data.model_dump())
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error))
