"""
Generate final model evaluation artefacts.

Outputs:
- metrics.json
- confusion_matrix.png
- roc_curve.png
- classification_report.txt
"""

from pathlib import Path
import json
import joblib
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    ConfusionMatrixDisplay,
    RocCurveDisplay,
    classification_report,
)

ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "models" / "risk_model.joblib"
TEST_PATH = ROOT / "results" / "held_out_test_set.csv"
RESULTS = ROOT / "results"
TARGET = "target"


def main():
    if not MODEL_PATH.exists():
        raise SystemExit("Model not found. Run training/train.py first.")
    if not TEST_PATH.exists():
        raise SystemExit("Held-out test set not found. Run training/train.py first.")

    payload = joblib.load(MODEL_PATH)
    model = payload["model"]
    features = payload["features"]

    test = pd.read_csv(TEST_PATH)
    x_test = test[features]
    y_test = test[TARGET].astype(int)

    predictions = model.predict(x_test)
    probability = model.predict_proba(x_test)[:, 1]

    metrics = {
        "model_name": payload.get("model_name", type(model).__name__),
        "model_version": payload.get("model_version", "unknown"),
        "accuracy": float(accuracy_score(y_test, predictions)),
        "precision": float(precision_score(y_test, predictions, zero_division=0)),
        "recall": float(recall_score(y_test, predictions, zero_division=0)),
        "f1": float(f1_score(y_test, predictions, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, probability)),
        "test_rows": int(len(test)),
    }

    RESULTS.mkdir(parents=True, exist_ok=True)
    (RESULTS / "metrics.json").write_text(
        json.dumps(metrics, indent=2), encoding="utf-8"
    )

    report = classification_report(y_test, predictions, digits=4)
    (RESULTS / "classification_report.txt").write_text(report, encoding="utf-8")

    matrix = confusion_matrix(y_test, predictions)
    fig, ax = plt.subplots(figsize=(6, 5))
    ConfusionMatrixDisplay(matrix).plot(ax=ax, values_format="d")
    ax.set_title("AAROGYAI Confusion Matrix")
    fig.tight_layout()
    fig.savefig(RESULTS / "confusion_matrix.png", dpi=180)
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(6, 5))
    RocCurveDisplay.from_predictions(y_test, probability, ax=ax)
    ax.set_title("AAROGYAI ROC Curve")
    fig.tight_layout()
    fig.savefig(RESULTS / "roc_curve.png", dpi=180)
    plt.close(fig)

    print(json.dumps(metrics, indent=2))
    print(f"Evaluation artefacts saved in: {RESULTS}")


if __name__ == "__main__":
    main()
