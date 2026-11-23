from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from backend.app.data.geo_features import load_districts, load_crops, get_district_geojson
from backend.app.ml.model import predict_crop_outcome, get_models
from backend.app.services.grounding import generate_grounded_bangla_summary, generate_grounded_english_summary

router = APIRouter(prefix="/api", tags=["Predictive Core"])

class PredictRequest(BaseModel):
    district_id: str
    crop_id: str
    visual_symptoms: Optional[List[str]] = None

@router.get("/districts")
def get_all_districts():
    """Returns list of supported agricultural districts in Bangladesh."""
    return load_districts()

@router.get("/crops")
def get_all_crops():
    """Returns list of supported crops."""
    return load_crops()

@router.post("/predict")
def predict_crop(req: PredictRequest):
    """
    Executes ML prediction pipeline combining:
    - Sentinel-2 NDVI satellite observations
    - Open-Meteo weather features
    - SoilGrids soil profile
    - Gradient boosted yield & risk models
    - Strict grounded Bangla and English explanations
    """
    try:
        outcome = predict_crop_outcome(
            district_id=req.district_id,
            crop_id=req.crop_id,
            visual_symptoms=req.visual_symptoms
        )
        outcome["explanation_bn"] = generate_grounded_bangla_summary(outcome)
        outcome["explanation_en"] = generate_grounded_english_summary(outcome)
        return outcome
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ndvi/{district_id}")
def get_district_ndvi(district_id: str):
    """Returns GeoJSON polygon with NDVI metrics for Leaflet map overlay."""
    return get_district_geojson(district_id)

@router.get("/metrics")
def get_model_validation_metrics():
    """Returns validation metrics (MAPE, accuracy, feature importances) on held-out test data."""
    _, _, _, metrics = get_models()
    return metrics
