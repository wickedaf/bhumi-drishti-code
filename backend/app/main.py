from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes import router as core_router
from backend.app.api.assist import router as assist_router

app = FastAPI(
    title="Bhumi Drishti API",
    description="Multimodal Satellite & Weather-Based Crop Outcome Predictor for Bangladesh",
    version="1.1.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(core_router)
app.include_router(assist_router)

@app.get("/")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "Bhumi Drishti (ভূমি দৃষ্টি)",
        "version": "1.1.0",
        "author": "Sara Tasfia",
        "institution": "East West University"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
