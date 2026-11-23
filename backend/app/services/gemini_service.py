import os
import json
import base64
from pathlib import Path
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent

for p in [ROOT_DIR / ".env", BACKEND_DIR / ".env"]:
    if p.exists():
        try:
            load_dotenv(p, override=True)
        except Exception:
            pass

_IN_MEMORY_GEMINI_KEY: Optional[str] = None

def get_gemini_api_key(header_key: Any = None) -> Optional[str]:
    """
    Retrieves Gemini API Key from:
    1. Direct header / request parameter (must be str)
    2. In-memory runtime cache
    3. Environment variable (GEMINI_API_KEY / GOOGLE_API_KEY)
    4. Disk .env file
    """
    global _IN_MEMORY_GEMINI_KEY

    # Only treat as header_key if it's a real string (not FastAPI Header parameter object)
    if header_key and isinstance(header_key, str) and len(header_key.strip()) > 3:
        _IN_MEMORY_GEMINI_KEY = header_key.strip()
        os.environ["GEMINI_API_KEY"] = _IN_MEMORY_GEMINI_KEY
        return _IN_MEMORY_GEMINI_KEY

    if _IN_MEMORY_GEMINI_KEY and isinstance(_IN_MEMORY_GEMINI_KEY, str) and len(_IN_MEMORY_GEMINI_KEY) > 3:
        return _IN_MEMORY_GEMINI_KEY

    env_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if env_key and isinstance(env_key, str) and len(env_key.strip()) > 3:
        _IN_MEMORY_GEMINI_KEY = env_key.strip()
        return _IN_MEMORY_GEMINI_KEY

    # Check root .env manually
    for env_path in [ROOT_DIR / ".env", BACKEND_DIR / ".env"]:
        if env_path.exists():
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("GEMINI_API_KEY="):
                            k = line.split("=", 1)[1].strip().strip('"').strip("'")
                            if k:
                                _IN_MEMORY_GEMINI_KEY = k
                                os.environ["GEMINI_API_KEY"] = k
                                return k
            except Exception:
                pass

    return None

def set_gemini_api_key(key: Any) -> None:
    """Stores the key in memory and attempts to persist to .env."""
    global _IN_MEMORY_GEMINI_KEY
    if not key or not isinstance(key, str):
        return

    clean_key = key.strip().strip('"').strip("'")
    if len(clean_key) < 3:
        return

    _IN_MEMORY_GEMINI_KEY = clean_key
    os.environ["GEMINI_API_KEY"] = clean_key
    os.environ["GOOGLE_API_KEY"] = clean_key

    # Persist to disk safely
    for target in [BACKEND_DIR / ".env", ROOT_DIR / ".env"]:
        try:
            target.parent.mkdir(parents=True, exist_ok=True)
            with open(target, "w", encoding="utf-8") as f:
                f.write(f"GEMINI_API_KEY={clean_key}\n")
            break  # Successfully written to .env
        except Exception as e:
            pass

def call_gemini_multimodal(
    prompt: str,
    image_bytes: Optional[bytes] = None,
    image_mime: str = "image/jpeg",
    audio_bytes: Optional[bytes] = None,
    audio_mime: str = "audio/webm",
    system_instruction: Optional[str] = None,
    api_key_override: Optional[str] = None
) -> Optional[str]:
    """
    Calls Google GenAI SDK (google-genai) with text, image, or audio input.
    Returns response text or None if API key missing or call fails.
    """
    api_key = get_gemini_api_key(api_key_override)
    if not api_key:
        return None

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        contents = []

        if image_bytes and len(image_bytes) > 0:
            contents.append(
                types.Part.from_bytes(data=image_bytes, mime_type=image_mime)
            )

        if audio_bytes and len(audio_bytes) > 0:
            contents.append(
                types.Part.from_bytes(data=audio_bytes, mime_type=audio_mime)
            )

        contents.append(prompt)

        config = types.GenerateContentConfig(
            temperature=0.2,
        )
        if system_instruction:
            config.system_instruction = system_instruction

        for model_name in ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config
                )
                if response and response.text:
                    return response.text
            except Exception as model_err:
                print(f"Model {model_name} error: {model_err}")
                continue

        return None

    except Exception as e:
        print(f"Gemini API Client Error: {e}")
        return None
