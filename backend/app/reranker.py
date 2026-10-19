"""
backend/app/reranker.py

Cross-Encoder Reranker for Citizen AI.
Applies joint self-attention across (query, passage) pairs to precisely re-score
and re-order retrieved candidate passages before feeding them to the LLM.
Runs locally on CPU for ₹0 cost.
"""

from typing import List, Dict, Any, Optional
from sentence_transformers import CrossEncoder
from app.config import settings
from loguru import logger

_reranker_instance: Optional[CrossEncoder] = None


def get_reranker() -> CrossEncoder:
    """Singleton lazy-loader for the CrossEncoder reranker model."""
    global _reranker_instance
    if _reranker_instance is None:
        model_name = settings.reranker_model or "BAAI/bge-reranker-base"
        logger.info(f"⏳ Loading Cross-Encoder Reranker '{model_name}' on CPU...")
        try:
            _reranker_instance = CrossEncoder(model_name, device="cpu")
            logger.info("✅ Cross-Encoder Reranker loaded successfully.")
        except Exception as e:
            logger.warning(f"Failed to load {model_name}: {e}. Falling back to lightweight ms-marco-MiniLM-L-6-v2.")
            _reranker_instance = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2", device="cpu")
    return _reranker_instance


def rerank_passages(
    query: str,
    candidate_chunks: List[Dict[str, Any]],
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Takes candidate chunks from initial retrieval, computes cross-encoder interaction scores,
    and returns the top-k highest scoring chunks.
    """
    if not candidate_chunks:
        return []

    # If only 1 chunk, no need to rerank
    if len(candidate_chunks) == 1:
        candidate_chunks[0]["rerank_score"] = candidate_chunks[0].get("score", 1.0)
        return candidate_chunks

    reranker = get_reranker()
    pairs = [[query, c["text"]] for c in candidate_chunks]

    # Predict scores (logits)
    scores = reranker.predict(pairs, show_progress_bar=False)

    for chunk, score in zip(candidate_chunks, scores):
        chunk["rerank_score"] = round(float(score), 4)
        chunk["score"] = round(float(score), 4)

    # Sort descending by reranker score
    reranked = sorted(candidate_chunks, key=lambda x: x["rerank_score"], reverse=True)
    return reranked[:top_k]
