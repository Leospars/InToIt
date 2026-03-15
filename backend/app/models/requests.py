"""app/models/requests.py — Request models for API endpoints"""
from pydantic import BaseModel
from typing import Optional, List


class QuizRequest(BaseModel):
    topic: str
    difficulty: Optional[str] = "medium"
    num_questions: Optional[int] = 5


class FlashcardsRequest(BaseModel):
    topic: str
    num_cards: Optional[int] = 10


class ExplainRequest(BaseModel):
    topic: str
    difficulty: Optional[str] = "simple"

