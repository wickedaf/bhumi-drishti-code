from fastapi import APIRouter, UploadFile, File, Form, Response, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List

from backend.app.services.multimodal import parse_colloquial_bangla, analyze_crop_image
from backend.app.core.geocoder import reverse_geocode_district
from backend.app.services.tts import generate_simple_tone_wav
from backend.app.services.land_intelligence import analyze_land_intelligence
from backend.app.services.gemini_service import get_gemini_api_key, set_gemini_api_key

router = APIRouter(prefix="/api/assist", tags=["Multimodal & Land Intelligence"])

class LocationRequest(BaseModel):
    latitude: float
    longitude: float

class TextQueryRequest(BaseModel):
    text: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class LandIntelligenceRequest(BaseModel):
    district_id: str
    land_size_bigha: float = 1.0
    target_crop_id: Optional[str] = None
    seed_variety: Optional[str] = None
    query_text: Optional[str] = None
    gemini_api_key: Optional[str] = None

class ApiKeyConfigRequest(BaseModel):
    gemini_api_key: str

@router.post("/locate")
def locate_by_gps(req: LocationRequest):
    """Resolves device GPS coordinates into the nearest Bangladesh district."""
    result = reverse_geocode_district(req.latitude, req.longitude)
    if not result:
        raise HTTPException(status_code=404, detail="Location could not be resolved to a supported district.")
    return result

@router.post("/voice")
async def process_voice_input(
    audio_file: Optional[UploadFile] = File(None),
    transcript_hint: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    x_gemini_api_key: Optional[str] = Header(None)
):
    """
    Processes voice audio recording (WebM/WAV) or speech transcript.
    Extracts district, crop, seed, and observed field symptoms in colloquial Bangla/English.
    """
    if x_gemini_api_key:
        set_gemini_api_key(x_gemini_api_key)

    audio_bytes = None
    if audio_file:
        audio_bytes = await audio_file.read()

    text_to_parse = transcript_hint or ""
    result = parse_colloquial_bangla(
        text=text_to_parse,
        audio_bytes=audio_bytes,
        lat=latitude,
        lon=longitude
    )
    return result

@router.post("/image")
async def process_crop_image(
    image_file: Optional[UploadFile] = File(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    x_gemini_api_key: Optional[str] = Header(None)
):
    """
    Processes a field or leaf photo using Gemini Vision or expert heuristic system.
    Detects crop type (e.g. Aman Rice, Potato, Wheat, Mustard) and visual soil/moisture stress.
    """
    if x_gemini_api_key:
        set_gemini_api_key(x_gemini_api_key)

    fn = image_file.filename if image_file else "sample_field.jpg"
    contents = await image_file.read() if image_file else b""
    result = analyze_crop_image(image_bytes=contents, filename=fn, lat=latitude, lon=longitude)
    return result

@router.post("/text")
def process_colloquial_text(req: TextQueryRequest, x_gemini_api_key: Optional[str] = Header(None)):
    """Parses freeform informal Bangla or Banglish search queries."""
    if x_gemini_api_key:
        set_gemini_api_key(x_gemini_api_key)
    return parse_colloquial_bangla(text=req.text, lat=req.latitude, lon=req.longitude)

@router.post("/land-intelligence")
def get_land_intelligence(req: LandIntelligenceRequest, x_gemini_api_key: Optional[str] = Header(None)):
    """
    Land Intelligence Engine:
    Predicts which crop will grow best on the farmer's specific land location,
    along with estimated yield, market price, cost breakdown, and net profit
    by season, month, and recommended agronomic technique.
    Powered by Gemini AI when API key is configured.
    """
    if req.gemini_api_key:
        set_gemini_api_key(req.gemini_api_key)
    elif x_gemini_api_key:
        set_gemini_api_key(x_gemini_api_key)

    try:
        return analyze_land_intelligence(
            district_id=req.district_id,
            land_size_bigha=req.land_size_bigha,
            target_crop_id=req.target_crop_id,
            seed_variety=req.seed_variety,
            query_text=req.query_text
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/key-status")
def get_gemini_key_status(x_gemini_api_key: Optional[str] = Header(None)):
    """Checks if Gemini API Key is configured in environment, request header, or .env."""
    key = get_gemini_api_key(x_gemini_api_key)
    return {
        "is_configured": bool(key and len(key) > 5),
        "masked_key": f"{key[:4]}...{key[-4:]}" if key and len(key) > 8 else None
    }

@router.post("/config-key")
def configure_gemini_api_key(req: ApiKeyConfigRequest):
    """Sets Gemini API Key in the application session and persists to .env."""
    clean = req.gemini_api_key.strip()
    if not clean or len(clean) < 3:
        raise HTTPException(status_code=400, detail="Invalid API key provided.")
    set_gemini_api_key(clean)
    return {"status": "success", "message": "Gemini API Key configured successfully."}

@router.get("/tts")
def stream_bangla_audio(text: Optional[str] = None):
    """Streams synthesized audio for spoken read-aloud advice."""
    audio_bytes = generate_simple_tone_wav()
    return Response(content=audio_bytes, media_type="audio/wav")
