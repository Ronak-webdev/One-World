from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from routers.audio import audio_converter, audio_enhancer, noise_reducer, pitch_shift, silence_remover, stem_separator, transcriber, vocal_remover
from routers.convert import image_converter as convert_image_converter
from routers.convert import media_converter, office_converter, pdf_converter
from routers.image import background_remover, batch_processor, enhancer, filters, format_converter, object_remover, upscaler
from routers.lab import placeholders, style_transfer

app = FastAPI(
    title="One World WaveBrain Backend",
    version="0.1.0",
    description="Local AI toolkit backend extending WaveBrain with audio, image, conversion, and lab routes.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "service": "one-world-wavebrain",
        "temp_dir": str(settings.temp_dir),
        "gpu_enabled": settings.gpu_enabled,
    }


app.include_router(vocal_remover.router, prefix="/api/audio", tags=["Audio"])
app.include_router(stem_separator.router, prefix="/api/audio", tags=["Audio"])
app.include_router(transcriber.router, prefix="/api/audio", tags=["Audio"])
app.include_router(audio_enhancer.router, prefix="/api/audio", tags=["Audio"])
app.include_router(pitch_shift.router, prefix="/api/audio", tags=["Audio"])
app.include_router(silence_remover.router, prefix="/api/audio", tags=["Audio"])
app.include_router(noise_reducer.router, prefix="/api/audio", tags=["Audio"])
app.include_router(audio_converter.router, prefix="/api/audio", tags=["Audio"])

app.include_router(background_remover.router, prefix="/api/image", tags=["Image"])
app.include_router(upscaler.router, prefix="/api/image", tags=["Image"])
app.include_router(enhancer.router, prefix="/api/image", tags=["Image"])
app.include_router(filters.router, prefix="/api/image", tags=["Image"])
app.include_router(format_converter.router, prefix="/api/image", tags=["Image"])
app.include_router(object_remover.router, prefix="/api/image", tags=["Image"])
app.include_router(batch_processor.router, prefix="/api/image", tags=["Image"])

app.include_router(pdf_converter.router, prefix="/api/convert", tags=["Convert"])
app.include_router(office_converter.router, prefix="/api/convert", tags=["Convert"])
app.include_router(convert_image_converter.router, prefix="/api/convert", tags=["Convert"])
app.include_router(media_converter.router, prefix="/api/convert", tags=["Convert"])

app.include_router(style_transfer.router, prefix="/api/lab", tags=["Lab"])
app.include_router(placeholders.router, prefix="/api/lab", tags=["Lab"])

