from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
import subprocess
import os

router = APIRouter()
OLLAMA_BASE_URL = "http://localhost:11434"

class ChatMessage(BaseModel):
    role: str
    content: str
    images: Optional[List[str]] = None

class ChatRequest(BaseModel):
    model: str
    messages: List[ChatMessage]
    stream: bool = False
    options: Optional[dict] = None

@router.get("/ensure")
async def ensure_ollama():
    """Check if Ollama is running, and try to start it if not."""
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            return {"status": "running", "auto_started": False}
    except Exception:
        try:
            ollama_path = os.path.expandvars(r"%LOCALAPPDATA%\Ollama\ollama app.exe")
            if os.path.exists(ollama_path):
                subprocess.Popen([ollama_path], shell=True)
                return {"status": "starting", "auto_started": True}
            else:
                subprocess.Popen(["ollama", "serve"], shell=True)
                return {"status": "starting", "auto_started": True}
        except Exception as e:
            return {"status": "error", "message": str(e)}

@router.get("/models")
async def get_models():
    """Fetch available local models from Ollama."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            response.raise_for_status()
            data = response.json()
            return data
    except Exception as e:
        await ensure_ollama()
        raise HTTPException(status_code=500, detail=f"Ollama connection failed: {str(e)}")

@router.post("/chat")
async def chat(request: ChatRequest):
    """Proxy chat requests to Ollama."""
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            payload = request.model_dump()
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json=payload
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Ollama error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ollama request failed: {str(e)}")
