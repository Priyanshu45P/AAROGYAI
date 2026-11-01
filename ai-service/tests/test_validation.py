import pytest
from pydantic import ValidationError
from app.schemas import PredictionInput


def test_valid_prediction_input():
    item = PredictionInput(
        age=45,
        bmi=27.1,
        glucose=125,
        hba1c=6.4,
        systolic_bp=132,
        diastolic_bp=82,
    )
    assert item.age == 45


@pytest.mark.parametrize(
    "field,value",
    [
        ("age", 10),
        ("bmi", 5),
        ("glucose", 10),
        ("hba1c", 40),
        ("systolic_bp", 400),
        ("diastolic_bp", 250),
    ],
)
def test_invalid_clinical_values_are_rejected(field, value):
    values = dict(
        age=45,
        bmi=27.1,
        glucose=125,
        hba1c=6.4,
        systolic_bp=132,
        diastolic_bp=82,
    )
    values[field] = value
    with pytest.raises(ValidationError):
        PredictionInput(**values)
