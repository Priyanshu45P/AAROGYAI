from fastapi.testclient import TestClient
import app.main as main_module

client = TestClient(main_module.app)


def test_prediction_endpoint_returns_explainable_contract(monkeypatch):
    def fake_predict(values):
        return {
            "risk_level": "MODERATE",
            "probability": 0.52,
            "model_name": "TestModel",
            "model_version": "test-1",
            "explanation": "The test model explanation.",
            "feature_contributions": [
                {
                    "feature": "glucose",
                    "value": values["glucose"],
                    "shap_value": 0.21,
                }
            ],
        }

    monkeypatch.setattr(main_module, "predict", fake_predict)

    response = client.post(
        "/predict",
        json={
            "age": 45,
            "bmi": 27,
            "glucose": 125,
            "hba1c": 6.4,
            "systolic_bp": 132,
            "diastolic_bp": 82,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["risk_level"] == "MODERATE"
    assert 0 <= body["probability"] <= 1
    assert body["feature_contributions"][0]["feature"] == "glucose"
