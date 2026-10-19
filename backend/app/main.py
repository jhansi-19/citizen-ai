"""
Citizen AI — FastAPI Application Entry Point
"""

from __future__ import annotations

import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger

from app.config import settings
from app.database import init_db
from app.api import ask, upload, documents, feedback, attachments


# ── Logging Setup ──────────────────────────────────────────────────────────────
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{line}</cyan> - {message}",
    level="INFO",
)
logger.add(
    "logs/backend.log",
    rotation="10 MB",
    retention="7 days",
    level="DEBUG",
)


def sync_canonical_data():
    """Syncs any uploaded PDFs/chunks from backend/data into canonical C:/citizen_AI/data."""
    import json
    import shutil
    try:
        project_root = Path(__file__).resolve().parent.parent.parent
        canonical_data = project_root / "data"
        backend_data = Path(__file__).resolve().parent.parent / "data"

        # 1. Sync PDFs
        backend_pdfs = backend_data / "pdfs"
        canonical_pdfs = canonical_data / "pdfs"
        if backend_pdfs.exists():
            for pdf_file in backend_pdfs.rglob("*.pdf"):
                rel = pdf_file.relative_to(backend_pdfs)
                dest = canonical_pdfs / rel
                dest.parent.mkdir(parents=True, exist_ok=True)
                if not dest.exists():
                    shutil.copy2(pdf_file, dest)
                    logger.info(f"📁 Synced uploaded PDF: {pdf_file.name} -> {dest}")

        # 2. Sync chunks
        backend_chunks_file = backend_data / "chunks" / "all_chunks.jsonl"
        canonical_chunks_file = canonical_data / "chunks" / "all_chunks.jsonl"
        if backend_chunks_file.exists() and canonical_chunks_file.exists():
            existing_ids = set()
            with open(canonical_chunks_file, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        try:
                            c = json.loads(line)
                            existing_ids.add(c.get("chunk_id"))
                        except Exception:
                            pass

            new_chunks = []
            with open(backend_chunks_file, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        try:
                            c = json.loads(line)
                            cid = c.get("chunk_id")
                            if cid and cid not in existing_ids:
                                new_chunks.append(c)
                                existing_ids.add(cid)
                        except Exception:
                            pass

            if new_chunks:
                with open(canonical_chunks_file, "a", encoding="utf-8") as f:
                    for c in new_chunks:
                        f.write(json.dumps(c, ensure_ascii=False) + "\n")
                logger.info(f"✅ Appended {len(new_chunks)} uploaded chunks to canonical all_chunks.jsonl")

                # Upsert into Chroma collection
                try:
                    from app.vector_store import vector_store
                    ids = [c["chunk_id"] for c in new_chunks]
                    docs = [c["text"] for c in new_chunks]
                    metas = [
                        {
                            "doc_name": c.get("doc_name", "Document"),
                            "category": c.get("category", "general"),
                            "page": int(c.get("page", 1)),
                            "chunk_index": int(c.get("chunk_index", 1))
                        }
                        for c in new_chunks
                    ]
                    vector_store.collection.upsert(ids=ids, documents=docs, metadatas=metas)
                    logger.info(f"✅ Upserted {len(new_chunks)} chunks to Chroma vector collection")
                except Exception as ve:
                    logger.warning(f"Chroma upsert note: {ve}")

                # Re-init BM25
                try:
                    from app.bm25_search import init_bm25
                    import app.bm25_search as _bm25_mod
                    _bm25_mod._bm25_index = None
                    _bm25_mod._indexed_chunks = []
                    init_bm25()
                    logger.info("✅ Re-initialized BM25 index with new chunks")
                except Exception as be:
                    logger.warning(f"BM25 re-init note: {be}")

    except Exception as e:
        logger.warning(f"Data sync note: {e}")


# ── Startup / Shutdown ─────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs at startup and shutdown.
    - Validates API keys early.
    - Creates required directories.
    - Initializes SQLite schema.
    """
    settings.pdf_dir.mkdir(parents=True, exist_ok=True)
    settings.chunks_dir.mkdir(parents=True, exist_ok=True)
    settings.logs_db_path.parent.mkdir(parents=True, exist_ok=True)
    Path(settings.chroma_db_path).mkdir(parents=True, exist_ok=True)

    # Create attachments directory
    attachments_dir = Path(settings.pdf_dir).parent.parent / "data" / "attachments"
    attachments_dir.mkdir(parents=True, exist_ok=True)

    # Initialize SQLite database schema
    await init_db()

    missing = settings.validate_keys()
    if missing:
        logger.warning(f"⚠️ Missing recommended keys: {missing}. Verify .env settings.")
    else:
        logger.info(f"✅ LLM provider: {settings.llm_provider} ({settings.active_llm_model})")

    # Sync any uploaded PDFs/chunks into canonical storage
    sync_canonical_data()

    # If ChromaDB is empty on cold start (e.g. fresh container deploy), populate it from all_chunks.jsonl
    try:
        from app.vector_store import vector_store
        from app.bm25_search import init_bm25
        chunks_file = settings.chunks_dir / "all_chunks.jsonl"
        if vector_store.count() == 0 and chunks_file.exists():
            logger.info(f"⚡ Empty vector store detected on startup. Building from {chunks_file}...")
            vector_store.build_from_jsonl(chunks_file)
        init_bm25()
    except Exception as ie:
        logger.warning(f"Chroma/BM25 cold-start build note: {ie}")

    # Start periodic attachment cleanup
    import threading
    def _run_cleanup():
        import time as _time
        while True:
            _time.sleep(3600)  # every hour
            try:
                from app.api.attachments import cleanup_expired_attachments
                cleanup_expired_attachments()
            except Exception as e:
                logger.warning(f"Attachment cleanup error: {e}")

    cleanup_thread = threading.Thread(target=_run_cleanup, daemon=True)
    cleanup_thread.start()
    logger.info(f"🧹 Attachment cleanup scheduled (TTL: {settings.attachment_ttl_hours}h)")

    logger.info(f"✅ Retrieval mode: {settings.retrieval_mode}, top_k={settings.top_k}")
    logger.info(f"✅ Rate limit: {settings.rate_limit_per_minute} req/min per IP")
    logger.info("🚀 Citizen AI backend is ready!")

    yield

    logger.info("🛑 Citizen AI backend shutting down.")


# ── App Instance ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Citizen AI — Government Scheme Assistant API",
    description="Citation-grounded REST & Streaming API for Indian Government Schemes",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
cors_origins = settings.cors_origins_list
has_wildcard = "*" in cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if not has_wildcard else ["*"],
    allow_credentials=not has_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount Static PDFs ──────────────────────────────────────────────────────────
if settings.pdf_dir.exists():
    app.mount("/pdfs", StaticFiles(directory=str(settings.pdf_dir)), name="pdfs")

# ── Mount Attachments Static ──────────────────────────────────────────────────
_att_dir = Path(settings.pdf_dir).parent.parent / "data" / "attachments"
if _att_dir.exists():
    app.mount("/attachments", StaticFiles(directory=str(_att_dir)), name="attachments")


# ── Health Check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health() -> dict:
    missing_keys = settings.validate_keys()
    return {
        "status": "ok",
        "version": "0.1.0",
        "llm_provider": settings.llm_provider,
        "llm_model": settings.active_llm_model,
        "retrieval_mode": settings.retrieval_mode,
        "keys_configured": len(missing_keys) == 0,
        "missing_keys": missing_keys,
    }


# ── Register Routers ───────────────────────────────────────────────────────────
app.include_router(ask.router)
app.include_router(upload.router)
app.include_router(documents.router)
app.include_router(feedback.router)
app.include_router(attachments.router)
