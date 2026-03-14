"""app/api/routes/auth.py — Auth helpers (Supabase JWT verification)"""
from fastapi import APIRouter, HTTPException, Header
from app.db.supabase import get_supabase
from typing import Optional

router = APIRouter()


@router.get("/me")
async def get_me(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ")[1]
    db = get_supabase()
    user = db.auth.get_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"id": user.user.id, "email": user.user.email}
