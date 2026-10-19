"""
backend/app/llm.py

Handles LLM inference.
- Gemini: uses new google-genai SDK (supports gemini-3.8-flash for new users)
- Groq: fetches live model list via REST with timeout, then tries each
"""

import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

from typing import List, Dict, Any, Optional
import time
import httpx
from app.config import settings
from loguru import logger

SYSTEM_PROMPT = """You are "Citizen AI", an expert assistant for Indian Government welfare schemes and policies.

YOUR ONLY JOB: Extract facts from the Reference Context passages and answer the user's question with citations.

RULES — FOLLOW EXACTLY:
1. ALWAYS answer using the text found in the Reference Context passages provided below.
2. If ANY passage mentions the topic (eligibility, benefits, exclusions, amounts, dates), you MUST answer from it. Do NOT say you cannot find it.
3. Cite every fact as: [Source: <doc_name>, Page <page_number>]
4. Use markdown: bold headings, bullet points, numbered lists where appropriate.
5. ONLY say "I couldn't find this information" if the context passages are about completely unrelated topics like sports, cooking, or entertainment — NOT for government scheme questions.
6. If the context has partial information, give a partial answer and cite it. Never refuse a scheme-related question.
"""

OUT_OF_SCOPE_REFUSAL = "I couldn't find this information in the uploaded official scheme documents. Please verify with official government sources at india.gov.in."


def format_context_prompt(query: str, chunks: List[Dict[str, Any]]) -> str:
    context_blocks = []
    for idx, c in enumerate(chunks[:8], 1):
        doc = c.get("doc_name", "Document")
        page = c.get("page", 1)
        text = c.get("text", "").strip()[:1500]
        context_blocks.append(f"--- [Source {idx}]: {doc} (Page {page}) ---\n{text}")

    full_context = "\n\n".join(context_blocks)
    return f"""You have been given {len(chunks)} official government document passages as Reference Context.
READ them carefully and answer the question below using ONLY facts from these passages.

Reference Context Passages:
{full_context}

User Question: {query}

Instructions:
- Extract the relevant facts from the passages above.
- Write a complete, well-structured answer with markdown formatting.
- Cite every fact with [Source: doc_name, Page X].
- If eligibility, exclusion, or benefit details appear in ANY passage, include them all.
- DO NOT say you cannot find information if it appears in any passage above.

Your comprehensive cited answer:"""


def _fetch_groq_models(api_key: str) -> List[str]:
    """Fetch live Groq model list via REST with a 10s timeout, filtering for chat-capable models."""
    try:
        resp = httpx.get(
            "https://api.groq.com/openai/v1/models",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=10.0
        )
        if resp.status_code == 200:
            data = resp.json()
            raw_models = [m["id"] for m in data.get("data", [])]
            # Exclude guardrails, audio, specialized Arabic or moderation models
            chat_models = [
                m for m in raw_models
                if not any(x in m.lower() for x in ["whisper", "safeguard", "prompt-guard", "orpheus", "allam", "guard"])
            ]
            
            # Sort with preferred flagship reasoning models first (real Groq free-tier models)
            preferred_order = [
                "llama-3.3-70b-versatile",   # Best free Groq model for instruction following
                "llama-3.1-70b-versatile",
                "llama3-70b-8192",
                "mixtral-8x7b-32768",
                "llama-3.1-8b-instant",
                "llama3-8b-8192",
            ]
            sorted_models = []
            for p in preferred_order:
                if p in chat_models:
                    sorted_models.append(p)
            for m in chat_models:
                if m not in sorted_models:
                    sorted_models.append(m)

            logger.info(f"✅ Filtered {len(sorted_models)} active chat Groq models: {sorted_models}")
            return sorted_models if sorted_models else GROQ_FALLBACK_MODELS
    except Exception as e:
        logger.warning(f"Could not fetch Groq model list: {e}")
    return GROQ_FALLBACK_MODELS


class LLMClient:
    def __init__(self):
        self.working_gemini_model: Optional[str] = None
        self.working_groq_model: Optional[str] = None
        self._groq_models_cache: Optional[List[str]] = None

    def generate(
        self,
        query: str,
        contexts: List[Dict[str, Any]],
        temperature: float = 0.1
    ) -> Dict[str, Any]:
        start_time = time.time()

        if not contexts:
            return {
                "answer": OUT_OF_SCOPE_REFUSAL,
                "provider": "guardrail",
                "model": "empty_context",
                "latency_sec": 0.001,
                "is_error": False
            }

        prompt = format_context_prompt(query, contexts)

        # 1. Try Gemini first (new google-genai SDK)
        if settings.gemini_api_key:
            res = self._call_gemini(prompt, temperature, start_time)
            if not res.get("is_error", False):
                return res
            logger.warning(f"Gemini failed: {res.get('answer')}. Trying Groq...")

        # 2. Try Groq fallback
        if settings.groq_api_key:
            res = self._call_groq(prompt, temperature, start_time)
            if not res.get("is_error", False):
                return res
            logger.warning(f"Groq failed: {res.get('answer')}")

        return {
            "answer": "Could not generate response. Please verify your GEMINI_API_KEY in .env.",
            "provider": "none",
            "model": "none",
            "latency_sec": round(time.time() - start_time, 2),
            "is_error": True
        }

    def _call_gemini(self, prompt: str, temperature: float, start_time: float) -> Dict[str, Any]:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.gemini_api_key)

            # Try cached working model first, then primary recommendation
            candidate_models = []
            if self.working_gemini_model:
                candidate_models.append(self.working_gemini_model)
            for m in ["gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]:
                if m not in candidate_models:
                    candidate_models.append(m)

            for m in candidate_models:
                try:
                    logger.debug(f"Trying Gemini model: {m}")
                    resp = client.models.generate_content(
                        model=m,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=SYSTEM_PROMPT,
                            temperature=temperature,
                            max_output_tokens=2048,
                            http_options=types.HttpOptions(timeout=15000)  # 15s — falls to Groq faster
                        )
                    )
                    if resp and resp.text:
                        self.working_gemini_model = m
                        logger.info(f"✅ Gemini responded with model: {m}")
                        return {
                            "answer": resp.text,
                            "provider": "gemini",
                            "model": m,
                            "latency_sec": round(time.time() - start_time, 2),
                            "is_error": False
                        }
                except Exception as ex:
                    logger.debug(f"Gemini {m} attempt: {ex}")
                    continue

            return {"answer": "All Gemini models failed", "is_error": True}
        except ImportError:
            return {"answer": "google-genai not installed. Run: pip install google-genai", "is_error": True}
        except Exception as e:
            return {"answer": f"Gemini exception: {e}", "is_error": True}

    def _call_groq(self, prompt: str, temperature: float, start_time: float) -> Dict[str, Any]:
        from groq import Groq
        try:
            client = Groq(api_key=settings.groq_api_key)

            # Fetch live model list once (cached), fallback to known list
            if self._groq_models_cache is None:
                live = _fetch_groq_models(settings.groq_api_key)
                self._groq_models_cache = live if live else GROQ_FALLBACK_MODELS

            # Build candidate list: working model first
            candidate_models = []
            if self.working_groq_model and self.working_groq_model in self._groq_models_cache:
                candidate_models.append(self.working_groq_model)
            for m in self._groq_models_cache:
                if m not in candidate_models:
                    candidate_models.append(m)

            for m in candidate_models:
                try:
                    logger.debug(f"Trying Groq model: {m}")
                    completion = client.chat.completions.create(
                        model=m,
                        messages=[
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=temperature,
                        max_tokens=2048,
                        timeout=30
                    )
                    if completion.choices and completion.choices[0].message.content:
                        self.working_groq_model = m
                        logger.info(f"✅ Groq responded with model: {m}")
                        return {
                            "answer": completion.choices[0].message.content,
                            "provider": "groq",
                            "model": m,
                            "latency_sec": round(time.time() - start_time, 2),
                            "is_error": False
                        }
                except Exception as ex:
                    logger.debug(f"Groq {m} attempt: {ex}")
                    continue

            return {"answer": "All Groq models unavailable", "is_error": True}
        except Exception as e:
            return {"answer": f"Groq exception: {e}", "is_error": True}


# Global singleton LLM client
llm_client = LLMClient()
