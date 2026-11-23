import json
import re
from typing import Dict, Any, Optional, List
from backend.app.data.geo_features import load_districts, load_crops, get_current_season_features
from backend.app.services.gemini_service import call_gemini_multimodal, get_gemini_api_key

# Economic benchmarks per bigha (33 decimals) in Bangladesh (BBS / DAE 2025-2026 averages)
CROP_ECONOMICS = {
    "aman_rice": {
        "name_en": "T. Aman Rice",
        "name_bn": "রোপা আমন ধান",
        "season_en": "Kharif-2 (Jul - Dec)",
        "season_bn": "খরিপ-২ (আষাঢ় - অগ্রহায়ণ)",
        "yield_maund_per_bigha": 22.5,
        "market_price_per_maund_bdt": 1250,
        "seed_cost_bdt": 900,
        "fertilizer_cost_bdt": 3800,
        "irrigation_cost_bdt": 2200,
        "labor_tillage_bdt": 5500,
        "recommended_seeds": ["ব্রি ধান-৮৭ (BRRI dhan-87)", "বিনা ধান-১৭ (BINA dhan-17)", "ব্রি ধান-৭১ (খরা সহনশীল)"],
        "best_months": ["আষাঢ় (বীজতলা)", "শ্রাবণ (রোপণ)", "ভাদ্র (সার প্রয়োগ)", "আশ্বিন (থোর অবস্থা)", "কার্তিক-অগ্রহায়ণ (কর্তন)"],
        "technique_en": "Alternate Wetting & Drying (AWD) irrigation with balanced NPK + Zinc",
        "technique_bn": "এডব্লিউডি (AWD) পার্চিপ সেচ পদ্ধতি ও সুষম দস্তা-পটাশ সার প্রয়োগ",
        "suitability_base": 92
    },
    "potato": {
        "name_en": "Potato",
        "name_bn": "গোল আলু",
        "season_en": "Rabi (Nov - Mar)",
        "season_bn": "রবি (কার্তিক - ফাল্গুন)",
        "yield_maund_per_bigha": 85.0,
        "market_price_per_maund_bdt": 850,
        "seed_cost_bdt": 12000,
        "fertilizer_cost_bdt": 8500,
        "irrigation_cost_bdt": 4000,
        "labor_tillage_bdt": 9500,
        "recommended_seeds": ["ডায়মন্ড (Diamond)", "কার্ডিনাল (Cardinal)", "বারি আলু-৭ (বিপুল ফলন)"],
        "best_months": ["কার্তিক (জমি প্রস্তুত)", "অগ্রহায়ণ (বীজ রোপণ)", "পৌষ (আগাছা ও সেচ)", "মাঘ (ব্লাইট প্রতিরোধ)", "ফাল্গুন (আলু উত্তোলন)"],
        "technique_en": "High-bed furrow planting with certified seed tubers and preventative late-blight fungicide",
        "technique_bn": "উঁচু বেড পদ্ধতি, প্রত্যয়িত বীজ কন্দ ব্যবহার এবং আগাম নাবি ধসা রোগ প্রতিরোধ",
        "suitability_base": 95
    },
    "wheat": {
        "name_en": "Wheat",
        "name_bn": "গম",
        "season_en": "Rabi (Nov - Mar)",
        "season_bn": "রবি (অগ্রহায়ণ - ফাল্গুন)",
        "yield_maund_per_bigha": 15.0,
        "market_price_per_maund_bdt": 1550,
        "seed_cost_bdt": 1400,
        "fertilizer_cost_bdt": 3600,
        "irrigation_cost_bdt": 1800,
        "labor_tillage_bdt": 4500,
        "recommended_seeds": ["বারি গম-৩৩ (ব্লাস্ট প্রতিরোধী)", "বারি গম-৩২", "ডব্লিউএমআরআই গম-১"],
        "best_months": ["অগ্রহায়ণ (বপন)", "পৌষ (প্রথম সেচ ক্রাউন রুটে)", "মাঘ (শীষ বের হওয়া)", "ফাল্গুন (দানা পুষ্ট হওয়া ও কর্তন)"],
        "technique_en": "Strip-tillage planting directly after Aman harvest with timely crown-root irrigation",
        "technique_bn": "আমন কাটার পরপরই জিরো-টিলেজ পদ্ধতিতে দ্রুত বপন এবং সিআরআই (CRI) পর্যায়ে সেচ",
        "suitability_base": 88
    },
    "boro_rice": {
        "name_en": "Boro Rice",
        "name_bn": "বোরো ধান",
        "season_en": "Rabi (Dec - May)",
        "season_bn": "রবি (পৌষ - বৈশাখ)",
        "yield_maund_per_bigha": 28.0,
        "market_price_per_maund_bdt": 1200,
        "seed_cost_bdt": 1100,
        "fertilizer_cost_bdt": 5200,
        "irrigation_cost_bdt": 5500,
        "labor_tillage_bdt": 6200,
        "recommended_seeds": ["ব্রি ধান-২৮ / ২৯", "ব্রি ধান-৮৯ / ৯২ (উচ্চ ফলন)", "হাইব্রিড তেজ গোল্ড"],
        "best_months": ["পৌষ (রোপণ)", "মাঘ (কুশি বৃদ্ধি)", "ফাল্গুন (ইউরিয়া প্রয়োগ)", "চৈত্র (দানা গঠন)", "বৈশাখ (কাটা ও মাড়াই)"],
        "technique_en": "AWD water-saving pipes with slow-release Guti Urea to slash nitrogen costs by 30%",
        "technique_bn": "ম্যাজিক পাইপ দিয়ে এডব্লিউডি সেচ এবং গুটি ইউরিয়া ব্যবহারে ৩০% সার সাশ্রয়",
        "suitability_base": 90
    },
    "mustard": {
        "name_en": "Mustard",
        "name_bn": "সরিষা",
        "season_en": "Rabi (Oct - Jan)",
        "season_bn": "রবি (কার্তিক - মাঘ)",
        "yield_maund_per_bigha": 7.5,
        "market_price_per_maund_bdt": 3400,
        "seed_cost_bdt": 600,
        "fertilizer_cost_bdt": 2800,
        "irrigation_cost_bdt": 1200,
        "labor_tillage_bdt": 3500,
        "recommended_seeds": ["বারি সরিষা-১৪ (স্বল্পমেয়াদী)", "বারি সরিষা-১৭", "বিনা সরিষা-৯"],
        "best_months": ["কার্তিক (বপন)", "অগ্রহায়ণ (ফুল আসা ও সেচ)", "পৌষ (দানা পুষ্ট হওয়া)", "মাঘ (ফসল সংগ্রহ)"],
        "technique_en": "Inter-cropping in Aman-Mustard-Boro relay rotation with sulphur fertilization",
        "technique_bn": "আমন ও বোরো ধানের মাঝে রিলে ফসল হিসেবে স্বল্পমেয়াদী সরিষা ও জিপসাম প্রয়োগ",
        "suitability_base": 94
    },
    "maize": {
        "name_en": "Maize / Corn",
        "name_bn": "ভুট্টা",
        "season_en": "Rabi (Nov - Apr)",
        "season_bn": "রবি (অগ্রহায়ণ - চৈত্র)",
        "yield_maund_per_bigha": 38.0,
        "market_price_per_maund_bdt": 1050,
        "seed_cost_bdt": 2200,
        "fertilizer_cost_bdt": 6500,
        "irrigation_cost_bdt": 3500,
        "labor_tillage_bdt": 5800,
        "recommended_seeds": ["এনকে-৪০", "পায়োনিয়ার পি-৩৩৫৫", "লাল তীর সুপার হাইব্রিড"],
        "best_months": ["অগ্রহায়ণ (বপন)", "পৌষ (গাছের প্রাথমিক বৃদ্ধি)", "মাঘ (টাসেলিং পর্যায়)", "ফাল্গুন (মোচা পুষ্ট)", "চৈত্র (কর্তন)"],
        "technique_en": "Ridge bed planting with drip/furrow irrigation and fall armyworm pheromone traps",
        "technique_bn": "আইল/বেড রোপণ পদ্ধতি এবং ফল আর্মিওয়ার্ম দমনে ফেরোমোন ফাঁদ ব্যবহার",
        "suitability_base": 91
    },
    "aus_rice": {
        "name_en": "Aus Rice",
        "name_bn": "আউশ ধান",
        "season_en": "Kharif-1 (Apr - Aug)",
        "season_bn": "খরিপ-১ (বৈশাখ - শ্রাবণ)",
        "yield_maund_per_bigha": 16.5,
        "market_price_per_maund_bdt": 1220,
        "seed_cost_bdt": 850,
        "fertilizer_cost_bdt": 3200,
        "irrigation_cost_bdt": 1200,
        "labor_tillage_bdt": 4800,
        "recommended_seeds": ["ব্রি ধান-৪৮", "ব্রি ধান-৯৮", "বিনা ধান-১৯ (খরা সহনশীল)"],
        "best_months": ["চৈত্র-বৈশাখ (বপন)", "জ্যৈষ্ঠ (নিড়ানি)", "আষাঢ় (শীষ বের হওয়া)", "শ্রাবণ (কর্তন)"],
        "technique_en": "Direct seeded rice (DSR) to utilize pre-monsoon showers and save water",
        "technique_bn": "সরাসরি বীজ বপন (DSR) ও প্রাক-বর্ষার বৃষ্টি কাজে লাগিয়ে সেচ সাশ্রয়",
        "suitability_base": 86
    },
    "jute": {
        "name_en": "Jute",
        "name_bn": "তোষা পাট",
        "season_en": "Kharif-1 (Mar - Jul)",
        "season_bn": "খরিপ-১ (চৈত্র - আষাঢ়)",
        "yield_maund_per_bigha": 12.0,
        "market_price_per_maund_bdt": 3200,
        "seed_cost_bdt": 750,
        "fertilizer_cost_bdt": 2900,
        "irrigation_cost_bdt": 1100,
        "labor_tillage_bdt": 5200,
        "recommended_seeds": ["বিজেআরআই তোষা পাট-৮ (রবি-১)", "ও-৯৮৯৭", "জেআরও-৫২৪"],
        "best_months": ["চৈত্র (বপন)", "বৈশাখ (পাতলাকরণ ও নিড়ানি)", "জ্যৈষ্ঠ (বৃদ্ধি ও সার)", "আষাঢ় (কর্তন ও জাগ দেওয়া)"],
        "technique_en": "Line sowing with ribbon retting technique for high-grade golden fiber",
        "technique_bn": "সারিবদ্ধ বপন এবং রিবন রেটিং পদ্ধতিতে উন্নত সোনালী আঁশ প্রস্তুত",
        "suitability_base": 89
    }
}

def analyze_land_intelligence(
    district_id: str,
    land_size_bigha: float = 1.0,
    target_crop_id: Optional[str] = None,
    seed_variety: Optional[str] = None,
    query_text: Optional[str] = None,
    image_bytes: Optional[bytes] = None,
    audio_bytes: Optional[bytes] = None
) -> Dict[str, Any]:
    """
    Predicts optimal crop, seasonal calendar, and economic profit potential for a specific land location.
    Integrates Gemini API when key is available, with full expert agricultural fallback.
    """
    districts = {d["id"]: d for d in load_districts()}
    dist = districts.get(district_id, districts["rangpur"])

    feats = get_current_season_features(district_id, target_crop_id or "aman_rice")

    # Determine primary crop to analyze
    primary_crop_id = target_crop_id if target_crop_id in CROP_ECONOMICS else "aman_rice"
    econ = CROP_ECONOMICS[primary_crop_id]

    # Calculate economics scaled by land size
    yield_maund = round(econ["yield_maund_per_bigha"] * land_size_bigha, 1)
    revenue = int(yield_maund * econ["market_price_per_maund_bdt"])

    cost_seed = int(econ["seed_cost_bdt"] * land_size_bigha)
    cost_fert = int(econ["fertilizer_cost_bdt"] * land_size_bigha)
    cost_irri = int(econ["irrigation_cost_bdt"] * land_size_bigha)
    cost_labor = int(econ["labor_tillage_bdt"] * land_size_bigha)
    total_cost = cost_seed + cost_fert + cost_irri + cost_labor

    net_profit = revenue - total_cost
    roi = round((net_profit / total_cost) * 100.0, 1) if total_cost > 0 else 0

    # Build crop recommendation rankings for this land
    recommendations = []
    for c_id, c_data in CROP_ECONOMICS.items():
        suitability = c_data["suitability_base"]
        # Soil pH adjustment
        if abs(dist["soil_ph"] - 6.5) > 0.8:
            suitability -= 5
        # Drought vulnerability adjustment
        if dist["id"] in ["rangpur", "dinajpur", "rajshahi"] and feats["rain_anomaly_pct"] < -15:
            if c_id in ["potato", "mustard", "wheat"]:
                suitability += 4  # Low water requirement crops
            elif c_id == "boro_rice":
                suitability -= 8  # High water requirement crop

        c_yield = c_data["yield_maund_per_bigha"] * land_size_bigha
        c_rev = c_yield * c_data["market_price_per_maund_bdt"]
        c_cost = (c_data["seed_cost_bdt"] + c_data["fertilizer_cost_bdt"] + c_data["irrigation_cost_bdt"] + c_data["labor_tillage_bdt"]) * land_size_bigha
        c_profit = int(c_rev - c_cost)

        recommendations.append({
            "crop_id": c_id,
            "name_en": c_data["name_en"],
            "name_bn": c_data["name_bn"],
            "season_en": c_data["season_en"],
            "season_bn": c_data["season_bn"],
            "suitability_pct": min(98, max(65, suitability)),
            "estimated_profit_bdt": c_profit,
            "profit_rating": "High" if c_profit > 15000 * land_size_bigha else ("Moderate" if c_profit > 8000 * land_size_bigha else "Low"),
            "recommended_seeds": c_data["recommended_seeds"][:2]
        })

    recommendations.sort(key=lambda x: (x["suitability_pct"], x["estimated_profit_bdt"]), reverse=True)

    # Check if Gemini API is available to generate all intelligence from AI
    gemini_key = get_gemini_api_key()
    if gemini_key:
        prompt = f"""
You are Bhumi Drishti's senior Agricultural Economist & Chief AI Agronomist for Bangladesh.
Perform a comprehensive agronomic and financial simulation for this farmer's specific land.

Land & Environmental Profile:
- District: {dist['name_en']} ({dist['name_bn']}), Division: {dist['division']}
- Soil Profile: {dist['soil_type']}, pH: {dist['soil_ph']}, Organic Carbon: {dist['soil_organic_carbon']}%
- Weather Forecast: Seasonal Rainfall Anomaly {feats['rain_anomaly_pct']}%, Consecutive Dry Days: {feats['consecutive_dry_days']}
- Sentinel-2 Satellite NDVI Vigor: {feats['ndvi_mean']}
- Land Area: {land_size_bigha} Bigha (33 decimals per bigha)
- Target Crop: {econ['name_en']} ({econ['name_bn']})
- Specified Seed Variety: {seed_variety or 'Recommended certified hybrid'}
- Farmer's Query / Problem: "{query_text or 'Which crop is most profitable on this land and what is the full cost and revenue breakdown?'}"

Generate ALL data for this land intelligence assessment directly from your agricultural knowledge base.
All economic values must be realistically calculated in Bangladeshi Taka (BDT) for {land_size_bigha} bigha of land in {dist['name_en']}.

Respond strictly in valid JSON format matching this schema:
{{
  "economic_projection": {{
    "yield_maund_total": <expected total yield in maunds (1 maund = 40 kg) for {land_size_bigha} bighas as a number>,
    "market_price_per_maund_bdt": <current prevailing farmgate market price per maund in BDT as an integer>,
    "gross_revenue_bdt": <total gross revenue as an integer>,
    "costs_breakdown": {{
      "seeds_bdt": <seed expenditure in BDT as an integer>,
      "fertilizers_bdt": <fertilizer (urea, tsp, mop, zinc) expenditure in BDT as an integer>,
      "irrigation_bdt": <irrigation diesel/electric cost in BDT as an integer>,
      "labor_tillage_bdt": <tillage, transplanting, weeding, harvest labor cost in BDT as an integer>,
      "total_cost_bdt": <sum of all costs in BDT as an integer>
    }},
    "net_profit_bdt": <gross_revenue_bdt minus total_cost_bdt as an integer>,
    "roi_pct": <return on investment percentage as a float>,
    "profit_rating": "High (উচ্চ লাভজনক)" or "Moderate (মাঝারি লাভ)"
  }},
  "recommended_crops_ranking": [
    {{
      "crop_id": "one of: potato, boro_rice, wheat, mustard, maize, aman_rice, jute, aus_rice",
      "name_en": "string",
      "name_bn": "string",
      "season_en": "string",
      "season_bn": "string",
      "suitability_pct": <integer percentage 70-98>,
      "estimated_profit_bdt": <estimated net profit in BDT for {land_size_bigha} bigha as integer>,
      "profit_rating": "High" or "Moderate",
      "recommended_seeds": ["variety 1", "variety 2"]
    }}
  ],
  "timeline_stages": [
    {{
      "month": "Bangla month with English (e.g. পৌষ (Jan))",
      "phase_en": "English task description",
      "phase_bn": "Bangla task description",
      "icon": "sprout" or "leaf" or "droplet" or "sun" or "coins"
    }}
  ],
  "optimal_techniques": {{
    "seed_recommendations": ["variety 1", "variety 2"],
    "technique_en": "English technique description",
    "technique_bn": "Bangla technique description"
  }},
  "advisory_bn": "Detailed rural-friendly guidance in natural Bangla specifically addressing the farmer query and giving practical field steps",
  "advisory_en": "Detailed agronomic and financial evaluation in English"
}}
"""
        raw_res = call_gemini_multimodal(
            prompt=prompt,
            image_bytes=image_bytes,
            audio_bytes=audio_bytes
        )

        if raw_res:
            try:
                clean_json = re.sub(r'```json\s*|\s*```', '', raw_res).strip()
                parsed = json.loads(clean_json)

                if "economic_projection" in parsed and "advisory_bn" in parsed:
                    ai_econ = parsed["economic_projection"]
                    ai_costs = ai_econ.get("costs_breakdown", {})
                    
                    return {
                        "district": {
                            "id": dist["id"],
                            "name_en": dist["name_en"],
                            "name_bn": dist["name_bn"],
                            "soil_type": dist["soil_type"],
                            "soil_ph": dist["soil_ph"],
                            "soil_organic_carbon": dist["soil_organic_carbon"],
                            "lat": dist["lat"],
                            "lon": dist["lon"]
                        },
                        "land_size_bigha": land_size_bigha,
                        "selected_crop": {
                            "id": primary_crop_id,
                            "name_en": econ["name_en"],
                            "name_bn": econ["name_bn"],
                            "season_en": econ["season_en"],
                            "season_bn": econ["season_bn"],
                            "seed_variety": seed_variety or econ["recommended_seeds"][0]
                        },
                        "economic_projection": {
                            "yield_maund_total": float(ai_econ.get("yield_maund_total", yield_maund)),
                            "market_price_per_maund_bdt": int(ai_econ.get("market_price_per_maund_bdt", econ["market_price_per_maund_bdt"])),
                            "gross_revenue_bdt": int(ai_econ.get("gross_revenue_bdt", revenue)),
                            "costs_breakdown": {
                                "seeds_bdt": int(ai_costs.get("seeds_bdt", cost_seed)),
                                "fertilizers_bdt": int(ai_costs.get("fertilizers_bdt", cost_fert)),
                                "irrigation_bdt": int(ai_costs.get("irrigation_bdt", cost_irri)),
                                "labor_tillage_bdt": int(ai_costs.get("labor_tillage_bdt", cost_labor)),
                                "total_cost_bdt": int(ai_costs.get("total_cost_bdt", total_cost))
                            },
                            "net_profit_bdt": int(ai_econ.get("net_profit_bdt", net_profit)),
                            "roi_pct": float(ai_econ.get("roi_pct", roi)),
                            "profit_rating": str(ai_econ.get("profit_rating", "High (উচ্চ লাভজনক)"))
                        },
                        "recommended_crops_ranking": parsed.get("recommended_crops_ranking") or recommendations,
                        "timeline_stages": parsed.get("timeline_stages") or [
                            {
                                "month": m_name,
                                "phase_en": ["Land Preparation & Sowing", "Early Growth & Basal Fertilizer", "Irrigation & Weeding", "Grain / Tuber Formation", "Harvesting & Market Sales"][min(i if i < len(econ["best_months"]) - 1 else 4, 4)],
                                "phase_bn": ["জমি প্রস্তুত ও বীজ বপন/রোপণ", "চারা বৃদ্ধি ও প্রাথমিক সার", "সেচ ব্যবস্থাপনা ও নিড়ানি", "শীষ বের হওয়া / দানা গঠন", "ফসল কর্তন ও বাজারে বিক্রয়"][min(i if i < len(econ["best_months"]) - 1 else 4, 4)],
                                "icon": ["sprout", "leaf", "droplet", "sun", "coins"][min(i if i < len(econ["best_months"]) - 1 else 4, 4)]
                            }
                            for i, m_name in enumerate(econ["best_months"])
                        ],
                        "optimal_techniques": parsed.get("optimal_techniques") or {
                            "seed_recommendations": econ["recommended_seeds"],
                            "technique_en": econ["technique_en"],
                            "technique_bn": econ["technique_bn"]
                        },
                        "advisory": {
                            "bn": parsed.get("advisory_bn", ""),
                            "en": parsed.get("advisory_en", ""),
                            "source": "Google Gemini 2.5 Intelligence"
                        }
                    }
            except Exception as e:
                print(f"Error parsing Gemini Land Intelligence JSON: {e}")

    # Fallback to local deterministic calculation
    custom_advisory_bn = (
        f"{dist['name_bn']} জেলায় {land_size_bigha} বিঘা জমিতে {econ['name_bn']} চাষে "
        f"আনুমানিক মোট {yield_maund:.0f} মণ ফলন পাওয়া সম্ভব। বর্তমান বাজারমূল্য অনুযায়ী মোট বিক্রয় মূল্য প্রায় "
        f"৳{revenue:,} টাকা এবং বীজ, সার, সেচ ও শ্রমিক বাবদ মোট খরচ হবে প্রায় ৳{total_cost:,} টাকা। "
        f"সব মিলিয়ে প্রত্যাশিত নিট লাভ প্রায় ৳{net_profit:,} টাকা (মুনাফার হার {roi}%)। "
        f"উচ্চ ফলন নিশ্চিত করতে {', '.join(econ['recommended_seeds'][:2])} জাতের প্রত্যয়িত বীজ ব্যবহার করুন "
        f"এবং {econ['technique_bn']} অনুসরণ করার পরামর্শ দেওয়া হচ্ছে।"
    )
    custom_advisory_en = (
        f"For {land_size_bigha} bigha of land in {dist['name_en']}, cultivating {econ['name_en']} is projected "
        f"to yield approximately {yield_maund:.0f} maunds. At prevailing market rates, gross revenue is estimated at "
        f"৳{revenue:,} BDT against production costs of ৳{total_cost:,} BDT, generating an estimated net profit of "
        f"৳{net_profit:,} BDT (ROI: {roi}%). Recommended seed varieties include {', '.join(econ['recommended_seeds'][:2])} "
        f"with {econ['technique_en']}."
    )

    return {
        "district": {
            "id": dist["id"],
            "name_en": dist["name_en"],
            "name_bn": dist["name_bn"],
            "soil_type": dist["soil_type"],
            "soil_ph": dist["soil_ph"],
            "soil_organic_carbon": dist["soil_organic_carbon"],
            "lat": dist["lat"],
            "lon": dist["lon"]
        },
        "land_size_bigha": land_size_bigha,
        "selected_crop": {
            "id": primary_crop_id,
            "name_en": econ["name_en"],
            "name_bn": econ["name_bn"],
            "season_en": econ["season_en"],
            "season_bn": econ["season_bn"],
            "seed_variety": seed_variety or econ["recommended_seeds"][0]
        },
        "economic_projection": {
            "yield_maund_total": yield_maund,
            "market_price_per_maund_bdt": econ["market_price_per_maund_bdt"],
            "gross_revenue_bdt": revenue,
            "costs_breakdown": {
                "seeds_bdt": cost_seed,
                "fertilizers_bdt": cost_fert,
                "irrigation_bdt": cost_irri,
                "labor_tillage_bdt": cost_labor,
                "total_cost_bdt": total_cost
            },
            "net_profit_bdt": net_profit,
            "roi_pct": roi,
            "profit_rating": "High (উচ্চ লাভজনক)" if net_profit > 15000 * land_size_bigha else "Moderate (মাঝারি)"
        },
        "recommended_crops_ranking": recommendations,
        "timeline_stages": [
            {
                "month": m_name,
                "phase_en": [
                    "Land Preparation & Sowing",
                    "Early Growth & Basal Fertilizer",
                    "Irrigation & Weeding",
                    "Grain / Tuber Formation",
                    "Harvesting & Market Sales"
                ][min(i if i < len(econ["best_months"]) - 1 else 4, 4)],
                "phase_bn": [
                    "জমি প্রস্তুত ও বীজ বপন/রোপণ",
                    "চারা বৃদ্ধি ও প্রাথমিক সার",
                    "সেচ ব্যবস্থাপনা ও নিড়ানি",
                    "শীষ বের হওয়া / দানা গঠন",
                    "ফসল কর্তন ও বাজারে বিক্রয়"
                ][min(i if i < len(econ["best_months"]) - 1 else 4, 4)],
                "icon": ["sprout", "leaf", "droplet", "sun", "coins"][min(i if i < len(econ["best_months"]) - 1 else 4, 4)]
            }
            for i, m_name in enumerate(econ["best_months"])
        ],
        "optimal_techniques": {
            "seed_recommendations": econ["recommended_seeds"],
            "technique_en": econ["technique_en"],
            "technique_bn": econ["technique_bn"]
        },
        "advisory": {
            "bn": custom_advisory_bn,
            "en": custom_advisory_en,
            "source": "Agronomic Intelligence Engine"
        }
    }
