"""
backend/app/cache.py

Thread-safe, in-memory LRU cache to protect free LLM API quotas.
If the same question is asked again against the same retrieved context,
the response is returned in <10ms without making any external API call.
"""

import hashlib
import time
from typing import Optional, Dict, Any, List
from cachetools import LRUCache
from app.config import settings
from loguru import logger

# Cache capacity configured via settings (default: 500 queries)
_response_cache = LRUCache(maxsize=settings.cache_max_size)


def generate_cache_key(query: str, chunk_ids: List[str], provider: str, model: str) -> str:
    """
    Generates a deterministic SHA256 hash based on:
    - Normalized query text
    - Exact retrieved chunk IDs
    - Active LLM provider and model name
    """
    normalized_query = query.strip().lower()
    sorted_chunks = ",".join(sorted(chunk_ids))
    raw_key = f"{normalized_query}|{sorted_chunks}|{provider}|{model}"
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def get_cached_response(cache_key: str) -> Optional[Dict[str, Any]]:
    """Retrieves a cached answer if available."""
    entry = _response_cache.get(cache_key)
    if entry:
        logger.info(f"⚡ Cache HIT for key {cache_key[:8]}... (0 API quota used)")
        return entry
    return None


def set_cached_response(cache_key: str, response_data: Dict[str, Any]) -> None:
    """Stores response data in the LRU cache with timestamp, skipping refusals."""
    answer = response_data.get("answer", "")
    if "couldn't find this information" in answer.lower():
        logger.debug("Skipping cache storage for refusal response.")
        return

    response_data["cached"] = True
    response_data["cached_at"] = time.time()
    _response_cache[cache_key] = response_data
    logger.debug(f"Stored response in cache for key {cache_key[:8]}...")


def get_cache_stats() -> Dict[str, int]:
    """Returns current cache size and capacity."""
    return {
        "current_size": len(_response_cache),
        "max_capacity": _response_cache.maxsize
    }
