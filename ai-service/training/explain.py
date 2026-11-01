"""
Generate SHAP evidence for the selected AAROGYAI model.

This uses a model-agnostic SHAP explainer so the same code can explain
the selected Logistic Regression, Random Forest, or Gradient Boosting model.
"""

from pathlib import Path
import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import shap

ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "models" / "risk_model.joblib"
TEST_PATH = ROOT / "results" / "held_out_test_set.csv"
RESULTS = ROOT / "results"


def main():
    if not MODEL_PATH.exists() or not TEST_PATH.exists():
        raise SystemExit("Run training/train.py before generating SHAP evidence.")

    payload = joblib.load(MODEL_PATH)
    model = payload["model"]
    features = payload["features"]
    background = np.asarray(payload["background"], dtype=float)

    test = pd.read_csv(TEST_PATH)
    x = test[features].head(min(40, len(test))).to_numpy(dtype=float)

    # Explain the probability of the positive-risk class.
    predict_positive = lambda rows: model.predict_proba(rows)[:, 1]
    explainer = shap.Explainer(predict_positive, background, feature_names=features)
    explanation = explainer(x)

    plt.figure()
    shap.plots.beeswarm(explanation, show=False, max_display=len(features))
    plt.tight_layout()
    plt.savefig(RESULTS / "shap_summary.png", dpi=180, bbox_inches="tight")
    plt.close()

    print(f"Saved SHAP summary: {RESULTS / 'shap_summary.png'}")


if __name__ == "__main__":
    main()
