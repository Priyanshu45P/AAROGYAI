"""
Prepare a research dataset for AAROGYAI.

Expected canonical columns:
age, bmi, glucose, hba1c, systolic_bp, diastolic_bp, target

The script deliberately does not invent missing clinical values.
If the selected research dataset uses different column names, update
COLUMN_ALIASES below after documenting the dataset in data/README.md.
"""

from pathlib import Path
import argparse
import json
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
PROCESSED_DIR = ROOT / "data" / "processed"
RESULTS_DIR = ROOT / "results"

FEATURES = ["age", "bmi", "glucose", "hba1c", "systolic_bp", "diastolic_bp"]
TARGET = "target"

# Add aliases only when the final research dataset uses different names.
COLUMN_ALIASES = {
    "Age": "age",
    "BMI": "bmi",
    "Glucose": "glucose",
    "HbA1c": "hba1c",
    "HbA1c_level": "hba1c",
    "SystolicBP": "systolic_bp",
    "DiastolicBP": "diastolic_bp",
    "Outcome": "target",
    "Target": "target",
}


def load_dataset(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(
            f"Dataset was not found at {path}. "
            "Add the approved research dataset before running preprocessing."
        )
    return pd.read_csv(path)


def standardise_columns(df: pd.DataFrame) -> pd.DataFrame:
    # Rename known aliases so the rest of the pipeline uses one schema.
    rename = {name: COLUMN_ALIASES[name] for name in df.columns if name in COLUMN_ALIASES}
    return df.rename(columns=rename)


def validate_columns(df: pd.DataFrame) -> None:
    required = FEATURES + [TARGET]
    missing = [column for column in required if column not in df.columns]
    if missing:
        raise ValueError(
            "The dataset is missing required columns: "
            + ", ".join(missing)
            + ". Update COLUMN_ALIASES only if the dataset uses equivalent fields."
        )


def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    validate_columns(df)
    cleaned = df[FEATURES + [TARGET]].copy()

    # Convert every model field to a numeric value. Invalid text becomes missing.
    for column in FEATURES + [TARGET]:
        cleaned[column] = pd.to_numeric(cleaned[column], errors="coerce")

    # Do not silently fill missing clinical values. Remove incomplete research rows.
    cleaned = cleaned.dropna(subset=FEATURES + [TARGET])

    # Keep only plausible adult values. These are data-quality guards,
    # not treatment thresholds or diagnostic rules.
    cleaned = cleaned[
        cleaned["age"].between(18, 120)
        & cleaned["bmi"].between(10, 80)
        & cleaned["glucose"].between(30, 600)
        & cleaned["hba1c"].between(2, 25)
        & cleaned["systolic_bp"].between(60, 260)
        & cleaned["diastolic_bp"].between(30, 180)
    ]

    # The current model is a binary classification model.
    cleaned[TARGET] = cleaned[TARGET].astype(int)
    if not set(cleaned[TARGET].unique()).issubset({0, 1}):
        raise ValueError("The target column must contain only 0 and 1.")

    if cleaned.empty:
        raise ValueError("No usable rows remain after data-quality checks.")

    return cleaned.reset_index(drop=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input",
        default=str(RAW_DIR / "research_dataset.csv"),
        help="Path to the approved research CSV.",
    )
    parser.add_argument(
        "--output",
        default=str(PROCESSED_DIR / "processed_dataset.csv"),
        help="Where to save the cleaned dataset.",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    raw = standardise_columns(load_dataset(input_path))
    cleaned = clean_dataset(raw)
    cleaned.to_csv(output_path, index=False)

    report = {
        "input_file": str(input_path),
        "output_file": str(output_path),
        "rows_after_cleaning": len(cleaned),
        "features": FEATURES,
        "target": TARGET,
        "class_counts": cleaned[TARGET].value_counts().sort_index().to_dict(),
    }
    (RESULTS_DIR / "preprocessing_report.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )

    print(f"Saved cleaned dataset to: {output_path}")
    print(f"Usable rows: {len(cleaned)}")


if __name__ == "__main__":
    main()
