"""
run.py — Development server launcher.

Usage:
    python run.py

This is a convenience wrapper around uvicorn.
In production / Docker we call uvicorn directly.
"""

import uvicorn
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=True,       # auto-reload on file changes during development
        log_level="info",
    )
