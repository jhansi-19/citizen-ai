"""
backend/app/retriever.py

Unified Retrieval Pipeline supporting:
1. "dense"    : Dense Semantic Vector Search (ChromaDB + BGE embeddings)
2. "hybrid"   : Reciprocal Rank Fusion (RRF) combining Dense Vectors + BM25 Keywords
3. "reranked" : Hybrid Retrieval + Cross-Encoder Deep Neural Reranker
"""

from collections import defaultdict
from typing import List, Dict, Any, Optional
from app.config import settings
from app.vector_store import vector_store
from app.bm25_search import bm25_search
from app.reranker import rerank_passages
from loguru import logger

# Minimum confidence threshold for out-of-scope refusal
RELEVANCE_CONFIDENCE_THRESHOLD = 0.35


def reciprocal_rank_fusion(
    dense_results: List[Dict[str, Any]],
    bm25_results: List[Dict[str, Any]],
    query: str = "",
    k_constant: int = 60
) -> List[Dict[str, Any]]:
    """
    Combines dense vector and BM25 rankings using Reciprocal Rank Fusion (RRF)
    with exact scheme document keyword prioritization.
    """
    rrf_scores = defaultdict(float)
    chunks_by_id = {}

    query_lower = query.lower().replace("-", " ").replace("_", " ")

    for rank, item in enumerate(dense_results, 1):
        cid = item["chunk_id"]
        rrf_scores[cid] += 1.0 / (k_constant + rank)
        chunks_by_id[cid] = item

    for rank, item in enumerate(bm25_results, 1):
        cid = item["chunk_id"]
        rrf_scores[cid] += 1.0 / (k_constant + rank)
        if cid not in chunks_by_id:
            chunks_by_id[cid] = item

    merged_results = []
    for cid, rrf_score in rrf_scores.items():
        chunk = chunks_by_id[cid].copy()
        
        # Boost chunks whose doc_name matches query keywords (e.g. kisan, vishwakarma, ayushman)
        doc_clean = chunk.get("doc_name", "").lower().replace("-", " ").replace("_", " ")
        matching_keywords = [w for w in query_lower.split() if len(w) > 3 and w in doc_clean]
        boost = 0.05 * len(matching_keywords)

        final_rrf = rrf_score + boost
        chunk["rrf_score"] = round(final_rrf, 5)
        dense_score = chunk.get("score", 0.0)
        chunk["score"] = max(dense_score, round(min(1.0, final_rrf * 40), 4))
        merged_results.append(chunk)

    merged_results.sort(key=lambda x: x["rrf_score"], reverse=True)
    return merged_results


def retrieve(
    query: str,
    top_k: Optional[int] = None,
    category: Optional[str] = None,
    mode: Optional[str] = None,
    doc_ids: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    k = top_k or 8  # Retrieve top 8 chunks for comprehensive multi-page coverage
    active_mode = (mode or settings.retrieval_mode or "hybrid").lower()

    if active_mode == "dense":
        return vector_store.search(query=query, top_k=k, category=category, doc_ids=doc_ids)

    # Search wider candidate pool (25 items) to capture all pages of matching scheme documents
    dense_candidates = vector_store.search(query=query, top_k=max(k, 25), category=category, doc_ids=doc_ids)
    bm25_candidates = bm25_search(query=query, top_k=max(k, 25), category=category, doc_ids=doc_ids)
    hybrid_candidates = reciprocal_rank_fusion(dense_candidates, bm25_candidates, query=query)

    if active_mode == "hybrid":
        return hybrid_candidates[:k]

    if active_mode == "reranked":
        top_candidates = hybrid_candidates[:20]
        return rerank_passages(query=query, candidate_chunks=top_candidates, top_k=k)

    return hybrid_candidates[:k]


def is_context_relevant(chunks: List[Dict[str, Any]], threshold: float = RELEVANCE_CONFIDENCE_THRESHOLD) -> bool:
    """
    Guardrail: Returns True if top retrieved chunks have genuine relevance.
    """
    if not chunks:
        return False
    top_chunk = chunks[0]
    score = top_chunk.get("score", 0.0)
    rrf = top_chunk.get("rrf_score", 0.0)
    bm25 = top_chunk.get("bm25_score", 0.0)

    if score >= threshold or rrf >= 0.005 or bm25 > 0.5:
        return True
    return False


def extract_unique_citations(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen = set()
    citations = []

    for c in chunks:
        doc = c.get("doc_name", "Official Guideline")
        page = c.get("page", 1)
        key = (doc, page)
        if key not in seen:
            seen.add(key)
            citations.append({
                "doc_name": doc,
                "page": page,
                "category": c.get("category", "general"),
                "score": c.get("score", 0.0)
            })

    return sorted(citations, key=lambda x: x["score"], reverse=True)
