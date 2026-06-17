import time
import logging
from typing import Any, Callable, Dict
from core.gpu_utils import clear_vram

logger = logging.getLogger(__name__)

class ModelManager:
    """
    Manages AI models in memory. Keeps models loaded to avoid cold-starts,
    and intelligently clears VRAM if different models need to be loaded to avoid OOM.
    """
    _cache: Dict[str, Any] = {}
    
    @classmethod
    def get_model(cls, model_key: str, load_fn: Callable[[], Any]) -> Any:
        """
        Retrieves a model from the cache or loads it using the provided load_fn.
        Automatically unloads previous models to prevent Out of Memory errors on consumer GPUs.
        """
        if model_key in cls._cache:
            logger.info(f"[ModelManager] ⚡ Fast cache hit for {model_key}")
            return cls._cache[model_key]
        
        # Unload all other models if loading a new one to prevent OOM
        # on 8GB/12GB GPUs.
        if cls._cache:
            logger.info(f"[ModelManager] 🧹 Clearing old models to make room for {model_key}")
            cls._cache.clear()
            clear_vram()
            
        logger.info(f"[ModelManager] ⏳ Loading {model_key} into memory (Cold Start)")
        start_t = time.time()
        model = load_fn()
        cls._cache[model_key] = model
        logger.info(f"[ModelManager] ✅ Loaded {model_key} in {time.time() - start_t:.2f}s")
        return model

    @classmethod
    def clear(cls):
        cls._cache.clear()
        clear_vram()
