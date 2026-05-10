from fastapi import APIRouter, HTTPException

router = APIRouter()

FEATURES = [
    {"id": "style-transfer", "label": "Style Transfer", "status": "available"},
    {"id": "video-generate", "label": "Video Generation", "status": "in-development"},
    {"id": "3d-generate", "label": "3D Model Generation", "status": "in-development"},
    {"id": "ai-avatar", "label": "AI Avatar", "status": "planned"},
    {"id": "document-ai", "label": "Document AI", "status": "planned"},
]


@router.get("/features")
async def features() -> dict:
    return {"features": FEATURES}


def _not_ready(feature: str):
    raise HTTPException(status_code=501, detail=f"{feature} is not implemented yet")


@router.post("/video-generate")
async def video_generate():
    _not_ready("Video generation")


@router.post("/3d-generate")
async def generate_3d():
    _not_ready("3D generation")


@router.post("/ai-avatar")
async def ai_avatar():
    _not_ready("AI avatar")


@router.post("/document-ai")
async def document_ai():
    _not_ready("Document AI")

