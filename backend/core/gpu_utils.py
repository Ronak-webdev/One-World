"""GPU utility helpers — configures PyTorch for maximum CUDA throughput on startup."""

from functools import lru_cache
from core.config import settings


@lru_cache(maxsize=1)
def _torch():
    try:
        import torch
        return torch
    except Exception:
        return None


def configure_gpu():
    """Apply all GPU performance flags. Call once at application startup."""
    torch = _torch()
    if torch is None or not torch.cuda.is_available():
        return

    # Allow TF32 on Ampere+ GPUs — huge throughput boost with negligible precision loss
    torch.backends.cuda.matmul.allow_tf32 = True
    torch.backends.cudnn.allow_tf32 = True

    # cuDNN auto-tuner: benchmarks convolution algorithms on first run, then reuses fastest
    torch.backends.cudnn.benchmark = True
    torch.backends.cudnn.deterministic = False  # deterministic=True kills performance

    # Enable flash attention / SDPA optimizations where available (PyTorch ≥ 2.0)
    if hasattr(torch.backends, "cuda") and hasattr(torch.backends.cuda, "enable_flash_sdp"):
        torch.backends.cuda.enable_flash_sdp(True)

    device = torch.cuda.get_device_properties(0)
    vram_gb = device.total_memory / 1e9
    print(
        f"[GPU] {device.name} | {vram_gb:.1f} GB VRAM | "
        f"TF32={'ON'} | cuDNN Benchmark={'ON'}"
    )


def get_device() -> str:
    torch = _torch()
    if settings.gpu_enabled and torch is not None and torch.cuda.is_available():
        return "cuda"
    return "cpu"


def get_autocast_context(device: str = None):
    """Returns torch.autocast context for FP16 inference (no-op on CPU)."""
    torch = _torch()
    if torch is None:
        from contextlib import nullcontext
        return nullcontext()
    d = device or get_device()
    if d == "cuda":
        return torch.autocast(device_type="cuda", dtype=torch.float16)
    return torch.autocast(device_type="cpu", dtype=torch.bfloat16, enabled=False)


def check_vram_gb() -> float:
    torch = _torch()
    if torch is not None and torch.cuda.is_available():
        return torch.cuda.get_device_properties(0).total_memory / 1e9
    return 0.0


def can_load_model(required_gb: float) -> bool:
    available = check_vram_gb()
    return available - 1.5 >= required_gb


def clear_vram() -> None:
    torch = _torch()
    if torch is not None and torch.cuda.is_available():
        import gc
        gc.collect()
        torch.cuda.empty_cache()
