from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from env / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ml_face_host: str = "0.0.0.0"
    ml_face_port: int = 5001
    log_level: str = "info"

    # Detection tuning
    max_image_size: int = 2048  # downscale larger images to this max dimension
    face_confidence: float = 0.5  # min detection confidence for MediaPipe

    # API allowlist — NestJS is the only caller in prod
    trusted_callers: list[str] = ["*"]


settings = Settings()
