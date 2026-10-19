"""
scripts/verify_data.py

Verifies the integrity, distribution, and citation metadata completeness
of chunks generated in data/chunks/.
"""

import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
CHUNKS_DIR = ROOT_DIR / "data" / "chunks"


def main():
    print("=" * 70)
    print("🔍 Citizen AI — Dataset & Citation Verification Report")
    print("=" * 70)

    master_file = CHUNKS_DIR / "all_chunks.jsonl"
    if not master_file.exists():
        print(f"❌ Master chunks file not found: {master_file}")
        print("Please run scripts/ingest.py first.")
        return

    records = []
    with open(master_file, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            if line.strip():
                try:
                    records.append(json.loads(line))
                except json.JSONDecodeError as e:
                    print(f"⚠️ JSON parsing error at line {line_num}: {e}")

    total = len(records)
    if total == 0:
        print("❌ all_chunks.jsonl is empty.")
        return

    categories = {}
    docs = set()
    total_chars = 0
    total_tokens = 0
    missing_metadata = 0

    for r in records:
        cat = r.get("category", "unknown")
        doc = r.get("doc_name", "unknown")
        page = r.get("page")
        text = r.get("text", "")

        categories[cat] = categories.get(cat, 0) + 1
        docs.add(doc)
        total_chars += len(text)
        total_tokens += r.get("token_count_approx", len(text.split()))

        if not doc or page is None or not text:
            missing_metadata += 1

    avg_chars = total_chars / total
    avg_tokens = total_tokens / total

    print(f"📊 Total Chunks:            {total:,}")
    print(f"📄 Unique Documents:        {len(docs)}")
    print(f"📏 Average Chunk Length:    {avg_chars:.1f} characters (~{avg_tokens:.1f} words)")
    print(f"🛡️ Missing Citation Fields: {missing_metadata} (should be 0)")
    print("\n📂 Category Breakdown:")
    for cat, count in sorted(categories.items()):
        pct = (count / total) * 100
        print(f"  • {cat.capitalize():<18}: {count:6,d} chunks ({pct:5.1f}%)")

    print("\n🔎 Sample Citation Chunk Record (First 1):")
    sample = records[0]
    print(json.dumps({
        "chunk_id": sample.get("chunk_id"),
        "doc_name": sample.get("doc_name"),
        "category": sample.get("category"),
        "page": sample.get("page"),
        "preview_text": sample.get("text", "")[:150] + "..."
    }, indent=2))

    print("\n" + "=" * 70)
    if missing_metadata == 0 and total > 0:
        print("✅ Data pipeline verification PASSED. Ready for Vector DB (Phase 2).")
    else:
        print("⚠️ Data pipeline verification found warnings. Check details above.")
    print("=" * 70)


if __name__ == "__main__":
    main()
