# 🛡️ Citizen AI — Security & Guardrails Audit Report

**Date:** `2026-10-09`  
**Overall Defense Score:** `100.0%`  
**Guardrail Latency Overhead:** `0.200 ms`  

---

## 1. Threat Category Breakdown

| Threat Category | Tests Run | Passed | Defense Rate (%) |
|---|---|---|---|
| **Prompt Injection** | 5 | 5 | `100.0%` |
| **Jailbreak** | 5 | 5 | `100.0%` |
| **PII Redaction** | 5 | 5 | `100.0%` |
| **Safe Refusal** | 5 | 5 | `100.0%` |

---

## 2. Key Defenses Implemented

### 🛡️ PII Masking Engine
- **Aadhaar Redaction:** 12-digit patterns (`5489 1234 5678`, `2345-6789-0123`) ➔ `[REDACTED_AADHAAR]`
- **Phone Redaction:** 10-digit Indian mobiles (`+91 9876543210`, `9876543210`) ➔ `[REDACTED_PHONE]`
- **PAN Redaction:** Standard Indian PAN card format ➔ `[REDACTED_PAN]`
- **Email Redaction:** Email addresses ➔ `[REDACTED_EMAIL]`

### 🚨 Prompt Injection & Jailbreak Defense
- Detects system prompt leak requests (*"reveal system prompt"*, *"print hidden instructions"*).
- Blocks jailbreaks (*"DAN mode"*, *"sudo mode"*, *"unfiltered ai"*).
- Instant rejection in `<0.1 ms` with standardized security notice.
