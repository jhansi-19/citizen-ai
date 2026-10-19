"""
backend/app/bm25_search.py

BM25 Keyword Search Engine for Citizen AI.
Uses rank-bm25 to perform lexical token matching on exact acronyms,
numbers (e.g., '6000', '55%'), and specific government scheme codes.
"""

import json
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
from rank_bm25 import BM25Okapi
from app.config import settings
from loguru import logger

_bm25_index: Optional[BM25Okapi] = None
_indexed_chunks: List[Dict[str, Any]] = []


def tokenize(text: str) -> List[str]:
    """Basic lowercased alphanumeric tokenizer for BM25."""
    clean = re.sub(r"[^\w\s]", " ", text.lower())
    return [token for token in clean.split() if len(token) > 1]


def init_bm25():
    """Builds in-memory BM25 index from all_chunks.jsonl."""
    global _bm25_index, _indexed_chunks

    # Compute absolute path anchored to this file's location:
    # bm25_search.py → app/ → backend/ → citizen_AI/ → data/chunks/
    _project_root = Path(__file__).resolve().parent.parent.parent
    chunks_file = _project_root / "data" / "chunks" / "all_chunks.jsonl"

    # Fallback: try settings.chunks_dir in case user configured a custom path
    if not chunks_file.exists():
        fallback = settings.chunks_dir / "all_chunks.jsonl"
        if fallback.exists():
            chunks_file = fallback
        else:
            logger.warning(f"Chunks file not found at: {chunks_file} (also tried: {fallback})")
            return

    _indexed_chunks = []
    tokenized_corpus = []

    with open(chunks_file, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                try:
                    record = json.loads(line)
                    _indexed_chunks.append(record)
                    tokenized_corpus.append(tokenize(record.get("text", "")))
                except json.JSONDecodeError:
                    continue

    if tokenized_corpus:
        _bm25_index = BM25Okapi(tokenized_corpus)
        logger.info(f"✅ BM25 index initialized with {len(_indexed_chunks):,} chunks.")


def bm25_search(query: str, top_k: int = 10, category: Optional[str] = None, doc_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    """
    Performs BM25 keyword retrieval, returning top-k matching chunks with scores.
    If doc_ids is provided, only returns chunks belonging to those documents.
    """
    global _bm25_index, _indexed_chunks
    if _bm25_index is None:
        init_bm25()

    if not _bm25_index or not _indexed_chunks:
        return []

    query_tokens = tokenize(query)
    if not query_tokens:
        return []

    scores = _bm25_index.get_scores(query_tokens)
    
    # Pair chunk with score and sort descending
    scored_chunks = []
    for idx, score in enumerate(scores):
        if score > 0.1:  # Filter out 0-score matches
            chunk = _indexed_chunks[idx]
            if category and chunk.get("category", "").lower() != category.lower():
                continue
            if doc_ids and chunk.get("doc_id") not in doc_ids:
                continue
            scored_chunks.append({
                "chunk_id": chunk["chunk_id"],
                "text": chunk["text"],
                "doc_name": chunk.get("doc_name", "Document"),
                "doc_id": chunk.get("doc_id", ""),
                "category": chunk.get("category", "general"),
                "page": int(chunk.get("page", 1)),
                "bm25_score": round(float(score), 4)
            })

    scored_chunks.sort(key=lambda x: x["bm25_score"], reverse=True)
    return scored_chunks[:top_k]
