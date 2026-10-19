"""
scripts/ingest.py

Parses downloaded scheme PDFs using PyMuPDF (fitz) with OCR fallback,
chunks text while preserving page-level citation metadata,
and exports clean JSONL records for vector embeddings and hybrid search.

Schema per line in data/chunks/*.jsonl:
{
    "chunk_id": "farmers_pm_kisan_p4_c1",
    "doc_name": "PM_KISAN_Operational_Guidelines.pdf",
    "category": "farmers",
    "page": 4,
    "chunk_index": 1,
    "text": "...",
    "char_count": 842,
    "token_count_approx": 170
}
"""

import os
import sys
import re
import json
import argparse
from pathlib import Path

# Ensure project root is in path
ROOT_DIR = Path(__file__).resolve().parent.parent
PDF_DIR = ROOT_DIR / "data" / "pdfs"
CHUNKS_DIR = ROOT_DIR / "data" / "chunks"

try:
    import fitz  # PyMuPDF
except ImportError:
    print("❌ PyMuPDF (fitz) not found. Run: pip install pymupdf")
    sys.exit(1)


def clean_text(raw_text: str) -> str:
    """Normalizes whitespace, removes control chars and repetitive formatting noise."""
    if not raw_text:
        return ""
    # Replace multiple newlines and tab spaces
    text = re.sub(r"[\r\n\t]+", " ", raw_text)
    # Remove excessive whitespace
    text = re.sub(r"\s{2,}", " ", text)
    # Remove non-printable / control characters
    text = re.sub(r"[^\x20-\x7E\u0900-\u097F]", " ", text)
    return text.strip()


def chunk_text_window(text: str, chunk_size: int = 1200, overlap: int = 200) -> list[str]:
    """
    Sliding window chunking by character count (roughly 250-350 tokens per chunk).
    Attempts to break cleanly at sentence boundaries (period, question mark, newline).
    """
    if not text or len(text) <= chunk_size:
        return [text] if text else []

    chunks = []
    start = 0
    total_len = len(text)

    while start < total_len:
        end = start + chunk_size
        if end >= total_len:
            chunk = text[start:].strip()
            if chunk:
                chunks.append(chunk)
            break

        # Look for sentence boundary to split cleanly
        boundary = max(
            text.rfind(". ", start, end),
            text.rfind(".\n", start, end),
            text.rfind("; ", start, end),
            text.rfind("\n", start, end)
        )

        if boundary != -1 and boundary > start + (chunk_size // 2):
            split_pos = boundary + 1
        else:
            split_pos = end

        chunk = text[start:split_pos].strip()
        if chunk:
            chunks.append(chunk)

        start = split_pos - overlap
        if start < 0:
            start = 0

    return chunks


def extract_pdf_chunks(pdf_path: Path, category: str, chunk_size: int = 1200, overlap: int = 200) -> list[dict]:
    """Extracts text page-by-page from a PDF and produces chunk records with page metadata."""
    chunks = []
    doc_name = pdf_path.name
    doc_slug = re.sub(r"[^a-zA-Z0-9]+", "_", pdf_path.stem.lower()).strip("_")

    try:
        doc = fitz.open(str(pdf_path))
    except Exception as e:
        print(f"    ⚠️ Could not open {doc_name}: {e}")
        return []

    for page_num in range(len(doc)):
        page = doc[page_num]
        raw_text = page.get_text("text")

        # Basic OCR fallback if text is missing or scanned
        if len(raw_text.strip()) < 30:
            try:
                import pytesseract
                from PIL import Image
                import io

                pix = page.get_pixmap(dpi=150)
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                raw_text = pytesseract.image_to_string(img)
            except Exception:
                pass

        cleaned = clean_text(raw_text)
        if not cleaned:
            continue

        page_chunks = chunk_text_window(cleaned, chunk_size=chunk_size, overlap=overlap)

        for chunk_idx, chunk_text in enumerate(page_chunks, 1):
            chunk_id = f"{category}_{doc_slug}_p{page_num + 1}_c{chunk_idx}"
            chunks.append({
                "chunk_id": chunk_id,
                "doc_name": doc_name,
                "category": category,
                "page": page_num + 1,
                "chunk_index": chunk_idx,
                "text": chunk_text,
                "char_count": len(chunk_text),
                "token_count_approx": len(chunk_text.split())
            })

    doc.close()
    return chunks


def main():
    parser = argparse.ArgumentParser(description="Ingest PDFs into structured JSONL chunks.")
    parser.add_argument("--chunk-size", type=int, default=1200, help="Target characters per chunk (~300 tokens)")
    parser.add_argument("--overlap", type=int, default=200, help="Character overlap between consecutive chunks")
    args = parser.parse_args()

    print("=" * 70)
    print("🇮🇳 Citizen AI — Ingestion & Page-Level Chunking Pipeline")
    print(f"Chunk Config: size={args.chunk_size} chars, overlap={args.overlap} chars")
    print("=" * 70)

    CHUNKS_DIR.mkdir(parents=True, exist_ok=True)

    categories = [d.name for d in PDF_DIR.iterdir() if d.is_dir()]
    if not categories:
        print("❌ No PDF category folders found in data/pdfs/. Please run scripts/download_pdfs.py first.")
        sys.exit(1)

    all_chunks = []
    category_counts = {}

    for cat in sorted(categories):
        cat_dir = PDF_DIR / cat
        pdf_files = list(cat_dir.glob("*.pdf"))
        if not pdf_files:
            continue

        cat_chunks = []
        print(f"\n📁 Processing category: [{cat.upper()}] ({len(pdf_files)} PDFs)")

        for idx, pdf_path in enumerate(pdf_files, 1):
            chunks = extract_pdf_chunks(pdf_path, cat, chunk_size=args.chunk_size, overlap=args.overlap)
            cat_chunks.extend(chunks)
            print(f"  [{idx:02d}/{len(pdf_files):02d}] {pdf_path.name[:45]:<45} → {len(chunks):4d} chunks")

        # Save category JSONL
        cat_jsonl_path = CHUNKS_DIR / f"{cat}.jsonl"
        with open(cat_jsonl_path, "w", encoding="utf-8") as f:
            for item in cat_chunks:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")

        category_counts[cat] = len(cat_chunks)
        all_chunks.extend(cat_chunks)

    # Save combined all_chunks.jsonl
    master_jsonl_path = CHUNKS_DIR / "all_chunks.jsonl"
    with open(master_jsonl_path, "w", encoding="utf-8") as f:
        for item in all_chunks:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    print("\n" + "=" * 70)
    print("✅ Ingestion Complete!")
    print(f"Total Chunks Generated: {len(all_chunks):,}")
    for cat, count in category_counts.items():
        print(f"  • {cat.capitalize():<15}: {count:6,d} chunks")
    print(f"Master output: {master_jsonl_path}")
    print("=" * 70)


if __name__ == "__main__":
    main()
