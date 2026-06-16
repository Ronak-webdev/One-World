import sys
from pathlib import Path
import torchvision.transforms.functional as F
# basicsr expects torchvision.transforms.functional_tensor which was removed in recent torchvision
sys.modules['torchvision.transforms.functional_tensor'] = F

from fastapi import FastAPI, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import settings
from core.gpu_utils import configure_gpu
from routers.audio import audio_converter, audio_enhancer, audio_jobs, noise_reducer, pitch_shift, silence_remover, stem_separator, transcriber, vocal_remover
from routers.convert import convert_jobs, media_converter, office_converter, pdf_converter
from routers.convert import image_converter as convert_image_converter
from routers.image import background_remover, batch_processor, enhancer, filters, format_converter, image_jobs, object_remover, upscaler
from routers.lab import lab_jobs, placeholders, style_transfer, ollama

app = FastAPI(
    title="One World WaveBrain Backend",
    version="0.1.1",
    description="Local AI toolkit backend - RELOAD VERIFIED v2",
)
print("[Backend] WaveBrain Studio Backend is starting...")

# Apply all GPU performance flags before any model is loaded
configure_gpu()

# Configure pydub to use the ffmpeg path from settings if available
try:
    from pydub import AudioSegment
    import shutil
    import os
    ffmpeg_path = shutil.which(settings.ffmpeg_bin)
    if ffmpeg_path:
        # Add the ffmpeg directory to PATH so other libraries (audio-separator, etc) can find it
        ffmpeg_dir = str(Path(ffmpeg_path).parent)
        if ffmpeg_dir not in os.environ["PATH"]:
            os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ["PATH"]
            print(f"[Backend] Added FFmpeg to PATH: {ffmpeg_dir}")
            
        AudioSegment.converter = ffmpeg_path
        print(f"[Backend] Pydub converter set to: {ffmpeg_path}")
except ImportError:
    pass

# Global Exception Handler to ensure CORS headers are present on errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"CRITICAL ERROR: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "status": "error"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Use the robust built-in CORSMiddleware
# For local dev tools, allow_origins=["*"] is the most reliable path
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "service": "one-world-wavebrain",
        "temp_dir": str(settings.temp_dir),
        "gpu_enabled": settings.gpu_enabled,
    }


app.include_router(audio_jobs.router, prefix="/api/audio", tags=["Audio"])
app.include_router(vocal_remover.router, prefix="/api/audio", tags=["Audio"])
app.include_router(stem_separator.router, prefix="/api/audio", tags=["Audio"])
app.include_router(transcriber.router, prefix="/api/audio", tags=["Audio"])
app.include_router(audio_enhancer.router, prefix="/api/audio", tags=["Audio"])
app.include_router(pitch_shift.router, prefix="/api/audio", tags=["Audio"])
app.include_router(silence_remover.router, prefix="/api/audio", tags=["Audio"])
app.include_router(noise_reducer.router, prefix="/api/audio", tags=["Audio"])
app.include_router(audio_converter.router, prefix="/api/audio", tags=["Audio"])

app.include_router(image_jobs.router, prefix="/api/image", tags=["Image"])
app.include_router(background_remover.router, prefix="/api/image", tags=["Image"])
app.include_router(upscaler.router, prefix="/api/image", tags=["Image"])
app.include_router(enhancer.router, prefix="/api/image", tags=["Image"])
app.include_router(filters.router, prefix="/api/image", tags=["Image"])
app.include_router(format_converter.router, prefix="/api/image", tags=["Image"])
app.include_router(object_remover.router, prefix="/api/image", tags=["Image"])
app.include_router(batch_processor.router, prefix="/api/image", tags=["Image"])

app.include_router(convert_jobs.router, prefix="/api/convert", tags=["Convert"])
app.include_router(pdf_converter.router, prefix="/api/convert", tags=["Convert"])
app.include_router(office_converter.router, prefix="/api/convert", tags=["Convert"])
app.include_router(convert_image_converter.router, prefix="/api/convert", tags=["Convert"])
app.include_router(media_converter.router, prefix="/api/convert", tags=["Convert"])

app.include_router(lab_jobs.router, prefix="/api/lab", tags=["Lab"])
app.include_router(style_transfer.router, prefix="/api/lab", tags=["Lab"])
app.include_router(placeholders.router, prefix="/api/lab", tags=["Lab"])
app.include_router(ollama.router, prefix="/api/lab/ollama", tags=["Lab"])

