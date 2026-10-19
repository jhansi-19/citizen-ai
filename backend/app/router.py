"""
backend/app/router.py

Classical Scikit-Learn Query-Intent Router for Citizen AI.
Classifies citizen queries in <1ms on CPU into 3 intents:
1. 'document_qa' : Grounded RAG search across scheme policy PDFs
2. 'calculation' : Exact mathematical calculation / arithmetic tool
3. 'web_search'   : Live DuckDuckGo internet search for latest news

Trained using TF-IDF Vectorizer + Multinomial Logistic Regression.
"""

import re
from pathlib import Path
from typing import Tuple, Dict, Any
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from loguru import logger

MODEL_PATH = Path(__file__).resolve().parent / "router_model.joblib"
_router_pipeline: Pipeline | None = None

# Comprehensive training dataset for intent classification
TRAINING_DATA = [
    # ── 1. DOCUMENT_QA INTENTS ──────────────────────────────────────────────
    ("What is the annual financial assistance under PM-KISAN?", "document_qa"),
    ("Who is eligible for Ayushman Bharat PMJAY?", "document_qa"),
    ("What are the exclusion criteria for PM-KISAN?", "document_qa"),
    ("What is the subsidy percentage under PMKSY Per Drop More Crop?", "document_qa"),
    ("What is the family income limit for CSSS scholarship?", "document_qa"),
    ("What are the 18 traditional trades covered under PM Vishwakarma?", "document_qa"),
    ("How many days of post-hospitalization are covered under Ayushman Bharat?", "document_qa"),
    ("What is the loan amount for street vendors under PM SVANidhi tranche 1?", "document_qa"),
    ("What is the price of Jan Aushadhi sanitary napkins?", "document_qa"),
    ("Tell me the rules for Pragati Scholarship for girl students", "document_qa"),
    ("What crops are covered under PM Fasal Bima Yojana?", "document_qa"),
    ("What is the interest rate for prompt repaying farmers under KCC?", "document_qa"),
    ("What are the components of PM Kaushal Vikas Yojana 4.0?", "document_qa"),
    ("How do I apply for Post Matric Scholarship for SC students?", "document_qa"),
    ("What is the loan limit for manufacturing units under PMEGP?", "document_qa"),
    ("Explain the objective of Rashtriya Arogya Nidhi", "document_qa"),
    ("What documents are required for e-KYC in PM-KISAN?", "document_qa"),
    ("What is the sum insured under Ayushman Bharat per family?", "document_qa"),

    # ── 2. CALCULATION INTENTS ──────────────────────────────────────────────
    ("Calculate 6000 / 3", "calculation"),
    ("If a farmer receives 6000 per year, how much is that per month?", "calculation"),
    ("Calculate 55% of 50000", "calculation"),
    ("What is 2000 * 3", "calculation"),
    ("50000 - 15000 = ?", "calculation"),
    ("Calculate 7% interest on 10000 loan", "calculation"),
    ("How much is 12000 divided by 12 months", "calculation"),
    ("Calculate 500 * 15 days stipend", "calculation"),
    ("100000 + 200000 = ?", "calculation"),
    ("What is 35% margin money of 5000000", "calculation"),
    ("Calculate total subsidy: 20000 * 0.07", "calculation"),
    ("How much is 80000 * 12 annual research fellowship?", "calculation"),
    ("Compute 500000 / 5 years", "calculation"),
    ("What is 15000 + 500 * 5", "calculation"),
    ("Calculate 600000 * 0.05", "calculation"),

    # ── 3. WEB_SEARCH INTENTS ───────────────────────────────────────────────
    ("Latest news on PM-KISAN 17th installment release date 2025", "web_search"),
    ("Recent announcements for Ayushman Bharat expansion to senior citizens", "web_search"),
    ("Current portal link to apply for PM Vishwakarma scheme today", "web_search"),
    ("Latest budget allocation updates for agricultural schemes 2025", "web_search"),
    ("Live news regarding National Scholarship Portal deadlines", "web_search"),
    ("What are the latest updates on PM SVANidhi scheme interest subsidy?", "web_search"),
    ("Search internet for PMKVY 4.0 training center locations near me", "web_search"),
    ("Find official website link for Pradhan Mantri Jan Aushadhi kendra registration", "web_search"),
    ("Latest press release from Ministry of Agriculture India", "web_search"),
    ("Recent government circulars published on india.gov.in this week", "web_search"),
    ("Breaking news on PM Fasal Bima claim settlements", "web_search")
]


def train_router_model() -> Pipeline:
    """Trains a lightweight TF-IDF + LogisticRegression pipeline and saves it."""
    texts = [item[0] for item in TRAINING_DATA]
    labels = [item[1] for item in TRAINING_DATA]

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=1000, lowercase=True)),
        ("clf", LogisticRegression(C=1.0, max_iter=200, random_state=42))
    ])

    pipeline.fit(texts, labels)
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    logger.info(f"✅ Trained and saved Intent Router model to: {MODEL_PATH}")
    return pipeline


def get_router() -> Pipeline:
    """Loads or trains the Intent Router model."""
    global _router_pipeline
    if _router_pipeline is None:
        if MODEL_PATH.exists():
            try:
                _router_pipeline = joblib.load(MODEL_PATH)
            except Exception:
                _router_pipeline = train_router_model()
        else:
            _router_pipeline = train_router_model()
    return _router_pipeline


def classify_intent(query: str) -> Tuple[str, float]:
    """
    Classifies a query into ('document_qa' | 'calculation' | 'web_search')
    along with prediction confidence probability.
    """
    # Rule-based fast-track overrides for explicit math formulas
    if re.search(r"^\s*[\d\s\+\-\*\/\(\)\.\,\%\₹\=]+\s*$", query) or re.search(r"\b(calculate|compute)\b.*\d+", query.lower()):
        return ("calculation", 0.99)

    pipeline = get_router()
    probs = pipeline.predict_proba([query])[0]
    classes = pipeline.classes_
    best_idx = probs.argmax()
    
    intent = classes[best_idx]
    confidence = round(float(probs[best_idx]), 3)
    
    return (intent, confidence)
