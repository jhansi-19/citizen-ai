"""
backend/app/vector_store.py

Manages local persistent Chroma vector database indexing and retrieval.
Embeds document chunks and enables vector similarity queries.
"""

import json
from pathlib import Path
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.api.types import EmbeddingFunction, Documents, Embeddings
from app.config import settings
from app.embeddings import embed_texts
from loguru import logger


class LocalBGEEmbeddingFunction(EmbeddingFunction):
    """Bridge connecting ChromaDB to our local sentence-transformers model."""
    def __call__(self, input: Documents) -> Embeddings:
        return embed_texts(input)


class VectorStore:
    def __init__(self, persist_directory: Optional[str] = None):
        self.persist_dir = persist_directory or settings.chroma_db_path
        self.client = chromadb.PersistentClient(
            path=self.persist_dir,
            settings=chromadb.config.Settings(anonymized_telemetry=False)
        )
        self.embedding_fn = LocalBGEEmbeddingFunction()
        self.collection_name = "citizen_schemes"
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"}
        )

    def count(self) -> int:
        """Returns total number of chunks currently indexed."""
        return self.collection.count()

    def build_from_jsonl(self, jsonl_path: Path, batch_size: int = 16) -> int:
        """
        Indexes all chunk records from all_chunks.jsonl into Chroma.
        Re-indexing performs an upsert by chunk_id.
        """
        if not jsonl_path.exists():
            raise FileNotFoundError(f"Chunks file not found at: {jsonl_path}")

        records = []
        with open(jsonl_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    try:
                        records.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue

        total = len(records)
        logger.info(f"Indexing {total} chunks into Chroma collection '{self.collection_name}'...")

        import gc
        for i in range(0, total, batch_size):
            batch = records[i:i + batch_size]
            ids = [r["chunk_id"] for r in batch]
            documents = [r["text"] for r in batch]
            metadatas = [
                {
                    "doc_name": r.get("doc_name", "Unknown"),
                    "category": r.get("category", "General"),
                    "page": int(r.get("page", 1)),
                    "chunk_index": int(r.get("chunk_index", 1))
                }
                for r in batch
            ]

            self.collection.upsert(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )
            gc.collect()
            logger.info(f"Indexed batch [{min(i + batch_size, total):,}/{total:,}]")

        indexed_count = self.collection.count()
        logger.info(f"✅ Indexing complete. Chroma store now contains {indexed_count:,} chunks.")
        return indexed_count

    def search(
        self,
        query: str,
        top_k: int = 5,
        category: Optional[str] = None,
        doc_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Searches Chroma for the most relevant document chunks.
        If doc_ids is provided, restricts search to those documents only.
        Returns matched text, metadata (doc_name, page), and cosine distance.
        """
        if doc_ids:
            where_filter = {"doc_id": {"$in": doc_ids}}
        elif category:
            where_filter = {"category": category.lower()}
        else:
            where_filter = None
        
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k,
            where=where_filter,
            include=["documents", "metadatas", "distances"]
        )

        formatted_results = []
        if not results or not results["documents"] or not results["documents"][0]:
            return formatted_results

        docs = results["documents"][0]
        metas = results["metadatas"][0]
        distances = results["distances"][0]
        ids = results["ids"][0]

        for chunk_id, doc_text, meta, dist in zip(ids, docs, metas, distances):
            # Cosine similarity = 1 - cosine distance
            score = round(1.0 - float(dist), 4) if dist is not None else 1.0
            formatted_results.append({
                "chunk_id": chunk_id,
                "text": doc_text,
                "doc_name": meta.get("doc_name", "Document"),
                "category": meta.get("category", "general"),
                "page": meta.get("page", 1),
                "score": score
            })

        return formatted_results


# Global singleton instance
vector_store = VectorStore()
