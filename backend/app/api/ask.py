"""
backend/app/api/ask.py

Main Q&A endpoints for Citizen AI:
- POST /ask : Synchronous response powered by Multi-Tool ReAct Agent Engine (Hybrid RAG, Math AST, Live Web, Guardrails)
- POST /ask/stream : Server-Sent Events (SSE) streaming tokens in real-time
"""

import json
import asyncio
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Request, Body
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel, Field

from app.config import settings
from app.agent import run_agent
from app.cache import generate_cache_key, get_cached_response, set_cached_response
from app.database import save_message, get_conversation_history
from app.rate_limiter import check_rate_limit
from loguru import logger

router = APIRouter(tags=["Question Answering"])


class CitationItem(BaseModel):
    doc_name: str
    page: int
    category: str = "general"
    score: float = 0.0
    url: Optional[str] = None


class AskRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=1000, example="What is the annual benefit amount under PM-KISAN?")
    conversation_id: Optional[str] = Field(default="default-session", description="Session ID for multi-turn chat memory")
    category: Optional[str] = Field(default=None, description="Optional category filter (farmers, students, health, employment)")
    top_k: Optional[int] = Field(default=5, description="Number of context passages to retrieve")
    mode: Optional[str] = Field(default="hybrid", description="Retrieval mode: dense, hybrid, or reranked")
    doc_ids: Optional[List[str]] = Field(default=None, description="Attachment doc_ids for scoped retrieval")
    scope: Optional[str] = Field(default="library", description="Search scope: 'attached' or 'library'")


class AskResponse(BaseModel):
    query: str
    answer: str
    intent: Optional[str] = "document_qa"
    tool_used: Optional[str] = "hybrid_rag"
    citations: List[CitationItem]
    confidence: Optional[float] = 1.0
    conversation_id: str
    message_id: int
    latency_sec: float
    cached: bool = False
    offer_library_search: bool = False


@router.post("/ask", response_model=AskResponse, dependencies=[Depends(check_rate_limit)])
async def ask_question(request_body: AskRequest):
    """
    Standard question answering endpoint powered by the ReAct Agent Engine with
    citation grounding, intent routing, and security guardrails.
    """
    query = request_body.query.strip()
    conv_id = request_body.conversation_id or "default-session"

    # Save user message to database
    await save_message(conversation_id=conv_id, role="user", content=query)

    # 1. Execute Multi-Tool ReAct Agent Engine
    agent_result = run_agent(
        query=query,
        conversation_id=conv_id,
        category=request_body.category,
        mode=request_body.mode or "hybrid",
        doc_ids=request_body.doc_ids,
        scope=request_body.scope or "library"
    )

    answer = agent_result.get("answer", "No response generated.")
    intent = agent_result.get("intent", "document_qa")
    tool_used = agent_result.get("tool_used", "hybrid_rag")
    citations = agent_result.get("citations", [])
    confidence = agent_result.get("confidence", 1.0)
    latency = agent_result.get("latency_sec", 0.0)
    offer_library_search = agent_result.get("offer_library_search", False)

    # 2. Save assistant answer to database
    msg_id = await save_message(
        conversation_id=conv_id,
        role="assistant",
        content=answer,
        citations=citations,
        latency_sec=latency,
        provider=settings.llm_provider,
        model=settings.active_llm_model
    )

    return AskResponse(
        query=query,
        answer=answer,
        intent=intent,
        tool_used=tool_used,
        citations=citations,
        confidence=confidence,
        conversation_id=conv_id,
        message_id=msg_id,
        latency_sec=latency,
        cached=False,
        offer_library_search=offer_library_search
    )


@router.post("/ask/stream", dependencies=[Depends(check_rate_limit)])
async def ask_question_stream(request_body: AskRequest):
    """
    Server-Sent Events (SSE) streaming endpoint for real-time token delivery to the frontend.
    """
    query = request_body.query.strip()
    conv_id = request_body.conversation_id or "default-session"

    async def event_generator():
        # Save user message
        await save_message(conversation_id=conv_id, role="user", content=query)

        # 1. Run agent
        agent_result = run_agent(
            query=query,
            conversation_id=conv_id,
            category=request_body.category,
            mode=request_body.mode or "hybrid",
            doc_ids=request_body.doc_ids,
            scope=request_body.scope or "library"
        )

        full_text = agent_result.get("answer", "")
        citations = agent_result.get("citations", [])
        latency = agent_result.get("latency_sec", 0.0)
        offer_library_search = agent_result.get("offer_library_search", False)

        # Send citations first as initial event
        yield {
            "event": "citations",
            "data": json.dumps({"citations": citations})
        }

        # Stream words/tokens smoothly with slight pacing
        words = full_text.split(" ")
        for i, word in enumerate(words):
            chunk_token = word + (" " if i < len(words) - 1 else "")
            yield {
                "event": "token",
                "data": json.dumps({"token": chunk_token})
            }
            await asyncio.sleep(0.012)

        # Save assistant message in background
        msg_id = await save_message(
            conversation_id=conv_id,
            role="assistant",
            content=full_text,
            citations=citations,
            latency_sec=latency,
            provider=settings.llm_provider,
            model=settings.active_llm_model
        )

        # Send final completion event with message_id and metadata
        yield {
            "event": "done",
            "data": json.dumps({
                "message_id": msg_id,
                "latency_sec": latency,
                "intent": agent_result.get("intent"),
                "tool_used": agent_result.get("tool_used"),
                "offer_library_search": offer_library_search
            })
        }

    return EventSourceResponse(event_generator())
