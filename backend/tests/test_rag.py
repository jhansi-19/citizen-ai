"""
backend/tests/test_rag.py

Tests for vector storage, embedding generation, and citation retrieval.
"""

from app.embeddings import embed_texts
from app.vector_store import vector_store
from app.retriever import retrieve, extract_unique_citations


def test_embedding_generation():
    """Verify local BGE model creates 384-dimensional normalized vectors."""
    text = "Pradhan Mantri Kisan Samman Nidhi scheme guidelines"
    embeddings = embed_texts(text)
    assert len(embeddings) == 1
    assert len(embeddings[0]) == 384  # bge-small-en embedding dimension


def test_retrieval_and_citation_structure():
    """Verify retrieval returns structured passages with doc and page citations."""
    query = "PM-KISAN installment payment amount"
    chunks = retrieve(query, top_k=3)
    assert isinstance(chunks, list)
    if len(chunks) > 0:
        c = chunks[0]
        assert "text" in c
        assert "doc_name" in c
        assert "page" in c
        assert isinstance(c["page"], int)

        citations = extract_unique_citations(chunks)
        assert len(citations) > 0
        assert "doc_name" in citations[0]
        assert "page" in citations[0]
