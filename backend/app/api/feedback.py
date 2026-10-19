"""
backend/app/api/feedback.py

Feedback and analytics endpoints:
Collects user thumbs up / thumbs down ratings on assistant answers,
powering the Admin Dashboard and continuous evaluation dataset.
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.database import save_feedback, get_feedback_stats

router = APIRouter(prefix="/feedback", tags=["Feedback & Monitoring"])


class FeedbackRequest(BaseModel):
    rating: int = Field(..., description="1 for thumbs up, -1 for thumbs down")
    message_id: Optional[int] = Field(default=None, description="ID of the assistant message being rated")
    conversation_id: Optional[str] = Field(default=None, description="Conversation session ID")
    comment: Optional[str] = Field(default=None, max_length=500, description="Optional user comment")


class FeedbackResponse(BaseModel):
    status: str
    feedback_id: int
    message: str


@router.post("", response_model=FeedbackResponse)
async def submit_feedback(data: FeedbackRequest):
    """
    Submits user feedback (thumbs up or down) for an AI response.
    """
    feedback_id = await save_feedback(
        rating=data.rating,
        message_id=data.message_id,
        conversation_id=data.conversation_id,
        comment=data.comment
    )
    return FeedbackResponse(
        status="success",
        feedback_id=feedback_id,
        message="Thank you for your feedback! It helps improve Citizen AI."
    )


@router.get("/stats")
async def fetch_feedback_stats():
    """
    Fetches real-time system performance and satisfaction stats for the Admin Dashboard.
    """
    stats = await get_feedback_stats()
    return stats
