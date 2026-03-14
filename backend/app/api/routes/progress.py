"""app/api/routes/progress.py — User progress sync"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.db.supabase import get_supabase

router = APIRouter()


class ProgressUpdate(BaseModel):
    concept_id: str
    completed: bool = False
    xp_earned: int = 0


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    level: Optional[int] = None
    xp: Optional[int] = None
    streak: Optional[int] = None
    selected_track: Optional[str] = None
    difficulty: Optional[str] = None
    theme: Optional[str] = None
    forge_score: Optional[int] = None
    lab_score: Optional[int] = None


@router.get("/{user_id}")
async def get_progress(user_id: str):
    db = get_supabase()
    result = db.table("profiles").select("*").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data


@router.patch("/{user_id}")
async def update_profile(user_id: str, update: ProfileUpdate):
    db = get_supabase()
    data = {k: v for k, v in update.model_dump().items() if v is not None}
    result = db.table("profiles").update(data).eq("id", user_id).execute()
    return result.data


@router.post("/{user_id}/concept")
async def mark_concept(user_id: str, update: ProgressUpdate):
    db = get_supabase()
    result = db.table("concept_progress").upsert({
        "user_id": user_id,
        "concept_id": update.concept_id,
        "completed": update.completed,
        "xp_earned": update.xp_earned,
    }).execute()
    return result.data


@router.get("/{user_id}/due-cards")
async def get_due_cards(user_id: str):
    """Return flash cards due for review (SM-2)"""
    import datetime
    db = get_supabase()
    now = datetime.datetime.utcnow().isoformat()
    result = (
        db.table("flash_cards")
        .select("*")
        .eq("user_id", user_id)
        .lte("next_review", now)
        .order("next_review")
        .limit(20)
        .execute()
    )
    return result.data


@router.post("/{user_id}/cards")
async def save_cards(user_id: str, cards: list[dict]):
    db = get_supabase()
    for card in cards:
        card["user_id"] = user_id
    result = db.table("flash_cards").upsert(cards).execute()
    return result.data
