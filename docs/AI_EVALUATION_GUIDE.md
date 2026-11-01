# AAROGYAI Final AI Evaluation Guide

## 1. Add the approved dataset
Place it at:

`ai-service/data/raw/research_dataset.csv`

Document the exact dataset source and licence in `ai-service/data/README.md`.

## 2. Preprocess
```bash
cd ai-service
python training/preprocess.py
```

## 3. Train and compare models
```bash
python training/train.py
```

This compares:
- Logistic Regression
- Random Forest
- Gradient Boosting

The selected model is saved to `models/risk_model.joblib`.

## 4. Generate evaluation evidence
```bash
python training/evaluate.py
```

Outputs:
- `results/metrics.json`
- `results/classification_report.txt`
- `results/confusion_matrix.png`
- `results/roc_curve.png`

## 5. Generate SHAP evidence
```bash
python training/explain.py
```

Output:
- `results/shap_summary.png`

## 6. Dissertation evidence
Report only the metrics produced from the documented research dataset.

Do not report results produced using:
`python training/train.py --demo`

The synthetic generator exists only to let the software pipeline run during development.
