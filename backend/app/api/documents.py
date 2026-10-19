"""
backend/app/api/documents.py

Document discovery and statistics endpoints:
Enables users and UI to browse official PDFs, view page counts,
filter by scheme category, and inspect vector store health.
"""

from pathlib import Path
from typing import List, Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel

from app.config import settings
from app.vector_store import vector_store

router = APIRouter(prefix="/documents", tags=["Document Management"])


class DocumentItem(BaseModel):
    name: str
    category: str
    size_kb: float
    path: str


class DocumentStatsResponse(BaseModel):
    total_documents: int
    total_chunks_indexed: int
    category_breakdown: Dict[str, int]


@router.get("", response_model=List[DocumentItem])
async def list_documents(category: str = None):
    """
    List all uploaded scheme PDF documents on the server.
    """
    docs = []
    base_dir = settings.pdf_dir

    if not base_dir.exists():
        return docs

    # Discover all PDFs recursively in any category subfolder
    seen_names = set()
    for pdf_file in base_dir.rglob("*.pdf"):
        if pdf_file.name in seen_names:
            continue
        seen_names.add(pdf_file.name)
        size_kb = round(pdf_file.stat().st_size / 1024, 1)
        cat = pdf_file.parent.name if pdf_file.parent != base_dir else "general"
        if category and cat.lower() != category.lower():
            continue
        docs.append(DocumentItem(
            name=pdf_file.name,
            category=cat,
            size_kb=size_kb,
            path=f"/pdfs/{cat}/{pdf_file.name}"
        ))

    return sorted(docs, key=lambda x: (x.category, x.name))


@router.get("/stats", response_model=DocumentStatsResponse)
async def get_document_stats():
    """
    Returns high-level statistics about indexed documents and ChromaDB chunk totals.
    """
    base_dir = settings.pdf_dir
    cat_counts = {}
    total_docs = 0

    if base_dir.exists():
        for cat_dir in base_dir.iterdir():
            if cat_dir.is_dir():
                pdf_count = len(list(cat_dir.glob("*.pdf")))
                cat_counts[cat_dir.name] = pdf_count
                total_docs += pdf_count

    return DocumentStatsResponse(
        total_documents=total_docs,
        total_chunks_indexed=vector_store.count(),
        category_breakdown=cat_counts
    )
