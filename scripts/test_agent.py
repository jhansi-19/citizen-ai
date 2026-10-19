"""
scripts/test_agent.py

Interactive Multi-Tool Agent CLI for Citizen AI.
Tests automatic routing across:
1. Document QA (Hybrid RAG)
2. Safe Financial Arithmetic (Calculator)
3. Live Web Search (DuckDuckGo)

Usage:
    python scripts/test_agent.py "What is PM-KISAN?"
    python scripts/test_agent.py "Calculate 6000 / 3"
    python scripts/test_agent.py "Latest news on PM-KISAN 2025"
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.agent import run_agent


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/test_agent.py \"<your query here>\"")
        print("\nExamples to test:")
        print("  1. RAG:        python scripts/test_agent.py \"What is the annual assistance under PM-KISAN?\"")
        print("  2. Math:       python scripts/test_agent.py \"If a farmer gets 6000 per year, calculate 6000 / 12 for monthly\"")
        print("  3. Web Search: python scripts/test_agent.py \"Latest news updates on PM Vishwakarma scheme today\"")
        sys.exit(1)

    query = sys.argv[1]
    
    print("=" * 70)
    print(f"🇮🇳 Citizen AI — Multi-Tool Agent Engine")
    print(f"User Query: \"{query}\"")
    print("=" * 70)

    result = run_agent(query=query)

    print(f"\n🎯 Predicted Intent: [{result['intent'].upper()}] (Confidence: {result['confidence']})")
    print(f"🛠️ Tool Invoked:    [{result['tool_used']}]")
    print(f"⏱️ Total Latency:   {result['latency_sec']}s")

    print("\n" + "━" * 70)
    print("💡 AGENT RESPONSE:")
    print("━" * 70)
    print(result["answer"])
    print("━" * 70)

    if result.get("citations"):
        print("\n📚 CITATIONS:")
        for idx, cit in enumerate(result["citations"], 1):
            doc = cit.get("doc_name", "Source")
            page = cit.get("page", 1)
            url = cit.get("url")
            if url:
                print(f"  [{idx}] {doc} — Link: {url}")
            else:
                print(f"  [{idx}] {doc} (Page {page})")

    print("=" * 70)


if __name__ == "__main__":
    main()
