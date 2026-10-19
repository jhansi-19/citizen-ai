"""
backend/app/database.py

Async SQLite database for conversation history, session tracking, and user feedback.
Stores chat memory locally with zero external server dependencies.
"""

import json
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
import aiosqlite
from app.config import settings
from loguru import logger

DB_PATH = Path(settings.logs_db_path)


async def init_db():
    """Initializes SQLite schema for conversations, messages, and feedback."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(str(DB_PATH)) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                citations TEXT,
                latency_sec REAL DEFAULT 0.0,
                provider TEXT,
                model TEXT,
                created_at REAL NOT NULL,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message_id INTEGER,
                conversation_id TEXT,
                rating INTEGER NOT NULL,
                comment TEXT,
                created_at REAL NOT NULL
            )
        """)
        await db.commit()
    logger.info(f"✅ SQLite database initialized at: {DB_PATH.resolve()}")


async def save_message(
    conversation_id: str,
    role: str,
    content: str,
    citations: Optional[List[Dict[str, Any]]] = None,
    latency_sec: float = 0.0,
    provider: Optional[str] = None,
    model: Optional[str] = None
) -> int:
    """Saves a single turn (user prompt or assistant answer) to conversation memory."""
    now = time.time()
    citations_json = json.dumps(citations or [], ensure_ascii=False)

    async with aiosqlite.connect(str(DB_PATH)) as db:
        # Upsert conversation record
        await db.execute("""
            INSERT INTO conversations (id, created_at, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at
        """, (conversation_id, now, now))

        cursor = await db.execute("""
            INSERT INTO messages (conversation_id, role, content, citations, latency_sec, provider, model, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (conversation_id, role, content, citations_json, latency_sec, provider, model, now))
        await db.commit()
        return cursor.lastrowid or 0


async def get_conversation_history(conversation_id: str, limit: int = 6) -> List[Dict[str, str]]:
    """
    Retrieves the last N messages for context-aware multi-turn conversational chat.
    """
    async with aiosqlite.connect(str(DB_PATH)) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("""
            SELECT role, content FROM messages
            WHERE conversation_id = ?
            ORDER BY id DESC
            LIMIT ?
        """, (conversation_id, limit)) as cursor:
            rows = await cursor.fetchall()
            # Reverse so messages are in chronological order
            history = [{"role": row["role"], "content": row["content"]} for row in reversed(rows)]
            return history


async def save_feedback(
    rating: int,
    message_id: Optional[int] = None,
    conversation_id: Optional[str] = None,
    comment: Optional[str] = None
) -> int:
    """Saves thumbs up (1) or thumbs down (-1) feedback with optional user comment."""
    now = time.time()
    async with aiosqlite.connect(str(DB_PATH)) as db:
        cursor = await db.execute("""
            INSERT INTO feedback (message_id, conversation_id, rating, comment, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (message_id, conversation_id, rating, comment, now))
        await db.commit()
        return cursor.lastrowid or 0


async def get_feedback_stats() -> Dict[str, Any]:
    """Computes total queries, thumbs up, thumbs down, and average latency."""
    async with aiosqlite.connect(str(DB_PATH)) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT COUNT(*) as total_msgs, AVG(latency_sec) as avg_latency FROM messages WHERE role='assistant'") as cur:
            row = await cur.fetchone()
            total_queries = row["total_msgs"] if row else 0
            avg_latency = round(row["avg_latency"] or 0.0, 2) if row else 0.0

        async with db.execute("SELECT SUM(CASE WHEN rating > 0 THEN 1 ELSE 0 END) as thumbs_up, SUM(CASE WHEN rating < 0 THEN 1 ELSE 0 END) as thumbs_down FROM feedback") as cur:
            fb = await cur.fetchone()
            up = fb["thumbs_up"] or 0 if fb else 0
            down = fb["thumbs_down"] or 0 if fb else 0

        return {
            "total_queries": total_queries,
            "avg_latency_sec": avg_latency,
            "thumbs_up": up,
            "thumbs_down": down,
            "positive_ratio": round((up / max(1, up + down)) * 100, 1)
        }
