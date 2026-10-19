"""
backend/tests/test_api.py

Integration tests for FastAPI endpoints (/health, /documents, /ask, /feedback).
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_list_documents_endpoint():
    response = client.get("/documents")
    assert response.status_code == 200
    docs = response.json()
    assert isinstance(docs, list)


def test_document_stats_endpoint():
    response = client.get("/documents/stats")
    assert response.status_code == 200
    stats = response.json()
    assert "total_documents" in stats
    assert "total_chunks_indexed" in stats


def test_feedback_submission():
    payload = {
        "rating": 1,
        "comment": "Accurate citations for PM-KISAN!"
    }
    response = client.post("/feedback", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "feedback_id" in data


def test_feedback_stats():
    response = client.get("/feedback/stats")
    assert response.status_code == 200
    stats = response.json()
    assert "thumbs_up" in stats
    assert "total_queries" in stats
