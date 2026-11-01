from app.prediction import risk_category


def test_low_risk_band():
    assert risk_category(0.10) == "LOW"


def test_moderate_risk_band():
    assert risk_category(0.50) == "MODERATE"


def test_high_risk_band():
    assert risk_category(0.80) == "HIGH"
