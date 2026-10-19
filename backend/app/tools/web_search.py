"""
backend/app/tools/web_search.py

DuckDuckGo live web search tool for Citizen AI.
Fetches real-time announcements, news updates, and portal links with zero API keys or cost.
"""

from typing import List, Dict, Any
from loguru import logger

# Support both old package name (duckduckgo_search) and new name (ddgs)
DDGS = None
try:
    from ddgs import DDGS
except ImportError:
    try:
        from duckduckgo_search import DDGS
    except ImportError:
        DDGS = None


def search_web(query: str, max_results: int = 4) -> List[Dict[str, Any]]:
    """
    Performs DuckDuckGo web search for live Indian government scheme announcements.
    Returns list of dicts with title, url, and snippet body.
    """
    if not DDGS:
        logger.warning("Neither 'ddgs' nor 'duckduckgo-search' package is installed.")
        return []

    def _parse_results(raw):
        results = []
        for item in raw:
            results.append({
                "title": item.get("title", "Government Portal Update"),
                "url": item.get("href", item.get("url", "")),
                "snippet": item.get("body", item.get("description", ""))
            })
        return results

    # Try with gov.in priority first, then plain query as fallback
    queries_to_try = [
        f"{query} India government",
        query,
    ]

    for q in queries_to_try:
        try:
            with DDGS() as ddgs:
                raw_results = list(ddgs.text(q, max_results=max_results))
                if raw_results:
                    results = _parse_results(raw_results)
                    logger.info(f"🌐 Web search found {len(results)} results for: '{q}'")
                    return results
        except Exception as e:
            logger.warning(f"Web search attempt failed for '{q}': {e}")
            continue

    logger.warning("Web search returned 0 results for all query variants.")
    return []
