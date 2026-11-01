from pathlib import Path
import json
import joblib
import numpy as np
import shap

MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "risk_model.joblib"
METADATA_PATH = Path(__file__).resolve().parents[1] / "models" / "model_metadata.json"

_payload = None
_explainer = None


def load_model():
    global _payload, _explainer

    if _payload is None:
        if not MODEL_PATH.exists():
            raise RuntimeError(
                "Model file is missing. Train the model before requesting predictions."
            )

        _payload = joblib.load(MODEL_PATH)
        model = _payload["model"]
        background = np.asarray(_payload["background"], dtype=float)
        features = _payload["features"]

        # Use model-agnostic SHAP so the API supports the selected model type.
        positive_probability = lambda rows: model.predict_proba(rows)[:, 1]
        _explainer = shap.Explainer(
            positive_probability,
            background,
            feature_names=features,
        )

    return _payload, _explainer


def risk_category(probability: float) -> str:
    # These are prototype display bands, not diagnostic thresholds.
    if probability >= 0.70:
        return "HIGH"
    if probability >= 0.40:
        return "MODERATE"
    return "LOW"


def predict(values: dict):
    payload, explainer = load_model()
    model = payload["model"]
    features = payload["features"]

    missing = [name for name in features if values.get(name) is None]
    if missing:
        raise ValueError(
            "Prediction input is missing required values: " + ", ".join(missing)
        )

    x = np.array([[float(values[name]) for name in features]], dtype=float)
    probability = float(model.predict_proba(x)[0, 1])

    explanation = explainer(x)
    row = np.asarray(explanation.values)[0]

    contributions = [
        {
            "feature": name,
            "value": float(values[name]),
            "shap_value": float(row[index]),
        }
        for index, name in enumerate(features)
    ]
    contributions.sort(
        key=lambda item: abs(item["shap_value"]),
        reverse=True,
    )

    main_factors = ", ".join(item["feature"] for item in contributions[:3])
    text = (
        "The model's prediction was mainly influenced by "
        f"{main_factors}. This explains the model output and is not a diagnosis."
    )

    model_name = payload.get("model_name", type(model).__name__)
    model_version = payload.get("model_version", "unknown")

    # Prefer metadata saved by the training pipeline when available.
    if METADATA_PATH.exists():
        try:
            metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
            model_name = metadata.get("model_name", model_name)
            model_version = metadata.get("model_version", model_version)
        except Exception:
            pass

    return {
        "risk_level": risk_category(probability),
        "probability": round(probability, 4),
        "model_name": model_name,
        "model_version": model_version,
        "explanation": text,
        "feature_contributions": contributions,
    }
