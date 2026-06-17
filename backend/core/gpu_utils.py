"""GPU utility helpers — configures PyTorch for maximum CUDA throughput on startup."""

import os
from functools import lru_cache
from core.config import settings

# ─── CRITICAL: Limit CPU thread pools BEFORE any library imports ────────────
# PyTorch, ONNX Runtime, OpenBLAS, and MKL all spawn thread pools that
# collectively eat 100% CPU even when computation runs on GPU.
# Setting these env vars early ensures every library respects the limit.
os.environ["OMP_NUM_THREADS"] = "2"
os.environ["MKL_NUM_THREADS"] = "2"
os.environ["OPENBLAS_NUM_THREADS"] = "2"
os.environ["VECLIB_MAXIMUM_THREADS"] = "2"
os.environ["NUMEXPR_NUM_THREADS"] = "2"
# ONNX Runtime (used by audio-separator / vocal remover)
os.environ["ORT_GLOBAL_THREAD_POOL_SIZE"] = "2"


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
    if torch is None:
        return

    # ─── CPU Thread Clamping (THE FIX for 100% CPU usage) ──────────────
    # By default PyTorch uses N threads (10 on your system).
    # Even GPU operations need CPU threads for data marshalling, and
    # asyncio.to_thread() means multiple jobs each spawn N threads.
    # Clamping to 2 keeps the CPU calm while the GPU does the real work.
    torch.set_num_threads(2)
    torch.set_num_interop_threads(2)
    print(f"[GPU] CPU threads clamped to {torch.get_num_threads()} (was {os.cpu_count()})")

    if not torch.cuda.is_available():
        print("[GPU] CUDA not available, running on CPU")
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
