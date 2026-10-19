"""
scripts/build_vector_db.py

Builds and persists the local Chroma vector database
by embedding all chunks from data/chunks/all_chunks.jsonl.
"""

import sys
from pathlib import Path

# Add backend directory to sys.path so we can import app modules
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.config import settings
from app.vector_store import vector_store

CHUNKS_FILE = Path(__file__).resolve().parent.parent / "data" / "chunks" / "all_chunks.jsonl"


def main():
    print("=" * 70)
    print("🇮🇳 Citizen AI — Chroma Vector Store Builder")
    print(f"Embedding Model: {settings.embedding_model} (CPU)")
    print(f"Persist Directory: {settings.chroma_db_path}")
    print("=" * 70)

    if not CHUNKS_FILE.exists():
        print(f"❌ Chunks file not found at: {CHUNKS_FILE}")
        print("Please run scripts/ingest.py first.")
        return

    try:
        count = vector_store.build_from_jsonl(CHUNKS_FILE)
        print("\n" + "=" * 70)
        print(f"✅ Success! Vector store is built with {count:,} chunk embeddings.")
        print(f"📁 Database saved to: {Path(settings.chroma_db_path).resolve()}")
        print("=" * 70)
    except Exception as e:
        print(f"❌ Error building vector store: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
