import json
import math
from pathlib import Path
from typing import Dict, Any, Optional

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "districts.json"

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two GPS coordinates."""
    r = 6371.0  # Earth radius in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c

def reverse_geocode_district(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """
    Finds the closest Bangladesh district for given GPS coordinates.
    First checks bounding box containment; if none match, chooses closest centroid.
    """
    if not DATA_PATH.exists():
        return None

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        districts = json.load(f)

    # Check bounding boxes first
    for dist in districts:
        bbox = dist.get("bbox")
        if bbox:
            min_lat, min_lon, max_lat, max_lon = bbox
            if min_lat <= lat <= max_lat and min_lon <= lon <= max_lon:
                return {
                    "district_id": dist["id"],
                    "name_en": dist["name_en"],
                    "name_bn": dist["name_bn"],
                    "division": dist["division"],
                    "distance_km": 0.0
                }

    # Fallback to closest centroid
    closest_dist = None
    min_dist = float("inf")
    for dist in districts:
        d = haversine_distance(lat, lon, dist["lat"], dist["lon"])
        if d < min_dist:
            min_dist = d
            closest_dist = dist

    if closest_dist:
        return {
            "district_id": closest_dist["id"],
            "name_en": closest_dist["name_en"],
            "name_bn": closest_dist["name_bn"],
            "division": closest_dist["division"],
            "distance_km": round(min_dist, 1)
        }
    return None
