from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ml_compositor_host: str = "0.0.0.0"
    ml_compositor_port: int = 5002
    log_level: str = "info"

    max_image_size: int = 2048
    output_max_side: int = 1200  # downscale output before returning
    output_jpeg_quality: int = 92


settings = Settings()
