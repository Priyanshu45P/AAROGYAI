from pathlib import Path
import numpy as np
import pandas as pd

OUT = Path(__file__).resolve().parents[1] / "data" / "demo_clinical_data.csv"
OUT.parent.mkdir(parents=True, exist_ok=True)

rng = np.random.default_rng(42)
n = 2500

age = rng.integers(20, 86, n)
bmi = np.clip(rng.normal(27, 5, n), 16, 50)
glucose = np.clip(rng.normal(120, 35, n), 55, 350)
hba1c = np.clip(rng.normal(6.2, 1.4, n), 3.8, 14)
systolic = np.clip(rng.normal(132, 20, n), 85, 220)
diastolic = np.clip(rng.normal(82, 12, n), 50, 140)

score = (
    0.025 * (age - 45)
    + 0.10 * (bmi - 25)
    + 0.025 * (glucose - 100)
    + 0.80 * (hba1c - 5.7)
    + 0.035 * (systolic - 120)
    + 0.02 * (diastolic - 80)
    + rng.normal(0, 1.0, n)
)
prob = 1 / (1 + np.exp(-score / 3.5))
target = rng.binomial(1, prob)

df = pd.DataFrame({
    "age": age,
    "bmi": bmi,
    "glucose": glucose,
    "hba1c": hba1c,
    "systolic_bp": systolic,
    "diastolic_bp": diastolic,
    "target": target
})
df.to_csv(OUT, index=False)
print(f"Created synthetic development dataset: {OUT}")
print("Do not use these results as clinical evidence.")
