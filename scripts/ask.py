"""
scripts/ask.py

CLI Query Interface for Citizen AI Baseline RAG.
Retrieves relevant scheme passages, queries the LLM with strict grounding,
and prints the cited answer and reference table.

Usage:
    python scripts/ask.py "What is the annual benefit amount under PM-KISAN?"
    python scripts/ask.py "Who is eligible for Ayushman Bharat PMJAY?"
    python scripts/ask.py "What is the capital of Australia?"  # tests 'I don't know' guardrail
"""

import sys
import argparse
from pathlib import Path

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.config import settings
from app.retriever import retrieve, extract_unique_citations
from app.llm import llm_client


def ask(query: str, category: str = None, top_k: int = 5):
    print("=" * 70)
    print(f"🇮🇳 Citizen AI — Question Answering Engine")
    print(f"Query: \"{query}\"")
    print(f"Provider: {settings.llm_provider} ({settings.active_llm_model})")
    print("=" * 70)

    print("\n🔍 Retrieving relevant scheme guidelines from Chroma...")
    chunks = retrieve(query=query, top_k=top_k, category=category)
    citations = extract_unique_citations(chunks)

    print(f"   Found {len(chunks)} relevant passages across {len(citations)} document pages.")

    print("🤖 Generating grounded answer...")
    result = llm_client.generate(query=query, contexts=chunks)

    print("\n" + "━" * 70)
    print("💡 ANSWER:")
    print("━" * 70)
    print(result.get("answer", "No answer."))
    print("━" * 70)

    print("\n📚 SOURCE CITATIONS:")
    if citations:
        for idx, cit in enumerate(citations, 1):
            doc = cit["doc_name"]
            page = cit["page"]
            score = cit.get("score", 0.0)
            print(f"  [{idx}] {doc} (Page {page}) — Relevance Match: {score:.2f}")
    else:
        print("  (No direct citations found)")

    print(f"\n⏱️ Response Latency: {result.get('latency_sec', 0.0)}s")
    print("=" * 70)


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/ask.py \"<your question here>\"")
        print("Example: python scripts/ask.py \"What is the benefit under PM-KISAN?\"")
        sys.exit(1)

    query = sys.argv[1]
    ask(query)


if __name__ == "__main__":
    main()
