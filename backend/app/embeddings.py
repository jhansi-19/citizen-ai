"""
backend/app/embeddings.py

Loads and manages the local BAAI/bge-small-en-v1.5 embedding model.
Runs entirely on CPU with zero external API calls or costs.
"""

from typing import List, Union
from sentence_transformers import SentenceTransformer
from app.config import settings
from loguru import logger

_model_instance: SentenceTransformer | None = None


def get_embedding_model() -> SentenceTransformer:
    """
    Singleton lazy-loader for the sentence-transformers embedding model.
    Loads once into memory and reuses across calls.
    """
    global _model_instance
    if _model_instance is None:
        logger.info(f"⏳ Loading embedding model '{settings.embedding_model}' on CPU...")
        _model_instance = SentenceTransformer(settings.embedding_model, device="cpu")
        logger.info("✅ Embedding model loaded successfully.")
    return _model_instance


def embed_texts(texts: Union[str, List[str]]) -> List[List[float]]:
    """
    Generates normalized dense vector embeddings for a string or list of strings.
    BGE models benefit from instruction prefixes during query embedding,
    handled automatically when needed.
    """
    model = get_embedding_model()
    if isinstance(texts, str):
        texts = [texts]
    
    embeddings = model.encode(
        texts,
        batch_size=32,
        show_progress_bar=False,
        normalize_embeddings=True
    )
    return embeddings.tolist()
