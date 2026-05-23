"""
Application Configuration
Loads environment variables and provides centralized settings for the entire backend.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """
    Settings class that reads from environment variables or .env file.
    This is the single source of truth for all configuration values.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore" # Ignore extra fields (like old OpenAI keys) in .env
    )

    # ─── Application ──────────────────────────────────────────────
    APP_NAME: str = "AI Legal Document Analyzer"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ─── MongoDB ──────────────────────────────────────────────────
    MONGODB_URL: str = "mongodb://mongodb:27017"
    MONGODB_DB_NAME: str = "legal_analyzer"

    # ─── JWT Authentication ───────────────────────────────────────
    JWT_SECRET_KEY: str = "super-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-8b-instant"
    GROK_API_KEY: str = ""
    GROK_MODEL: str = "llama-3.1-70b-versatile"

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash"

    GROQ_MODEL_FAST: str = "llama-3.1-8b-instant"
    GROQ_MODEL_QUALITY: str = "llama-3.3-70b-versatile"

    ROUTER_GROQ_CONTEXT_TOKENS: int = 8000
    ROUTER_GEMINI_CONTEXT_TOKENS: int = 100000
    ROUTER_TOKEN_BUFFER: int = 1200
    ROUTER_LONG_SUMMARY_TOKENS: int = 2200

    LLM_TIMEOUT_SECONDS: float = 90.0

    def get_groq_api_key(self) -> str:
        return self.GROQ_API_KEY or self.GROK_API_KEY

    def get_groq_model(self) -> str:
        return self.GROQ_MODEL or self.GROK_MODEL

    # ─── Local Embeddings (No OpenAI) ──────────────────────────────
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DEVICE: str = "cpu" # Set to 'cuda' if GPU available

    # ─── ChromaDB ─────────────────────────────────────────────────
    CHROMA_PERSIST_DIR: str = "./chroma_data"
    CHROMA_COLLECTION_NAME: str = "legal_documents"

    # ─── File Upload ──────────────────────────────────────────────
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 50

    # ─── ML Model (LegalBERT) ─────────────────────────────────────
    LEGALBERT_MODEL_PATH: str = "./train/legalbert_model" # Directory containing config.json, model.safetensors, etc.

    # ─── CORS ─────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://frontend:80"]


settings = Settings()
