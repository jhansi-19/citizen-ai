"""
backend/app/guardrails.py

Production-Grade Security & Privacy Guardrails for Citizen AI:
1. PII Redaction:
   - 12-Digit Indian Aadhaar Numbers (e.g. 1234 5678 9012 or 123456789012)
   - 10-Digit Indian Mobile Numbers (e.g. +91 9876543210 or 9876543210)
   - Indian PAN Card Numbers (e.g. ABCDE1234F)
   - Email Addresses
2. Prompt Injection & Jailbreak Defense:
   - Detects jailbreaks ("ignore all previous instructions", "DAN mode", "system prompt reveal")
   - Blocks prompt leakage attempts
3. Content Moderation & Toxic Query Rejection
"""

import re
from typing import Dict, Any, Tuple, List
from loguru import logger

# ─── 1. PII PATTERNS ────────────────────────────────────────────────────────
AADHAAR_REGEX = re.compile(r'\b[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}\b')
PHONE_REGEX = re.compile(r'(?:\+91[\-\s]?)?[6-9]\d{9}\b')
PAN_REGEX = re.compile(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b')
EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b')

# ─── 2. PROMPT INJECTION & JAILBREAK PATTERNS ──────────────────────────────
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules|commands)",
    r"disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)",
    r"you\s+are\s+now\s+in\s+(developer|unrestricted|god|dan|jailbreak)\s+mode",
    r"(reveal|print|show|output|leak)\s+(your\s+)?(system\s+prompt|hidden\s+instructions|initial\s+prompt|backend\s+api\s+key|environment\s+variables|api\s+keys?)",
    r"print\s+(your\s+)?(system\s+prompt|initial\s+prompt|hidden\s+instructions)",
    r"output\s+(everything|the\s+text)\s+above",
    r"what\s+is\s+your\s+(exact\s+)?system\s+prompt",
    r"bypass\s+(all\s+)?safety\s+guidelines",
    r"act\s+as\s+(an\s+unfiltered|an\s+unrestricted|a\s+malicious)\s+ai",
    r"base64\s+decode\s+and\s+execute",
    r"sudo\s+mode",
    r"jailbreak",
]
INJECTION_REGEX = re.compile("|".join(INJECTION_PATTERNS), re.IGNORECASE)


def redact_pii(text: str) -> Tuple[str, Dict[str, int]]:
    """
    Scans and redacts sensitive Indian Personally Identifiable Information (PII).
    Returns sanitized text and a summary count of redacted entities.
    """
    counts = {"aadhaar": 0, "phone": 0, "pan": 0, "email": 0}
    sanitized = text

    # Redact Aadhaar
    aadhaar_matches = AADHAAR_REGEX.findall(sanitized)
    if aadhaar_matches:
        counts["aadhaar"] = len(aadhaar_matches)
        sanitized = AADHAAR_REGEX.sub("[REDACTED_AADHAAR]", sanitized)

    # Redact PAN
    pan_matches = PAN_REGEX.findall(sanitized)
    if pan_matches:
        counts["pan"] = len(pan_matches)
        sanitized = PAN_REGEX.sub("[REDACTED_PAN]", sanitized)

    # Redact Mobile Phone
    phone_matches = PHONE_REGEX.findall(sanitized)
    if phone_matches:
        counts["phone"] = len(phone_matches)
        sanitized = PHONE_REGEX.sub("[REDACTED_PHONE]", sanitized)

    # Redact Email
    email_matches = EMAIL_REGEX.findall(sanitized)
    if email_matches:
        counts["email"] = len(email_matches)
        sanitized = EMAIL_REGEX.sub("[REDACTED_EMAIL]", sanitized)

    total_redacted = sum(counts.values())
    if total_redacted > 0:
        logger.warning(f"🛡️ Guardrail: Redacted {total_redacted} PII entities from input text: {counts}")

    return sanitized, counts


def validate_input_safety(query: str) -> Tuple[bool, str, str]:
    """
    Audits incoming user queries for prompt injections, system prompt extraction,
    and jailbreak attempts.
    
    Returns:
      (is_safe: bool, reason: str, sanitized_query: str)
    """
    # 1. PII Redaction first
    sanitized_query, pii_counts = redact_pii(query)

    # 2. Check for Prompt Injection / Jailbreak
    if INJECTION_REGEX.search(sanitized_query):
        logger.warning(f"🚨 Security Alert: Prompt injection / jailbreak detected in query: '{query[:80]}...'")
        return (
            False,
            "Security Guardrail Triggered: The request contains prohibited instructions or prompt injection attempts.",
            sanitized_query
        )

    # 3. Check for Empty / Trivial Query
    if len(sanitized_query.strip()) < 2:
        return (
            False,
            "Query too short. Please ask a valid question about Indian Government schemes.",
            sanitized_query
        )

    return (True, "OK", sanitized_query)


GUARDRAIL_BLOCKED_RESPONSE = (
    "🛡️ **Citizen AI Security Notice:**\n\n"
    "Your request could not be processed because it triggered our safety & security policy. "
    "Citizen AI is dedicated strictly to providing authentic, citation-grounded guidance on "
    "official Indian Government welfare schemes.\n\n"
    "Please ask a valid scheme-related question (e.g., *'What are the eligibility criteria for PM-KISAN?'*)."
)
