# 🇮🇳 Citizen AI

> **A citation-grounded AI assistant for Indian government schemes.**  
> Ask questions about PM-KISAN, PM Ayushman Bharat, National Scholarship Portal schemes, and more — and get answers backed by exact citations from official documents.

> ⚠️ **Disclaimer**: This is not official government advice. Always verify information with official sources at india.gov.in.

---

## Demo

*Live demo URL will be added after Phase 10 deployment.*

---

## What it does

- **Cited answers**: Every answer cites the exact document name and page number. Click to open the PDF at that page.
- **Upload your own PDFs**: Drop in any official scheme guideline and ask questions immediately.
- **Honest "I don't know"**: If the answer isn't in the documents, it says so — it never hallucinates.
- **Conversation memory**: Remembers your chat history within a session.
- **Built-in tools**: Calculator for scheme benefit calculations, web search for latest updates.
- **100% free**: Rs 0 spent. No paid APIs, no credit card required anywhere.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend | FastAPI + Python 3.10 | Fast, typed, async |
| Embeddings | BAAI/bge-small-en-v1.5 | Best-in-class at ~130 MB, runs on CPU |
| Vector DB | Chroma (local) | No server needed, free forever |
| Hybrid Search | BM25 + dense vectors (RRF) | Better recall than either alone |
| Reranker | BAAI/bge-reranker-base | Cross-encoder, improves precision |
| LLM | Gemini 1.5 Flash (free tier) | 1M tokens/day free, no card |
| LLM fallback | Groq (free tier) | ~30 RPM free |
| Frontend | Next.js + Tailwind + shadcn/ui | Modern SaaS look |
| Fine-tuning | Qwen2.5-1.5B + QLoRA on Colab T4 | Free GPU, push adapter to HF Hub |
| DB | SQLite | Zero-config, no server |
| CI | GitHub Actions | 2000 free min/month |
| Hosting | HF Spaces (backend) + Vercel (frontend) | Both free, no card |

---

## Evaluation Results

See [docs/RESULTS.md](docs/RESULTS.md) for all real numbers from scripts I ran.

---

## Project Structure

```
citizen_AI/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── config.py        # All settings from .env
│   │   ├── api/             # Route handlers (/ask, /upload, etc.)
│   │   ├── tools/           # Calculator, web search, doc search
│   │   └── ...
│   ├── tests/               # pytest test suite
│   ├── requirements.txt
│   ├── Dockerfile
│   └── run.py               # Dev server launcher
├── frontend/                # Next.js app (Phase 9)
├── scripts/
│   ├── download_pdfs.py     # Download official PDFs
│   ├── ingest.py            # Parse, chunk, save to JSONL
│   ├── eval.py              # Evaluation metrics
│   └── ...
├── data/
│   ├── pdfs/                # Downloaded PDFs (git-ignored)
│   └── chunks/              # JSONL chunks (git-ignored)
├── colab/
│   └── finetune_qwen_qlora.ipynb
├── docs/
│   ├── RESULTS.md           # All experiment results
│   ├── ARCHITECTURE.md      # System design
│   ├── BLOG_POST_OUTLINE.md
│   └── INTERVIEW_QA.md
├── logs/                    # SQLite logs (git-ignored)
├── .env.example             # Copy to .env and fill in keys
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## Quick Start (Local)

### Prerequisites
- Python 3.10+
- Node.js 22+
- Git
- Docker (optional, for containerized run)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/citizen-ai.git
cd citizen_AI
```

### 2. Set up Python environment
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install CPU-only PyTorch first (important — avoids downloading huge CUDA build)
pip install torch==2.4.1+cpu torchvision==0.19.1+cpu --index-url https://download.pytorch.org/whl/cpu

# Install remaining dependencies
pip install -r requirements.txt
```

### 3. Set up environment variables
```bash
cd ..                          # back to citizen_AI/
cp .env.example .env
# Open .env and fill in your API keys (see "Getting API Keys" below)
```

### 4. Run the backend
```bash
cd backend
python run.py
# Server starts at http://localhost:8000
# Swagger UI at http://localhost:8000/docs
```

### 5. Run the frontend (Phase 9)
```bash
cd frontend
npm install
npm run dev
# App opens at http://localhost:3000
```

### 6. Or run with Docker
```bash
# From citizen_AI/ root:
docker compose up --build
# Backend at http://localhost:8000
```

---

## Getting Free API Keys (No Credit Card Required)

| Service | Where to get it | Time |
|---|---|---|
| **Gemini API** | [aistudio.google.com](https://aistudio.google.com) → "Get API key" | 2 min |
| **Groq** | [console.groq.com](https://console.groq.com) → "Create API Key" | 2 min |
| **Hugging Face** | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) → "New token" (read) | 2 min |
| **GitHub** | Already have one | — |
| **Vercel** | [vercel.com](https://vercel.com) → "Sign up with GitHub" | 1 min |

---

## Data

Official PDFs are downloaded from `.gov.in` domains by `scripts/download_pdfs.py`.  
Categories covered: Farmers · Students/Education · Health · Employment/Skill Development

To download the dataset:
```bash
cd citizen_AI
python scripts/download_pdfs.py
python scripts/ingest.py
```

---

## Free Tier Limits

| Service | Limit | What happens if exceeded |
|---|---|---|
| Gemini 1.5 Flash | 15 RPM, 1M tokens/day | Friendly error: "API quota exceeded, try again later" |
| Groq | ~30 RPM (model-dependent) | Automatic fallback + friendly error |
| HF Spaces (backend) | CPU, sleeps after inactivity | UI shows "Server waking up…" spinner (~30–60s) |
| Vercel Hobby | 100 GB bandwidth/month | Very unlikely to hit |
| GitHub Actions | 2000 min/month | Very unlikely to hit |

---

## Architecture

*Full diagram in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — added after Phase 10.*

---

## Contributing

This is a portfolio project. Issues and suggestions welcome!

---

## License

MIT — see LICENSE file.

---

*Built with ❤️ as a portfolio project demonstrating end-to-end AI engineering.*
