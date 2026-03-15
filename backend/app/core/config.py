"""app/core/config.py — Settings via pydantic-settings"""
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

import dotenv

dotenv.load_dotenv()

class Settings(BaseSettings):
    environment: str = os.getenv("ENVIRONMENT", "development")
    cors_origins: List[str] = os.getenv("CORS_ORIGINS", "*").split(",")
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_service_key: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    secret_key: str = os.getenv("SECRET_KEY", "change-me-in-production")

    model_config = SettingsConfigDict(
        env_file_encoding="utf-8",
        extra="ignore"  # Allow extra fields in .env without errors
    )


settings = Settings()
