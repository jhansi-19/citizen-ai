"""
backend/app/rate_limiter.py

In-memory sliding-window rate limiter to prevent API abuse
and ensure your free Gemini and Groq tier quotas are never exhausted.
"""

import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, HTTPException, status
from app.config import settings
from loguru import logger

# Store request timestamps per client IP: {ip: [timestamp1, timestamp2, ...]}
_request_history: Dict[str, List[float]] = defaultdict(list)


def check_rate_limit(request: Request) -> bool:
    """
    FastAPI dependency that enforces requests-per-minute per client IP.
    Default: 10 requests / minute.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    window_seconds = 60.0
    limit = settings.rate_limit_per_minute

    # Filter out timestamps older than the sliding window
    timestamps = [t for t in _request_history[client_ip] if now - t < window_seconds]
    _request_history[client_ip] = timestamps

    if len(timestamps) >= limit:
        logger.warning(f"⚠️ Rate limit exceeded for IP: {client_ip} ({len(timestamps)}/{limit} rpm)")
        retry_after = int(window_seconds - (now - timestamps[0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "Rate limit exceeded to protect free API quotas.",
                "message": f"Please wait {max(1, retry_after)} seconds before asking another question.",
                "limit_per_minute": limit
            },
            headers={"Retry-After": str(max(1, retry_after))}
        )

    _request_history[client_ip].append(now)
    return True
