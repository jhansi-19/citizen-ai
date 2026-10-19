"""
Central configuration for Citizen AI backend.

All settings are loaded from environment variables (via .env file).
Never hardcode secrets — always use this module.

Usage:
    from app.config import settings
    print(settings.gemini_api_key)
"""

from __future__ import annotations

from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    All configuration values for the Citizen AI backend.
    Pydantic-settings reads these from environment variables or a .env file.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # ignore unknown env vars
    )

    # ── LLM Keys ───────────────────────────────────────────────────────────────
    gemini_api_key: str = Field(default="", description="Gemini API key from aistudio.google.com")
    groq_api_key: str = Field(default="", description="Groq API key from console.groq.com")
    hf_token: str = Field(default="", description="Hugging Face token from huggingface.co/settings/tokens")

    # ── LLM Config ─────────────────────────────────────────────────────────────
    llm_provider: Literal["gemini", "groq"] = Field(
        default="gemini",
        description="Which LLM provider to use. Switch in .env without code changes.",
    )
    gemini_model: str = Field(default="gemini-1.5-flash", description="Gemini model name")
    groq_model: str = Field(default="llama-3.1-8b-instant", description="Groq model name")

    # ── Server ─────────────────────────────────────────────────────────────────
    backend_host: str = Field(default="0.0.0.0")
    backend_port: int = Field(default=8000)
    cors_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        description="Comma-separated list of allowed CORS origins",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse the comma-separated CORS string into a list."""
        if "*" in self.cors_origins:
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    # ── Rate Limiting & Cache ──────────────────────────────────────────────────
    rate_limit_per_minute: int = Field(
        default=10,
        description="Max LLM API requests per minute per IP — protects free quotas",
    )
    cache_max_size: int = Field(
        default=500,
        description="Max number of cached LLM responses (LRU eviction)",
    )

    # ── Vector DB & Embeddings ─────────────────────────────────────────────────
    chroma_db_path: str = Field(default="./chroma_db")
    embedding_model: str = Field(
        default="BAAI/bge-small-en-v1.5",
        description="Sentence-transformers model for embeddings. Runs locally on CPU.",
    )

    # ── Retrieval ──────────────────────────────────────────────────────────────
    top_k: int = Field(default=8, description="Number of chunks to retrieve per query")
    retrieval_mode: Literal["dense", "hybrid", "reranked"] = Field(
        default="hybrid",
        description="dense=vector only | hybrid=BM25+vector | reranked=hybrid+cross-encoder",
    )
    reranker_model: str = Field(
        default="BAAI/bge-reranker-base",
        description="Cross-encoder reranker model. Only used when retrieval_mode=reranked.",
    )

    # ── Attachments ───────────────────────────────────────────────────────────
    attachment_ttl_hours: int = Field(
        default=24,
        description="Hours before chat-attached PDFs auto-delete. 0 = never.",
    )

    # ── Data Paths ─────────────────────────────────────────────────────────────
    # Resolves correctly both locally (citizen_AI/data) and inside Docker (/app/data):
    pdf_dir: Path = Field(
        default_factory=lambda: (
            Path(__file__).resolve().parent.parent.parent / "data" / "pdfs"
            if (Path(__file__).resolve().parent.parent.parent / "data" / "pdfs").exists()
            else Path(__file__).resolve().parent.parent / "data" / "pdfs"
        )
    )
    chunks_dir: Path = Field(
        default_factory=lambda: (
            Path(__file__).resolve().parent.parent.parent / "data" / "chunks"
            if (Path(__file__).resolve().parent.parent.parent / "data" / "chunks").exists()
            else Path(__file__).resolve().parent.parent / "data" / "chunks"
        )
    )
    logs_db_path: Path = Field(default=Path("./logs/citizen_ai.db"))

    # ── Admin ──────────────────────────────────────────────────────────────────
    admin_password: str = Field(default="change_this_password")

    # ── Monitoring ─────────────────────────────────────────────────────────────
    langfuse_public_key: str = Field(default="")
    langfuse_secret_key: str = Field(default="")
    langfuse_host: str = Field(default="https://cloud.langfuse.com")

    @property
    def use_langfuse(self) -> bool:
        """True only when Langfuse keys are actually set."""
        return bool(self.langfuse_public_key and self.langfuse_secret_key)

    # ── Web Search ─────────────────────────────────────────────────────────────
    tavily_api_key: str = Field(default="", description="Optional Tavily backup. DuckDuckGo used by default.")

    # ── Derived helpers ────────────────────────────────────────────────────────
    @property
    def active_llm_model(self) -> str:
        """Return the model name for the currently active provider."""
        return self.gemini_model if self.llm_provider == "gemini" else self.groq_model

    def validate_keys(self) -> list[str]:
        """
        Return a list of missing critical keys.
        Call this at startup to give a friendly error instead of a cryptic crash.
        """
        missing = []
        if self.llm_provider == "gemini" and not self.gemini_api_key:
            missing.append("GEMINI_API_KEY")
        if self.llm_provider == "groq" and not self.groq_api_key:
            missing.append("GROQ_API_KEY")
        return missing


# ── Singleton ──────────────────────────────────────────────────────────────────
# Import this anywhere: `from app.config import settings`
settings = Settings()
