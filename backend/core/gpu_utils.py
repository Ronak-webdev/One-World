from functools import lru_cache

from core.config import settings


@lru_cache(maxsize=1)
def _torch():
    try:
        import torch

        return torch
    except Exception:
        return None


def get_device() -> str:
    torch = _torch()
    if settings.gpu_enabled and torch is not None and torch.cuda.is_available():
        return "cuda"
    return "cpu"


def check_vram_gb() -> float:
    torch = _torch()
    if torch is not None and torch.cuda.is_available():
        return torch.cuda.get_device_properties(0).total_memory / 1e9
    return 0.0


def can_load_model(required_gb: float) -> bool:
    available = check_vram_gb()
    return available - 1.5 >= required_gb

