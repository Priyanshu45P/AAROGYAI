from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_prediction_rejects_invalid_clinical_values_before_loading_model():
    response = client.post("/predict", json={
        "age": 10,
        "bmi": 1,
        "glucose": 5,
        "hba1c": 1,
        "systolic_bp": 10,
        "diastolic_bp": 5,
    })
    assert response.status_code == 422
