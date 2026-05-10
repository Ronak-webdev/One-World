from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    temp_dir: Path = Path("./temp")
    max_upload_size_mb: int = 2048
    real_esrgan_model_path: Path = Path("./models/ai/real_esrgan/RealESRGAN_x4plus.pth")
    rembg_model: str = "u2net"
    libreoffice_bin: str = "soffice"
    ffmpeg_bin: str = "ffmpeg"
    gpu_enabled: bool = True
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def upload_dir(self) -> Path:
        return self.temp_dir / "uploads"

    @property
    def output_dir(self) -> Path:
        return self.temp_dir / "outputs"


settings = Settings()
settings.upload_dir.mkdir(parents=True, exist_ok=True)
settings.output_dir.mkdir(parents=True, exist_ok=True)

