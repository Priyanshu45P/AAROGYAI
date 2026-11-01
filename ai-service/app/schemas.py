from pydantic import BaseModel, Field

class PredictionInput(BaseModel):
    age: float = Field(ge=18, le=120)
    bmi: float = Field(gt=10, lt=80)
    glucose: float = Field(gt=30, lt=600)
    hba1c: float = Field(gt=2, lt=25)
    systolic_bp: float = Field(gt=60, lt=260)
    diastolic_bp: float = Field(gt=30, lt=180)

class FeatureContribution(BaseModel):
    feature: str
    value: float
    shap_value: float

class PredictionOutput(BaseModel):
    risk_level: str
    probability: float
    model_name: str
    model_version: str
    explanation: str
    feature_contributions: list[FeatureContribution]
