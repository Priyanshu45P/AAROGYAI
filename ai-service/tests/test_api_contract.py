from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_invalid_prediction_input_is_rejected_before_model_loading():
    response = client.post(
        "/predict",
        json={
            "age": 12,
            "bmi": 27,
            "glucose": 120,
            "hba1c": 6.2,
            "systolic_bp": 130,
            "diastolic_bp": 82,
        },
    )
    assert response.status_code == 422
