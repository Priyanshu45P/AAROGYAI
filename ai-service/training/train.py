"""
Train and compare AAROGYAI risk models.

The final model is selected using ROC-AUC with F1 used as a secondary signal.
Metrics must only be reported in the dissertation when this script is run
against the documented research dataset, not the synthetic demo dataset.
"""

from pathlib import Path
from datetime import datetime, timezone
import argparse
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[1]
PROCESSED = ROOT / "data" / "processed" / "processed_dataset.csv"
DEMO = ROOT / "data" / "demo_clinical_data.csv"
MODELS = ROOT / "models"
RESULTS = ROOT / "results"

FEATURES = ["age", "bmi", "glucose", "hba1c", "systolic_bp", "diastolic_bp"]
TARGET = "target"


def calculate_metrics(model, x_test, y_test):
    predictions = model.predict(x_test)
    probability = model.predict_proba(x_test)[:, 1]
    return {
        "accuracy": float(accuracy_score(y_test, predictions)),
        "precision": float(precision_score(y_test, predictions, zero_division=0)),
        "recall": float(recall_score(y_test, predictions, zero_division=0)),
        "f1": float(f1_score(y_test, predictions, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_test, probability)),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dataset",
        default=str(PROCESSED),
        help="Processed research dataset. Use --demo only for development.",
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Use synthetic demo data. Never report demo metrics as research results.",
    )
    args = parser.parse_args()

    dataset_path = DEMO if args.demo else Path(args.dataset)
    if not dataset_path.exists():
        raise SystemExit(
            f"Dataset not found: {dataset_path}\n"
            "For research evaluation run preprocess.py first. "
            "For development only, run generate_demo_data.py and use --demo."
        )

    df = pd.read_csv(dataset_path)
    missing = [column for column in FEATURES + [TARGET] if column not in df.columns]
    if missing:
        raise SystemExit("Dataset is missing: " + ", ".join(missing))

    x = df[FEATURES]
    y = df[TARGET].astype(int)

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )

    models = {
        "LogisticRegression": Pipeline(
            [
                ("scale", StandardScaler()),
                (
                    "model",
                    LogisticRegression(
                        max_iter=1500,
                        class_weight="balanced",
                        random_state=42,
                    ),
                ),
            ]
        ),
        "RandomForestClassifier": RandomForestClassifier(
            n_estimators=350,
            random_state=42,
            class_weight="balanced",
            min_samples_leaf=2,
        ),
        "GradientBoostingClassifier": GradientBoostingClassifier(
            n_estimators=180,
            learning_rate=0.05,
            max_depth=3,
            random_state=42,
        ),
    }

    model_results = {}
    fitted = {}

    for name, model in models.items():
        model.fit(x_train, y_train)
        fitted[name] = model
        model_results[name] = calculate_metrics(model, x_test, y_test)
        print(name, model_results[name])

    # Prefer ROC-AUC, then F1 if two models are very close.
    best_name = max(
        model_results,
        key=lambda name: (
            model_results[name]["roc_auc"],
            model_results[name]["f1"],
        ),
    )
    best_model = fitted[best_name]

    MODELS.mkdir(parents=True, exist_ok=True)
    RESULTS.mkdir(parents=True, exist_ok=True)

    # Keep a small training background sample for model-agnostic SHAP explanations.
    background = x_train.sample(min(60, len(x_train)), random_state=42).to_numpy()

    is_demo = args.demo
    version = "1.0-demo" if is_demo else datetime.now(timezone.utc).strftime("1.0-%Y%m%d")

    payload = {
        "model": best_model,
        "features": FEATURES,
        "background": background,
        "model_name": best_name,
        "model_version": version,
    }
    joblib.dump(payload, MODELS / "risk_model.joblib")

    metadata = {
        "model_name": best_name,
        "model_version": version,
        "features": FEATURES,
        "dataset_file": str(dataset_path),
        "dataset_type": "synthetic-development" if is_demo else "research",
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "training_rows": int(len(x_train)),
        "test_rows": int(len(x_test)),
        "selection_metric": "roc_auc_then_f1",
        "model_comparison": model_results,
    }
    (MODELS / "model_metadata.json").write_text(
        json.dumps(metadata, indent=2), encoding="utf-8"
    )
    (RESULTS / "model_comparison.json").write_text(
        json.dumps(model_results, indent=2), encoding="utf-8"
    )

    # Save the test split so evaluation and SHAP evidence use exactly the same data.
    test_set = x_test.copy()
    test_set[TARGET] = y_test.values
    test_set.to_csv(RESULTS / "held_out_test_set.csv", index=False)

    print(f"Selected model: {best_name}")
    print(f"Saved model: {MODELS / 'risk_model.joblib'}")
    if is_demo:
        print("WARNING: synthetic demo data was used. Do not report these metrics as clinical evidence.")


if __name__ == "__main__":
    main()
