"""
backend/app/api/upload.py

PDF upload and on-the-fly ingestion endpoint:
Allows users and administrators to upload official scheme circulars and PDFs,
which are immediately parsed, chunked, and indexed into the local vector database.
"""

import re
import json
import shutil
from pathlib import Path
from typing import Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel

from app.config import settings
from app.vector_store import vector_store
from loguru import logger

router = APIRouter(prefix="/upload", tags=["Document Management"])

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None


class UploadResponse(BaseModel):
    status: str
    doc_name: str
    category: str
    total_pages: int
    chunks_created: int
    message: str


@router.post("", response_model=UploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    category: str = Form(default="general")
):
    """
    Upload a scheme PDF, automatically extract page text, chunk it,
    and index the new passages into ChromaDB.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files (.pdf) are supported."
        )

    cat = category.lower().strip()
    target_dir = settings.pdf_dir / cat
    target_dir.mkdir(parents=True, exist_ok=True)
    target_pdf_path = target_dir / file.filename

    # Save uploaded file
    with open(target_pdf_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    logger.info(f"📁 Uploaded PDF saved to: {target_pdf_path}")

    # Process and chunk PDF
    if not fitz:
        raise HTTPException(status_code=500, detail="PyMuPDF is not installed on the server.")

    doc_slug = re.sub(r"[^a-zA-Z0-9]+", "_", target_pdf_path.stem.lower()).strip("_")
    chunks = []

    try:
        doc = fitz.open(str(target_pdf_path))
        total_pages = len(doc)

        for page_num in range(total_pages):
            page = doc[page_num]
            text = page.get_text("text").strip()
            if not text:
                continue

            # Sliding window of 1200 chars (~300 tokens)
            chunk_size = 1200
            overlap = 200
            start = 0
            chunk_idx = 1

            while start < len(text):
                end = min(start + chunk_size, len(text))
                chunk_text = text[start:end].strip()
                if chunk_text:
                    chunk_id = f"{cat}_{doc_slug}_p{page_num + 1}_c{chunk_idx}"
                    chunks.append({
                        "chunk_id": chunk_id,
                        "doc_name": file.filename,
                        "category": cat,
                        "page": page_num + 1,
                        "chunk_index": chunk_idx,
                        "text": chunk_text
                    })
                    chunk_idx += 1
                start += (chunk_size - overlap)

        doc.close()
    except Exception as e:
        logger.error(f"Error parsing PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {e}")

    # Index into Chroma
    if chunks:
        ids = [c["chunk_id"] for c in chunks]
        docs = [c["text"] for c in chunks]
        metas = [
            {
                "doc_name": c["doc_name"],
                "category": c["category"],
                "page": c["page"],
                "chunk_index": c["chunk_index"]
            }
            for c in chunks
        ]
        vector_store.collection.upsert(ids=ids, documents=docs, metadatas=metas)

        # Append to category JSONL
        cat_jsonl = settings.chunks_dir / f"{cat}.jsonl"
        with open(cat_jsonl, "a", encoding="utf-8") as f:
            for c in chunks:
                f.write(json.dumps(c, ensure_ascii=False) + "\n")

        # IMPORTANT: Also append to all_chunks.jsonl so BM25 sees new docs
        all_chunks_path = settings.chunks_dir / "all_chunks.jsonl"
        with open(all_chunks_path, "a", encoding="utf-8") as f:
            for c in chunks:
                f.write(json.dumps(c, ensure_ascii=False) + "\n")

        # Reinitialize BM25 index so next query immediately searches new content
        try:
            from app.bm25_search import init_bm25
            import importlib, app.bm25_search as _bm25_mod
            _bm25_mod._bm25_index = None  # force re-init
            _bm25_mod._indexed_chunks = []
            init_bm25()
            logger.info(f"✅ BM25 re-initialized after upload: {file.filename}")
        except Exception as bm25_err:
            logger.warning(f"BM25 re-init after upload failed (non-fatal): {bm25_err}")

    return UploadResponse(
        status="success",
        doc_name=file.filename,
        category=cat,
        total_pages=total_pages,
        chunks_created=len(chunks),
        message=f"Successfully processed {len(chunks)} chunks from {total_pages} pages into ChromaDB."
    )
