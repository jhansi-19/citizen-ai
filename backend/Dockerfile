# syntax=docker/dockerfile:1
# ─── Production Dockerfile for Citizen AI Backend ────────────────────────────
# Supports:
# 1. Hugging Face Spaces (Port 7860, user 1000, 100% free CPU tier)
# 2. Local Docker / Docker-Compose (Port 8000 via PORT=8000 env var)
# Multi-stage build keeps final image lean (~1.4 GB with CPU PyTorch)

# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM python:3.10-slim AS builder

WORKDIR /build

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install CPU-only PyTorch first (saves ~1.5 GB vs CUDA)
RUN pip install --upgrade pip && \
    pip install --no-cache-dir torch==2.4.1+cpu torchvision==0.19.1+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Copy and install remaining requirements
COPY requirements.txt .
RUN grep -v "^torch" requirements.txt | pip install --no-cache-dir -r /dev/stdin


# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM python:3.10-slim AS runtime

# Install Tesseract for OCR & curl for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy virtual env from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PORT=7860

# Copy application source & data
COPY app/ ./app/
COPY data/ ./data/
COPY run.py .

# Create directories for runtime data & attachments
RUN mkdir -p data/pdfs data/chunks data/attachments chroma_db logs

# Create non-root user (UID 1000 is required by Hugging Face Spaces)
RUN useradd -m -u 1000 user && \
    chown -R user:user /app
USER user

# Expose default ports (7860 for Hugging Face Spaces, 8000 for standard Docker)
EXPOSE 7860
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT:-7860}/health || exit 1

# Start server with dynamic port support
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
