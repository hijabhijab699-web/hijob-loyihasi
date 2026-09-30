from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ml_garment_host: str = "0.0.0.0"
    ml_garment_port: int = 5003
    log_level: str = "info"

    # Image handling
    max_image_size: int = 2048        # source images downscale here
    canvas_width: int = 1200          # canonical output canvas
    canvas_height: int = 1600
    max_mask_dilate: int = 5           # smooth the mask edge

    # rembg
    rembg_model: str = "u2net"        # u2net | u2net_human_seg | isnet-general-use


settings = Settings()
