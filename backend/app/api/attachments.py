"""
backend/app/api/attachments.py

Attach-a-PDF endpoints for document-scoped chat.
Handles upload, status polling, deletion, and promotion to library.
"""

import hashlib
import json
import re
import shutil
import threading
import time
import uuid
from pathlib import Path
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel

from app.config import settings
from app.vector_store import vector_store
from loguru import logger

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

router = APIRouter(prefix="/upload/attach", tags=["Attachments"])

# ── In-memory state ──────────────────────────────────────────────────────────
# Attachment status tracking: doc_id → { status, progress, page_count, ... }
_attachment_status: Dict[str, Dict[str, Any]] = {}
# Session → attached doc_ids mapping
_session_attachments: Dict[str, List[str]] = {}
# Content hash → doc_id for dedup
_content_hashes: Dict[str, str] = {}

# Config
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB
MAX_PAGES = 200
MAX_ATTACHMENTS_PER_SESSION = 3
ATTACHMENT_DIR = Path(settings.pdf_dir).parent.parent / "data" / "attachments"


# ── Response Models ──────────────────────────────────────────────────────────

class AttachResponse(BaseModel):
    doc_id: str
    filename: str
    status: str
    file_size: int
    page_count: Optional[int] = None
    message: str


class AttachStatusResponse(BaseModel):
    doc_id: str
    filename: str
    status: str  # uploading | processing | ready | failed
    progress: float  # 0.0 to 1.0
    page_count: Optional[int] = None
    chunks_created: int = 0
    error: Optional[str] = None
    expires_in_hours: Optional[float] = None


class DeleteResponse(BaseModel):
    status: str
    doc_id: str
    message: str


# ── Background Processing ───────────────────────────────────────────────────

def _process_attachment(doc_id: str, filepath: Path, filename: str, conversation_id: str):
    """Background thread: extract text, chunk, embed, index."""
    try:
        _attachment_status[doc_id]["status"] = "processing"
        _attachment_status[doc_id]["progress"] = 0.1

        if not fitz:
            _attachment_status[doc_id]["status"] = "failed"
            _attachment_status[doc_id]["error"] = "PyMuPDF not installed on server"
            return

        doc = fitz.open(str(filepath))
        total_pages = len(doc)

        if total_pages > MAX_PAGES:
            doc.close()
            _attachment_status[doc_id]["status"] = "failed"
            _attachment_status[doc_id]["error"] = f"PDF has {total_pages} pages (max {MAX_PAGES})"
            return

        _attachment_status[doc_id]["page_count"] = total_pages
        _attachment_status[doc_id]["progress"] = 0.2

        doc_slug = re.sub(r"[^a-zA-Z0-9]+", "_", Path(filename).stem.lower()).strip("_")
        chunks = []

        for page_num in range(total_pages):
            page = doc[page_num]
            text = page.get_text("text").strip()
            if not text:
                continue

            # Sliding window: 1200 chars, 200 overlap
            chunk_size = 1200
            overlap = 200
            start = 0
            chunk_idx = 1

            while start < len(text):
                end = min(start + chunk_size, len(text))
                chunk_text = text[start:end].strip()
                if chunk_text:
                    chunk_id = f"att_{doc_id}_{doc_slug}_p{page_num + 1}_c{chunk_idx}"
                    chunks.append({
                        "chunk_id": chunk_id,
                        "doc_name": filename,
                        "doc_id": doc_id,
                        "category": "attached",
                        "page": page_num + 1,
                        "chunk_index": chunk_idx,
                        "text": chunk_text,
                        "session_id": conversation_id,
                        "uploaded_at": int(time.time())
                    })
                    chunk_idx += 1
                start += (chunk_size - overlap)

            # Update progress proportionally
            _attachment_status[doc_id]["progress"] = 0.2 + 0.5 * ((page_num + 1) / total_pages)

        doc.close()

        if not chunks:
            _attachment_status[doc_id]["status"] = "failed"
            _attachment_status[doc_id]["error"] = "No extractable text found in PDF (scanned document?)"
            return

        _attachment_status[doc_id]["progress"] = 0.75

        # Index into ChromaDB with doc_id metadata
        ids = [c["chunk_id"] for c in chunks]
        docs = [c["text"] for c in chunks]
        metas = [
            {
                "doc_name": c["doc_name"],
                "doc_id": c["doc_id"],
                "category": c["category"],
                "page": c["page"],
                "chunk_index": c["chunk_index"],
                "session_id": c.get("session_id", ""),
                "uploaded_at": c.get("uploaded_at", 0)
            }
            for c in chunks
        ]
        vector_store.collection.upsert(ids=ids, documents=docs, metadatas=metas)

        _attachment_status[doc_id]["progress"] = 0.85

        # Save chunks JSONL for BM25
        att_dir = ATTACHMENT_DIR / doc_id
        chunks_jsonl = att_dir / "chunks.jsonl"
        with open(chunks_jsonl, "w", encoding="utf-8") as f:
            for c in chunks:
                f.write(json.dumps(c, ensure_ascii=False) + "\n")

        # Also append to all_chunks.jsonl so BM25 picks them up
        all_chunks_path = settings.chunks_dir / "all_chunks.jsonl"
        with open(all_chunks_path, "a", encoding="utf-8") as f:
            for c in chunks:
                f.write(json.dumps(c, ensure_ascii=False) + "\n")

        # Re-init BM25
        try:
            from app.bm25_search import init_bm25
            import app.bm25_search as _bm25_mod
            _bm25_mod._bm25_index = None
            _bm25_mod._indexed_chunks = []
            init_bm25()
        except Exception as bm25_err:
            logger.warning(f"BM25 re-init after attachment failed (non-fatal): {bm25_err}")

        _attachment_status[doc_id]["progress"] = 1.0
        _attachment_status[doc_id]["status"] = "ready"
        _attachment_status[doc_id]["chunks_created"] = len(chunks)
        logger.info(f"✅ Attachment {doc_id} ready: {len(chunks)} chunks from {total_pages} pages")

    except Exception as e:
        logger.error(f"Attachment processing failed for {doc_id}: {e}")
        _attachment_status[doc_id]["status"] = "failed"
        _attachment_status[doc_id]["error"] = str(e)


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("", response_model=AttachResponse)
async def upload_attachment(
    file: UploadFile = File(...),
    conversation_id: str = Form(default="default-session")
):
    """Upload a PDF for document-scoped chat. Processing runs in background."""
    # Validate file type
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files (.pdf) are supported."
        )

    # Read file content
    content = await file.read()
    file_size = len(content)

    # Validate size
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large ({file_size / 1024 / 1024:.1f} MB). Maximum is {MAX_FILE_SIZE / 1024 / 1024:.0f} MB."
        )

    # Content hash dedup
    content_hash = hashlib.sha256(content).hexdigest()
    if content_hash in _content_hashes:
        existing_doc_id = _content_hashes[content_hash]
        existing_status = _attachment_status.get(existing_doc_id, {})
        if existing_status.get("status") in ("processing", "ready"):
            # Add to session if not already
            session_docs = _session_attachments.setdefault(conversation_id, [])
            if existing_doc_id not in session_docs:
                if len(session_docs) >= MAX_ATTACHMENTS_PER_SESSION:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Maximum {MAX_ATTACHMENTS_PER_SESSION} attachments per conversation."
                    )
                session_docs.append(existing_doc_id)
            return AttachResponse(
                doc_id=existing_doc_id,
                filename=file.filename,
                status=existing_status.get("status", "processing"),
                file_size=file_size,
                page_count=existing_status.get("page_count"),
                message="Duplicate file detected. Reusing existing attachment."
            )

    # Check session attachment limit
    session_docs = _session_attachments.setdefault(conversation_id, [])
    if len(session_docs) >= MAX_ATTACHMENTS_PER_SESSION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_ATTACHMENTS_PER_SESSION} attachments per conversation."
        )

    # Create attachment
    doc_id = f"att_{uuid.uuid4().hex[:12]}"
    att_dir = ATTACHMENT_DIR / doc_id
    att_dir.mkdir(parents=True, exist_ok=True)
    filepath = att_dir / "original.pdf"

    with open(filepath, "wb") as f:
        f.write(content)

    # Track state
    _attachment_status[doc_id] = {
        "doc_id": doc_id,
        "filename": file.filename,
        "status": "uploading",
        "progress": 0.0,
        "page_count": None,
        "chunks_created": 0,
        "error": None,
        "file_size": file_size,
        "content_hash": content_hash,
        "conversation_id": conversation_id,
        "uploaded_at": int(time.time())
    }
    _content_hashes[content_hash] = doc_id
    session_docs.append(doc_id)

    logger.info(f"📎 Attachment {doc_id} saved: {file.filename} ({file_size / 1024:.0f} KB)")

    # Start background processing
    thread = threading.Thread(
        target=_process_attachment,
        args=(doc_id, filepath, file.filename, conversation_id),
        daemon=True
    )
    thread.start()

    return AttachResponse(
        doc_id=doc_id,
        filename=file.filename,
        status="processing",
        file_size=file_size,
        page_count=None,
        message="Upload received. Processing in background."
    )


@router.get("/{doc_id}/status", response_model=AttachStatusResponse)
async def get_attachment_status(doc_id: str):
    """Poll processing status of an uploaded attachment."""
    if doc_id not in _attachment_status:
        raise HTTPException(status_code=404, detail=f"Attachment {doc_id} not found.")

    info = _attachment_status[doc_id]
    ttl_hours = settings.attachment_ttl_hours
    uploaded_at = info.get("uploaded_at", 0)
    elapsed = (time.time() - uploaded_at) / 3600 if uploaded_at else 0
    expires_in = max(0, ttl_hours - elapsed) if ttl_hours > 0 else None

    return AttachStatusResponse(
        doc_id=doc_id,
        filename=info.get("filename", "unknown.pdf"),
        status=info["status"],
        progress=info.get("progress", 0.0),
        page_count=info.get("page_count"),
        chunks_created=info.get("chunks_created", 0),
        error=info.get("error"),
        expires_in_hours=round(expires_in, 1) if expires_in is not None else None
    )


@router.delete("/{doc_id}", response_model=DeleteResponse)
async def delete_attachment(doc_id: str):
    """Remove an attachment: delete file, Chroma chunks, BM25 entries."""
    if doc_id not in _attachment_status:
        raise HTTPException(status_code=404, detail=f"Attachment {doc_id} not found.")

    info = _attachment_status[doc_id]

    # Remove from ChromaDB
    try:
        results = vector_store.collection.get(where={"doc_id": doc_id})
        if results and results["ids"]:
            vector_store.collection.delete(ids=results["ids"])
            logger.info(f"🗑️ Deleted {len(results['ids'])} chunks from Chroma for {doc_id}")
    except Exception as e:
        logger.warning(f"Chroma deletion for {doc_id} failed: {e}")

    # Remove files
    att_dir = ATTACHMENT_DIR / doc_id
    if att_dir.exists():
        shutil.rmtree(att_dir, ignore_errors=True)

    # Remove from session tracking
    for conv_id, doc_ids in _session_attachments.items():
        if doc_id in doc_ids:
            doc_ids.remove(doc_id)

    # Remove content hash
    content_hash = info.get("content_hash")
    if content_hash and content_hash in _content_hashes:
        del _content_hashes[content_hash]

    # Remove status entry
    del _attachment_status[doc_id]

    # Re-init BM25 (since we removed chunks from all_chunks.jsonl conceptually)
    # For simplicity, rebuild from file minus deleted doc_id
    _rebuild_all_chunks_without(doc_id)

    return DeleteResponse(
        status="deleted",
        doc_id=doc_id,
        message=f"Attachment {doc_id} and all its indexed data have been removed."
    )


@router.post("/{doc_id}/add-to-library", response_model=DeleteResponse)
async def add_to_library(
    doc_id: str,
    category: str = Form(default="general")
):
    """Promote an attachment to the permanent document library."""
    if doc_id not in _attachment_status:
        raise HTTPException(status_code=404, detail=f"Attachment {doc_id} not found.")

    info = _attachment_status[doc_id]
    if info["status"] != "ready":
        raise HTTPException(status_code=400, detail="Attachment must be fully processed before promotion.")

    filename = info.get("filename", "document.pdf")
    src_pdf = ATTACHMENT_DIR / doc_id / "original.pdf"

    if not src_pdf.exists():
        raise HTTPException(status_code=404, detail="Attachment file not found on disk.")

    # Copy to library
    cat = category.lower().strip()
    target_dir = settings.pdf_dir / cat
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / filename
    shutil.copy2(src_pdf, target_path)

    # Update Chroma metadata: change category from "attached" to the real category
    try:
        results = vector_store.collection.get(where={"doc_id": doc_id})
        if results and results["ids"]:
            updated_metas = []
            for meta in results["metadatas"]:
                meta["category"] = cat
                meta.pop("session_id", None)
                meta.pop("uploaded_at", None)
                updated_metas.append(meta)
            vector_store.collection.update(
                ids=results["ids"],
                metadatas=updated_metas
            )
    except Exception as e:
        logger.warning(f"Chroma metadata update for {doc_id} failed: {e}")

    logger.info(f"📚 Promoted attachment {doc_id} ({filename}) to library/{cat}")

    return DeleteResponse(
        status="promoted",
        doc_id=doc_id,
        message=f"'{filename}' added to the {cat} library."
    )


@router.get("/session/{conversation_id}")
async def get_session_attachments(conversation_id: str):
    """Get all attachments for a conversation session."""
    doc_ids = _session_attachments.get(conversation_id, [])
    attachments = []
    for did in doc_ids:
        info = _attachment_status.get(did, {})
        if info:
            attachments.append({
                "doc_id": did,
                "filename": info.get("filename", "unknown.pdf"),
                "status": info.get("status", "unknown"),
                "page_count": info.get("page_count"),
                "file_size": info.get("file_size", 0),
            })
    return {"conversation_id": conversation_id, "attachments": attachments}


# ── Helpers ──────────────────────────────────────────────────────────────────

def _rebuild_all_chunks_without(removed_doc_id: str):
    """Rebuild all_chunks.jsonl excluding chunks from the deleted doc_id, then re-init BM25."""
    all_chunks_path = settings.chunks_dir / "all_chunks.jsonl"
    if not all_chunks_path.exists():
        return

    kept_lines = []
    with open(all_chunks_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                try:
                    record = json.loads(line)
                    if record.get("doc_id") != removed_doc_id:
                        kept_lines.append(line)
                except json.JSONDecodeError:
                    kept_lines.append(line)  # preserve non-JSON lines

    with open(all_chunks_path, "w", encoding="utf-8") as f:
        f.writelines(kept_lines)

    # Re-init BM25
    try:
        from app.bm25_search import init_bm25
        import app.bm25_search as _bm25_mod
        _bm25_mod._bm25_index = None
        _bm25_mod._indexed_chunks = []
        init_bm25()
    except Exception as e:
        logger.warning(f"BM25 re-init after deletion failed: {e}")


def cleanup_expired_attachments():
    """Remove attachments older than TTL. Called periodically."""
    ttl_seconds = settings.attachment_ttl_hours * 3600
    now = time.time()
    expired = []

    for doc_id, info in list(_attachment_status.items()):
        uploaded_at = info.get("uploaded_at", 0)
        if uploaded_at and (now - uploaded_at) > ttl_seconds:
            expired.append(doc_id)

    for doc_id in expired:
        logger.info(f"🧹 Cleaning up expired attachment: {doc_id}")
        # Remove from Chroma
        try:
            results = vector_store.collection.get(where={"doc_id": doc_id})
            if results and results["ids"]:
                vector_store.collection.delete(ids=results["ids"])
        except Exception:
            pass

        # Remove files
        att_dir = ATTACHMENT_DIR / doc_id
        if att_dir.exists():
            shutil.rmtree(att_dir, ignore_errors=True)

        # Clean up tracking
        content_hash = _attachment_status[doc_id].get("content_hash")
        if content_hash and content_hash in _content_hashes:
            del _content_hashes[content_hash]

        for conv_id, doc_ids in _session_attachments.items():
            if doc_id in doc_ids:
                doc_ids.remove(doc_id)

        del _attachment_status[doc_id]

    if expired:
        _rebuild_all_chunks_without_many(expired)
        logger.info(f"🧹 Cleaned up {len(expired)} expired attachments")


def _rebuild_all_chunks_without_many(removed_doc_ids: list):
    """Rebuild all_chunks.jsonl excluding multiple doc_ids."""
    all_chunks_path = settings.chunks_dir / "all_chunks.jsonl"
    if not all_chunks_path.exists():
        return

    removed_set = set(removed_doc_ids)
    kept_lines = []
    with open(all_chunks_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                try:
                    record = json.loads(line)
                    if record.get("doc_id") not in removed_set:
                        kept_lines.append(line)
                except json.JSONDecodeError:
                    kept_lines.append(line)

    with open(all_chunks_path, "w", encoding="utf-8") as f:
        f.writelines(kept_lines)

    try:
        from app.bm25_search import init_bm25
        import app.bm25_search as _bm25_mod
        _bm25_mod._bm25_index = None
        _bm25_mod._indexed_chunks = []
        init_bm25()
    except Exception:
        pass
