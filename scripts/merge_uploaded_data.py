"""
scripts/merge_uploaded_data.py

Merges any files from C:\citizen_AI\backend\data into C:\citizen_AI\data:
1. Copies all uploaded PDFs into C:\citizen_AI\data\pdfs\<category>\
2. Appends any new chunks from C:\citizen_AI\backend\data\chunks\all_chunks.jsonl
   into C:\citizen_AI\data\chunks\all_chunks.jsonl (avoiding duplicate chunk_ids)
3. Indexes any missing chunks into ChromaDB
"""

import json
import shutil
from pathlib import Path

PROJECT_ROOT = Path("C:/citizen_AI")
CANONICAL_DATA = PROJECT_ROOT / "data"
BACKEND_DATA = PROJECT_ROOT / "backend" / "data"

CANONICAL_PDFS = CANONICAL_DATA / "pdfs"
CANONICAL_CHUNKS = CANONICAL_DATA / "chunks" / "all_chunks.jsonl"

BACKEND_PDFS = BACKEND_DATA / "pdfs"
BACKEND_CHUNKS = BACKEND_DATA / "chunks" / "all_chunks.jsonl"

print("🔍 Step 1: Syncing PDFs...")
if BACKEND_PDFS.exists():
    for pdf_file in BACKEND_PDFS.rglob("*.pdf"):
        rel = pdf_file.relative_to(BACKEND_PDFS)
        dest = CANONICAL_PDFS / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not dest.exists():
            shutil.copy2(pdf_file, dest)
            print(f"  Copied PDF: {pdf_file.name} -> {dest}")
        else:
            print(f"  PDF already exists at destination: {pdf_file.name}")

print("\n🔍 Step 2: Merging chunks into canonical all_chunks.jsonl...")
existing_ids = set()
if CANONICAL_CHUNKS.exists():
    with open(CANONICAL_CHUNKS, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                try:
                    c = json.loads(line)
                    existing_ids.add(c.get("chunk_id"))
                except Exception:
                    pass

print(f"  Canonical chunks count before merge: {len(existing_ids)}")

new_chunks = []
if BACKEND_CHUNKS.exists():
    with open(BACKEND_CHUNKS, "r", encoding="utf-8") as f:
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

print(f"  Found {len(new_chunks)} new chunks to append.")

if new_chunks:
    with open(CANONICAL_CHUNKS, "a", encoding="utf-8") as f:
        for c in new_chunks:
            f.write(json.dumps(c, ensure_ascii=False) + "\n")
    print(f"  ✅ Appended {len(new_chunks)} chunks to {CANONICAL_CHUNKS}")

# Step 3: Index into ChromaDB
print("\n🔍 Step 3: Upserting new chunks into ChromaDB...")
try:
    import chromadb
    from sentence_transformers import SentenceTransformer

    chroma_path = "C:/citizen_AI/backend/chroma_db"
    client = chromadb.PersistentClient(path=chroma_path)
    
    # Check collection
    collections = client.list_collections()
    col_names = [col.name for col in collections]
    print(f"  Chroma collections found: {col_names}")

    if "citizen_schemes" in col_names:
        collection = client.get_collection("citizen_schemes")
        print(f"  Existing chunks in Chroma: {collection.count()}")

        if new_chunks:
            print("  Loading embedding model BAAI/bge-small-en-v1.5 to embed new chunks...")
            model = SentenceTransformer("BAAI/bge-small-en-v1.5")
            
            ids = [c["chunk_id"] for c in new_chunks]
            documents = [c["text"] for c in new_chunks]
            metadatas = [
                {
                    "doc_name": c.get("doc_name", "Document"),
                    "category": c.get("category", "general"),
                    "page": int(c.get("page", 1)),
                    "chunk_index": int(c.get("chunk_index", 1))
                }
                for c in new_chunks
            ]

            embeddings = model.encode(documents, normalize_embeddings=True).tolist()
            collection.upsert(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)
            print(f"  ✅ Upserted {len(new_chunks)} into ChromaDB! New total: {collection.count()}")
        else:
            print("  No new chunks to embed into ChromaDB.")
except Exception as e:
    print(f"  ⚠️ Chroma indexing note: {e}")

print("\n🎉 Merge complete!")
