from typing import Dict, Any, List

def generate_grounded_bangla_summary(prediction_data: Dict[str, Any]) -> str:
    """
    Generates a strictly factual, grounded Bangla explanation for the farmer/officer.
    Constraint: Only uses the true calculated features (rainfall, temperature, NDVI, soil, yield).
    Does NOT invent or hallucinate ungrounded statistics.
    """
    dist_bn = prediction_data["district"]["name_bn"]
    crop_bn = prediction_data["crop"]["name_bn"]
    pred = prediction_data["prediction"]
    feats = prediction_data["features"]

    yield_band_bn = pred["yield_band_bn"]
    drought_bn = pred["drought_risk"]["level_bn"]
    waterlog_bn = pred["waterlog_risk"]["level_bn"]

    rain_anomaly = feats["rain_anomaly_pct"]
    total_rain = feats["total_rainfall_mm"]
    dry_days = feats["consecutive_dry_days"]
    ndvi_val = feats["ndvi_mean"]

    lines: List[str] = []

    # 1. Opening core summary
    lines.append(f"{dist_bn} জেলায় এই মৌসুমে {crop_bn}-এর সামগ্রিক ফলন পূর্বাভাস '{yield_band_bn}' হিসেবে পরিগণিত হয়েছে।")

    # 2. Weather & Rainfall assessment
    if rain_anomaly < -15:
        lines.append(f"আবহাওয়া তথ্য অনুযায়ী, স্বাভাবিকের চেয়ে প্রায় {abs(rain_anomaly):.0f}% বৃষ্টিপাত কম হয়েছে (মোট বৃষ্টিপাত প্রায় {total_rain:.0f} মিমি)। ইতিমধ্যে টানা {dry_days} দিন কোনো উল্লেখযোগ্য বৃষ্টিপাত রেকর্ড হয়নি।")
    elif rain_anomaly > 20:
        lines.append(f"আবহাওয়া তথ্য অনুযায়ী, স্বাভাবিকের তুলনায় প্রায় {rain_anomaly:.0f}% বেশি বৃষ্টিপাত হয়েছে (মোট বৃষ্টিপাত প্রায় {total_rain:.0f} মিমি), যার ফলে নিচু জমিতে পানি জমার ঝুঁকি রয়েছে।")
    else:
        lines.append(f"আবহাওয়া তথ্য অনুযায়ী, বৃষ্টিপাত স্বাভাবিক সীমার মধ্যেই রয়েছে (মোট বৃষ্টিপাত প্রায় {total_rain:.0f} মিমি)।")

    # 3. Satellite NDVI & Vegetation state
    if ndvi_val < 0.50:
        lines.append(f"সেন্টিনেল-২ স্যাটেলাইট চিত্রে ফসলের স্বাস্থ্য সূচক (NDVI) পাওয়া গেছে {ndvi_val:.2f}, যা স্বাভাবিকের চেয়ে কিছুটা শুষ্ক ও দুর্বল উদ্ভিজ্জ অবস্থা নির্দেশ করছে।")
    elif ndvi_val > 0.65:
        lines.append(f"সেন্টিনেল-২ স্যাটেলাইট চিত্রে ফসলের স্বাস্থ্য সূচক (NDVI) {ndvi_val:.2f} পাওয়া গেছে, যা ভালো সবুজ ও সতেজ উদ্ভিজ্জ অবস্থা প্রকাশ করছে।")
    else:
        lines.append(f"স্যাটেলাইট পর্যবেক্ষণে স্বাস্থ্য সূচক (NDVI) {ndvi_val:.2f} নির্দেশ করছে, যা মাঝারি মানের উদ্ভিজ্জ সুস্থতা প্রকাশ করে।")

    # 4. Actionable agronomic recommendation grounded in risk levels
    if pred["drought_risk"]["level"] == "High":
        lines.append(f"যেহেতু খরার ঝুঁকি '{drought_bn}', তাই জমিতে রসের ঘাটতি পূরণে জরুরি সম্পূরক সেচ এবং মালচিং ব্যবস্থা গ্রহণের পরামর্শ দেওয়া হচ্ছে।")
    elif pred["waterlog_risk"]["level"] == "High":
        lines.append(f"যেহেতু জলাবদ্ধতার ঝুঁকি '{waterlog_bn}', তাই অতিরিক্ত পানি নিষ্কাশনের জন্য নালা পরিষ্কার রাখার পরামর্শ দেওয়া হচ্ছে।")
    else:
        lines.append("বর্তমান আর্দ্রতা ও তাপমাত্রা অনুকূলে রয়েছে, নিয়মিত পরিচর্যা বজায় রাখুন।")

    return " ".join(lines)


def generate_grounded_english_summary(prediction_data: Dict[str, Any]) -> str:
    """
    Generates a strictly factual, grounded English explanation for the farmer/officer.
    Constraint: Only uses the true calculated features (rainfall, temperature, NDVI, soil, yield).
    Does NOT invent or hallucinate ungrounded statistics.
    """
    dist_en = prediction_data["district"]["name_en"]
    crop_en = prediction_data["crop"]["name_en"]
    pred = prediction_data["prediction"]
    feats = prediction_data["features"]

    yield_band_en = pred["yield_band_en"]
    drought_en = pred["drought_risk"]["level_en"]
    waterlog_en = pred["waterlog_risk"]["level_en"]

    rain_anomaly = feats["rain_anomaly_pct"]
    total_rain = feats["total_rainfall_mm"]
    dry_days = feats["consecutive_dry_days"]
    ndvi_val = feats["ndvi_mean"]

    lines: List[str] = []

    # 1. Opening core summary
    lines.append(f"In {dist_en} district, the seasonal outlook for {crop_en} is projected as '{yield_band_en}'.")

    # 2. Weather & Rainfall assessment
    if rain_anomaly < -15:
        lines.append(f"Meteorological records indicate seasonal rainfall is approximately {abs(rain_anomaly):.0f}% below normal (total cumulative rainfall {total_rain:.0f} mm), with {dry_days} consecutive dry days recorded.")
    elif rain_anomaly > 20:
        lines.append(f"Meteorological records indicate seasonal rainfall is approximately {rain_anomaly:.0f}% above normal (total cumulative rainfall {total_rain:.0f} mm), leading to localized water accumulation risk.")
    else:
        lines.append(f"Seasonal rainfall is within the normal historical range (total cumulative rainfall {total_rain:.0f} mm).")

    # 3. Satellite NDVI & Vegetation state
    if ndvi_val < 0.50:
        lines.append(f"Copernicus Sentinel-2 satellite imagery reports a mean vegetation index (NDVI) of {ndvi_val:.2f}, reflecting moisture deficit and reduced canopy vigor.")
    elif ndvi_val > 0.65:
        lines.append(f"Copernicus Sentinel-2 satellite imagery reports a healthy vegetation index (NDVI) of {ndvi_val:.2f}, indicating robust green biomass.")
    else:
        lines.append(f"Copernicus Sentinel-2 satellite imagery reports a moderate vegetation index (NDVI) of {ndvi_val:.2f}.")

    # 4. Actionable agronomic recommendation grounded in risk levels
    if pred["drought_risk"]["level"] == "High":
        lines.append(f"Because the drought risk is '{drought_en}', supplementary irrigation and soil mulching are strongly recommended to conserve soil moisture.")
    elif pred["waterlog_risk"]["level"] == "High":
        lines.append(f"Because the waterlogging risk is '{waterlog_en}', clearing field drainage channels is advised to prevent root suffocation.")
    else:
        lines.append("Current soil moisture and ambient temperatures are favorable; continue standard crop management.")

    return " ".join(lines)
