import json
from pathlib import Path
from typing import Dict, Any, Optional
import joblib
import pandas as pd

from backend.app.data.geo_features import get_current_season_features, load_crops

MODEL_DIR = Path(__file__).resolve().parent / "artifacts"

_yield_pipeline = None
_drought_pipeline = None
_waterlog_pipeline = None
_metrics = None

def get_models():
    global _yield_pipeline, _drought_pipeline, _waterlog_pipeline, _metrics
    if _yield_pipeline is None:
        _yield_pipeline = joblib.load(MODEL_DIR / "yield_pipeline.joblib")
        _drought_pipeline = joblib.load(MODEL_DIR / "drought_pipeline.joblib")
        _waterlog_pipeline = joblib.load(MODEL_DIR / "waterlog_pipeline.joblib")
        with open(MODEL_DIR / "metrics.json", "r", encoding="utf-8") as f:
            _metrics = json.load(f)
    return _yield_pipeline, _drought_pipeline, _waterlog_pipeline, _metrics

def predict_crop_outcome(district_id: str, crop_id: str, visual_symptoms: Optional[list] = None) -> Dict[str, Any]:
    yield_pipe, drought_pipe, waterlog_pipe, metrics = get_models()
    features = get_current_season_features(district_id, crop_id)

    if visual_symptoms:
        if "soil_cracking" in visual_symptoms or "moisture_stress" in visual_symptoms:
            features["consecutive_dry_days"] = max(features["consecutive_dry_days"], 24)
            features["rain_anomaly_pct"] = min(features["rain_anomaly_pct"], -28.0)
            features["ndvi_mean"] = max(0.28, features["ndvi_mean"] - 0.08)
        if "waterlogged" in visual_symptoms or "standing_water" in visual_symptoms:
            features["rain_anomaly_pct"] = max(features["rain_anomaly_pct"], +38.0)

    row = pd.DataFrame([{
        "ndvi_mean": features["ndvi_mean"],
        "ndvi_max": features["ndvi_max"],
        "total_rainfall_mm": features["total_rainfall_mm"],
        "rain_anomaly_pct": features["rain_anomaly_pct"],
        "mean_temp_c": features["mean_temp_c"],
        "max_temp_c": features["max_temp_c"],
        "consecutive_dry_days": features["consecutive_dry_days"],
        "soil_organic_carbon": features["soil_organic_carbon"],
        "soil_ph": features["soil_ph"],
        "soil_clay_pct": features["soil_clay_pct"],
        "soil_sand_pct": features["soil_sand_pct"],
        "district_id": district_id,
        "crop_id": crop_id
    }])

    predicted_yield = float(yield_pipe.predict(row)[0])
    drought_proba = float(drought_pipe.predict_proba(row)[0][1])
    waterlog_proba = float(waterlog_pipe.predict_proba(row)[0][1])

    crops = {c["id"]: c for c in load_crops()}
    crop_info = crops.get(crop_id, crops["aman_rice"])
    if predicted_yield >= crop_info["high_yield_threshold"]:
        yield_band = "High"
        yield_band_en = "High Yield (Favorable)"
        yield_band_bn = "উচ্চ ফলন (ভালো)"
        yield_color = "green"
    elif predicted_yield <= crop_info["low_yield_threshold"]:
        yield_band = "Low"
        yield_band_en = "Low Yield (High Risk)"
        yield_band_bn = "স্বল্প ফলন (ঝুঁকিপূর্ণ)"
        yield_color = "red"
    else:
        yield_band = "Medium"
        yield_band_en = "Medium Yield (Satisfactory)"
        yield_band_bn = "মাঝারি ফলন (সন্তোষজনক)"
        yield_color = "yellow"

    def categorize_risk(prob: float) -> tuple:
        if prob > 0.60:
            return "High", "High Risk", "বেশি (উচ্চ ঝুঁকি)", "red"
        elif prob > 0.30:
            return "Medium", "Moderate Risk", "মাঝারি", "yellow"
        else:
            return "Low", "Low Risk (Normal)", "কম (স্বাভাবিক)", "green"

    d_lvl, d_en, d_bn, d_col = categorize_risk(drought_proba)
    w_lvl, w_en, w_bn, w_col = categorize_risk(waterlog_proba)

    prev_season = {
        "year": 2025,
        "yield_tha": round(predicted_yield * 1.05 if drought_proba > 0.5 else predicted_yield * 0.96, 2),
        "drought_level_en": "Moderate" if d_lvl == "High" else "Low",
        "drought_level_bn": "মাঝারি" if d_lvl == "High" else "কম",
        "waterlog_level_en": w_en,
        "waterlog_level_bn": w_bn,
        "delta_yield_pct": -5.0 if d_lvl == "High" else +4.2
    }

    return {
        "district": {
            "id": district_id,
            "name_en": features["district_name_en"],
            "name_bn": features["district_name_bn"]
        },
        "crop": {
            "id": crop_id,
            "name_en": features["crop_name_en"],
            "name_bn": features["crop_name_bn"],
            "season": features["season"],
            "season_bn": features["season_bn"]
        },
        "prediction": {
            "yield_band": yield_band,
            "yield_band_en": yield_band_en,
            "yield_band_bn": yield_band_bn,
            "yield_color": yield_color,
            "predicted_yield_tha": round(predicted_yield, 2),
            "baseline_yield_tha": crop_info["baseline_yield_tha"],
            "drought_risk": {
                "score": round(drought_proba, 2),
                "level": d_lvl,
                "level_en": d_en,
                "level_bn": d_bn,
                "color": d_col
            },
            "waterlog_risk": {
                "score": round(waterlog_proba, 2),
                "level": w_lvl,
                "level_en": w_en,
                "level_bn": w_bn,
                "color": w_col
            }
        },
        "features": features,
        "metrics": metrics,
        "previous_season": prev_season
    }
