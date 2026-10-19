"""
Minimal smoke test for Phase 0.
Verifies the app starts, the health endpoint responds, and config loads.
Run: pytest backend/tests/test_health.py -v
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_200():
    """Health endpoint must always return 200, even with no API keys."""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_has_required_fields():
    """Health response must include status, version, and llm_provider."""
    data = client.get("/health").json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "llm_provider" in data
    assert data["llm_provider"] in ("gemini", "groq")


def test_health_reflects_config():
    """The health endpoint should reflect the active config values."""
    from app.config import settings
    data = client.get("/health").json()
    assert data["llm_provider"] == settings.llm_provider
    assert data["retrieval_mode"] == settings.retrieval_mode
