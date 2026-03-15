"""
Minimal Pydantic models for complex endpoints only
"""
from pydantic import BaseModel
from typing import List, Optional

class ProgressUpdate(BaseModel):
    user_id: str
    lesson_id: Optional[str] = None
    quiz_score: Optional[float] = None
    time_spent: Optional[int] = None  # in minutes
    completed_lessons: Optional[List[str]] = None
