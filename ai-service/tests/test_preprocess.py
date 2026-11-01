import pandas as pd
import pytest
from training.preprocess import clean_dataset


def test_preprocess_removes_incomplete_rows():
    df = pd.DataFrame(
        [
            dict(age=45, bmi=27, glucose=120, hba1c=6.4, systolic_bp=130, diastolic_bp=82, target=1),
            dict(age=50, bmi=None, glucose=130, hba1c=6.8, systolic_bp=135, diastolic_bp=85, target=1),
        ]
    )
    result = clean_dataset(df)
    assert len(result) == 1


def test_preprocess_rejects_non_binary_target():
    df = pd.DataFrame(
        [dict(age=45, bmi=27, glucose=120, hba1c=6.4, systolic_bp=130, diastolic_bp=82, target=3)]
    )
    with pytest.raises(ValueError):
        clean_dataset(df)
