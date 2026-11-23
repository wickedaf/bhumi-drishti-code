import json
import math
from pathlib import Path
from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd

DATA_DIR = Path(__file__).resolve().parent

def load_districts() -> List[Dict[str, Any]]:
    with open(DATA_DIR / "districts.json", "r", encoding="utf-8") as f:
        return json.load(f)

def load_crops() -> List[Dict[str, Any]]:
    with open(DATA_DIR / "crops.json", "r", encoding="utf-8") as f:
        return json.load(f)

def generate_historical_dataset() -> pd.DataFrame:
    """
    Builds a realistic agricultural training dataset spanning 2018-2025 across Bangladesh districts.
    Features include:
    - Sentinel-2 NDVI mean & max
    - Open-Meteo rainfall (cumulative & anomaly %)
    - Open-Meteo temperature (mean & max)
    - Consecutive dry days
    - SoilGrids (organic carbon, pH, clay %, sand %)
    - Real historical drought/flood anomaly patterns (e.g. 2022 drought in Rangpur/Rajshahi, 2020 floods in Sylhet/Mymensingh).
    """
    districts = load_districts()
    crops = load_crops()
    records = []

    np.random.seed(42)

    years = list(range(2018, 2026))

    for yr in years:
        for dist in districts:
            for crop in crops:
                # Baseline environmental parameters
                base_rainfall = dist["avg_annual_rainfall_mm"] * (0.45 if "rice" in crop["id"] else 0.15)
                base_temp = 28.0 if "Kharif" in crop["season"] else 20.5
                soc = dist["soil_organic_carbon"]
                ph = dist["soil_ph"]
                clay = dist["soil_clay_pct"]
                sand = dist["soil_sand_pct"]

                # Introduce known historical climate shocks
                # 2022: severe monsoon drought in northwestern Bangladesh (Rangpur, Dinajpur, Rajshahi)
                # 2020: massive Haor flash flooding in Sylhet, Mymensingh
                # 2023: erratic high heat waves
                rain_anomaly_pct = np.random.normal(0, 15)
                temp_anomaly = np.random.normal(0, 1.2)
                ndvi_base = 0.58

                if yr == 2022 and dist["id"] in ["rangpur", "dinajpur", "rajshahi", "bogura"]:
                    rain_anomaly_pct = -35.0 + np.random.normal(0, 5)
                    temp_anomaly = +2.4
                    ndvi_base -= 0.14
                elif yr == 2020 and dist["id"] in ["sylhet", "mymensingh"]:
                    rain_anomaly_pct = +55.0 + np.random.normal(0, 8)
                    ndvi_base -= 0.08

                total_rainfall = max(10, base_rainfall * (1 + rain_anomaly_pct / 100.0))
                mean_temp = base_temp + temp_anomaly
                max_temp = mean_temp + np.random.uniform(5, 9)

                # NDVI correlates with water availability and soil health
                ndvi_mean = float(np.clip(ndvi_base + (rain_anomaly_pct / 300.0) + (soc * 0.05) + np.random.normal(0, 0.03), 0.25, 0.85))
                ndvi_max = float(np.clip(ndvi_mean + np.random.uniform(0.08, 0.15), ndvi_mean, 0.95))

                dry_days = int(np.clip(12 - (rain_anomaly_pct / 8.0) + np.random.normal(0, 3), 0, 40))

                # Agronomic Yield Calculation (BBS baseline + stress degradation)
                base_yield = crop["baseline_yield_tha"]
                yield_modifier = 1.0

                # Drought penalty
                if rain_anomaly_pct < -20:
                    yield_modifier *= (1.0 + (rain_anomaly_pct / 100.0) * 0.9)
                # Flood penalty
                if rain_anomaly_pct > 40 and crop["id"] in ["wheat", "potato", "aus_rice"]:
                    yield_modifier *= (1.0 - (rain_anomaly_pct / 150.0))
                # Extreme heat penalty
                if max_temp > 36.0:
                    yield_modifier *= 0.88

                # Soil adjustment
                if abs(ph - np.mean(crop["optimal_ph"])) > 1.0:
                    yield_modifier *= 0.92

                actual_yield = round(float(np.clip(base_yield * yield_modifier + np.random.normal(0, 0.1), base_yield * 0.4, base_yield * 1.35)), 2)

                # Yield Category
                if actual_yield >= crop["high_yield_threshold"]:
                    yield_band = "High"
                elif actual_yield <= crop["low_yield_threshold"]:
                    yield_band = "Low"
                else:
                    yield_band = "Medium"

                # Ground-truth risk tags
                drought_risk_groundtruth = 1 if (rain_anomaly_pct < -18 or dry_days > 18) else 0
                waterlog_risk_groundtruth = 1 if (rain_anomaly_pct > 30 and dist["id"] in ["sylhet", "mymensingh", "barishal", "cumilla"]) else 0

                records.append({
                    "year": yr,
                    "district_id": dist["id"],
                    "crop_id": crop["id"],
                    "ndvi_mean": round(ndvi_mean, 3),
                    "ndvi_max": round(ndvi_max, 3),
                    "total_rainfall_mm": round(total_rainfall, 1),
                    "rain_anomaly_pct": round(rain_anomaly_pct, 1),
                    "mean_temp_c": round(mean_temp, 1),
                    "max_temp_c": round(max_temp, 1),
                    "consecutive_dry_days": dry_days,
                    "soil_organic_carbon": soc,
                    "soil_ph": ph,
                    "soil_clay_pct": clay,
                    "soil_sand_pct": sand,
                    "actual_yield_tha": actual_yield,
                    "yield_band": yield_band,
                    "drought_risk": drought_risk_groundtruth,
                    "waterlog_risk": waterlog_risk_groundtruth
                })

    return pd.DataFrame(records)

def get_current_season_features(district_id: str, crop_id: str) -> Dict[str, Any]:
    """
    Returns the current 2026 season observation for the given district and crop,
    simulating live Sentinel-2 NDVI passes and Open-Meteo weather stats.
    """
    districts = {d["id"]: d for d in load_districts()}
    crops = {c["id"]: c for c in load_crops()}

    dist = districts.get(district_id, districts["rangpur"])
    crop = crops.get(crop_id, crops["aman_rice"])

    # Simulate realistic 2026 conditions
    # Northern districts experiencing moderate rain deficit
    if district_id in ["rangpur", "dinajpur", "rajshahi", "bogura"]:
        rain_anomaly = -22.5
        ndvi_val = 0.49
        dry_days = 19
        mean_t = 29.8
        max_t = 34.5
    elif district_id in ["sylhet", "mymensingh"]:
        rain_anomaly = +18.0
        ndvi_val = 0.68
        dry_days = 5
        mean_t = 28.1
        max_t = 32.0
    else:
        rain_anomaly = -5.0
        ndvi_val = 0.58
        dry_days = 11
        mean_t = 28.5
        max_t = 33.0

    total_rain = max(20, dist["avg_annual_rainfall_mm"] * 0.4 * (1 + rain_anomaly / 100.0))

    return {
        "district_id": dist["id"],
        "district_name_en": dist["name_en"],
        "district_name_bn": dist["name_bn"],
        "crop_id": crop["id"],
        "crop_name_en": crop["name_en"],
        "crop_name_bn": crop["name_bn"],
        "season": crop["season"],
        "season_bn": crop["season_bn"],
        "ndvi_mean": ndvi_val,
        "ndvi_max": round(ndvi_val + 0.12, 3),
        "total_rainfall_mm": round(total_rain, 1),
        "rain_anomaly_pct": rain_anomaly,
        "mean_temp_c": mean_t,
        "max_temp_c": max_t,
        "consecutive_dry_days": dry_days,
        "soil_organic_carbon": dist["soil_organic_carbon"],
        "soil_ph": dist["soil_ph"],
        "soil_clay_pct": dist["soil_clay_pct"],
        "soil_sand_pct": dist["soil_sand_pct"],
        "baseline_yield_tha": crop["baseline_yield_tha"]
    }

def get_district_geojson(district_id: str) -> Dict[str, Any]:
    """Generates synthetic GeoJSON boundary and NDVI polygon tiles for Leaflet."""
    districts = {d["id"]: d for d in load_districts()}
    dist = districts.get(district_id, districts["rangpur"])
    lat = dist["lat"]
    lon = dist["lon"]
    d_lat = 0.25
    d_lon = 0.30

    # Create polygon coordinates around centroid
    coords = [
        [lon - d_lon, lat - d_lat],
        [lon + d_lon, lat - d_lat],
        [lon + d_lon + 0.05, lat + d_lat],
        [lon - d_lon - 0.05, lat + d_lat],
        [lon - d_lon, lat - d_lat]
    ]

    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "district_id": dist["id"],
                    "name_en": dist["name_en"],
                    "name_bn": dist["name_bn"],
                    "ndvi_score": 0.52 if dist["id"] in ["rangpur", "rajshahi"] else 0.65,
                    "status": "Moderate Vigor" if dist["id"] in ["rangpur", "rajshahi"] else "Healthy Vegetation"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [coords]
                }
            }
        ]
    }
