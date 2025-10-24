"""
Configuration management for the application
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str
    
    # Gemini API Configuration
    GEMINI_API_KEY: str
    
    # Application Configuration
    ENVIRONMENT: str = "development"
    API_VERSION: str = "v1"
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Security
    JWT_SECRET_KEY: str = "changeme"
    JWT_ALGORITHM: str = "HS256"
    
    # Cookie settings
    COOKIE_DOMAIN: str = ""  # Set to ".yourdomain.com" in production, empty for localhost
    COOKIE_SECURE: bool = False  # Set to True in production (HTTPS only)
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        
        @classmethod
        def parse_env_var(cls, field_name: str, raw_val: str):
            if field_name == "CORS_ORIGINS":
                # Handle both JSON array format and comma-separated format
                if raw_val.startswith("["):
                    import json
                    return json.loads(raw_val)
                return [origin.strip() for origin in raw_val.split(",")]
            if field_name == "COOKIE_DOMAIN" and raw_val == "":
                return None
            return raw_val


settings = Settings()
