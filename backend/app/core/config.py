"""app/core/config.py — Settings via pydantic-settings"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    environment: str = "development"
    cors_origins: List[str] = ["http://localhost:5173", "https://intoit.app", "https://*.vercel.app"]
    supabase_url: str = ""
    supabase_service_key: str = ""
    anthropic_api_key: str = ""
    secret_key: str = "change-me-in-production"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
