"""
backend/app/agent.py

Multi-Tool ReAct Agent Loop for Citizen AI.
Orchestrates:
1. Intent Classification (via Scikit-Learn router in <1ms)
2. Tool Execution:
   - Tool 'doc_rag'      : Grounded hybrid RAG search with PDF page citations
   - Tool 'calculator'   : Safe Python AST calculation engine
   - Tool 'web_search'   : Live DuckDuckGo search for current updates
3. Final Synthesized Answer Generation with appropriate citations
"""

import time
import re
from typing import Dict, Any, List, Optional
from app.config import settings
from app.router import classify_intent
from app.retriever import retrieve, extract_unique_citations
from app.llm import llm_client
from app.tools.calculator import calculate_expression
from app.tools.web_search import search_web
from app.guardrails import validate_input_safety, redact_pii, GUARDRAIL_BLOCKED_RESPONSE
from loguru import logger


def run_agent(
    query: str,
    conversation_id: str = "default-session",
    category: Optional[str] = None,
    mode: Optional[str] = "hybrid",
    doc_ids: Optional[List[str]] = None,
    scope: Optional[str] = "library"
) -> Dict[str, Any]:
    """
    Executes the multi-tool agent loop with integrated security & privacy guardrails.
    When scope="attached" and doc_ids are provided, retrieval is restricted to those documents.
    """
    start_time = time.time()
    
    # 0. Security Guardrails: Validate Input & Redact PII
    is_safe, safety_reason, sanitized_query = validate_input_safety(query)
    if not is_safe:
        return {
            "intent": "blocked_security",
            "tool_used": "guardrail_security",
            "query": query,
            "answer": GUARDRAIL_BLOCKED_RESPONSE,
            "citations": [],
            "confidence": 1.0,
            "latency_sec": round(time.time() - start_time, 4)
        }

    query_clean = sanitized_query.strip()

    # 1. Classify Intent via Scikit-Learn ML Router
    intent, confidence = classify_intent(query_clean)
    logger.info(f"🎯 Router predicted intent: '{intent}' (Confidence: {confidence}) for query: '{query_clean}'")

    # If scope is "attached", force document_qa intent (skip calc/web for attached docs)
    if scope == "attached" and doc_ids:
        intent = "document_qa"
        logger.info(f"📎 Scoped to attached docs: {doc_ids}")

    # ── BRANCH A: CALCULATION TOOL ──────────────────────────────────────────
    if intent == "calculation":
        # Extract math expression: find numbers connected by operators
        # Strips surrounding words like "calculate", "compute", "for monthly", etc.
        math_match = re.search(r'[\d\s\+\-\*\/\.\(\)\%]+(?:[+\-\*\/][\d\s\+\-\*\/\.\(\)\%]+)+', query_clean)
        if math_match:
            expr_to_calc = math_match.group(0).strip()
        else:
            # Fallback: pull any standalone number
            num_match = re.search(r'[\d]+(?:[\/\*\+\-][\d]+)+', query_clean.replace(" ", ""))
            expr_to_calc = num_match.group(0) if num_match else query_clean
        calc_result = calculate_expression(expr_to_calc)

        if calc_result.get("success"):
            res_val = calc_result["formatted"]
            answer = (
                f"### 🧮 Calculation Result\n\n"
                f"**Formula:** `{calc_result['expression']}`  \n"
                f"**Result:** **₹{res_val}**\n\n"
                f"*Computed safely via Citizen AI Calculator Engine.*"
            )
            return {
                "intent": "calculation",
                "tool_used": "calculator",
                "query": query_clean,
                "answer": answer,
                "citations": [],
                "confidence": confidence,
                "latency_sec": round(time.time() - start_time, 3)
            }

    # ── BRANCH B: LIVE WEB SEARCH TOOL ──────────────────────────────────────
    if intent == "web_search":
        web_results = search_web(query=query_clean, max_results=4)
        if web_results:
            context_blocks = []
            web_citations = []
            for idx, item in enumerate(web_results, 1):
                context_blocks.append(f"Source [{idx}]: {item['title']} ({item['url']})\nSnippet: {item['snippet']}")
                web_citations.append({
                    "doc_name": item["title"],
                    "page": 1,
                    "url": item["url"],
                    "category": "live_web",
                    "score": 0.95
                })

            prompt_context = [{"doc_name": r["title"], "page": 1, "text": r["snippet"]} for r in web_results]
            gen_res = llm_client.generate(query=query_clean, contexts=prompt_context)

            return {
                "intent": "web_search",
                "tool_used": "duckduckgo_search",
                "query": query_clean,
                "answer": f"🌐 **Live Web Search Results:**\n\n" + gen_res.get("answer", ""),
                "citations": web_citations,
                "confidence": confidence,
                "latency_sec": round(time.time() - start_time, 2)
            }
        else:
            # No live results — return clear message, do NOT fall to doc RAG
            return {
                "intent": "web_search",
                "tool_used": "duckduckgo_search",
                "query": query_clean,
                "answer": (
                    "🌐 **Live Web Search:** No live results were found at this moment.\n\n"
                    "Please check directly at:\n"
                    "- [pmvishwakarma.gov.in](https://pmvishwakarma.gov.in)\n"
                    "- [india.gov.in](https://india.gov.in)\n"
                    "- [pmindia.gov.in](https://pmindia.gov.in)"
                ),
                "citations": [],
                "confidence": confidence,
                "latency_sec": round(time.time() - start_time, 2)
            }


    # ── BRANCH C: DOCUMENT RAG SEARCH (DEFAULT) ─────────────────────────────
    chunks = retrieve(query=query_clean, top_k=settings.top_k, category=category, mode=mode, doc_ids=doc_ids)
    citations = extract_unique_citations(chunks)

    # Scoped retrieval: if attached scope and no relevant context found, don't fall back
    if scope == "attached" and doc_ids:
        from app.retriever import is_context_relevant
        if not chunks or not is_context_relevant(chunks):
            return {
                "intent": "document_qa",
                "tool_used": "scoped_rag",
                "query": query_clean,
                "answer": (
                    "I couldn't find the answer to this question in the attached document(s). "
                    "The information may not be covered in these files.\n\n"
                    "You can try **searching all documents** in the library for a broader search."
                ),
                "citations": [],
                "confidence": confidence,
                "offer_library_search": True,
                "latency_sec": round(time.time() - start_time, 2)
            }

    gen_res = llm_client.generate(query=query_clean, contexts=chunks)

    return {
        "intent": "document_qa",
        "tool_used": "hybrid_rag" if not doc_ids else "scoped_rag",
        "query": query_clean,
        "answer": gen_res.get("answer", ""),
        "citations": citations,
        "confidence": confidence,
        "offer_library_search": False,
        "latency_sec": round(time.time() - start_time, 2)
    }
