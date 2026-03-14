"""app/api/routes/proxy.py — Optional server-side LLM proxy for orgs that don't want BYOK client-side"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
from app.core.config import settings

router = APIRouter()


class ProxyRequest(BaseModel):
    model: str = "claude-sonnet-4-20250514"
    messages: list[dict]
    max_tokens: int = 1024
    temperature: float = 0.7
    system: Optional[str] = None


@router.post("/anthropic")
async def proxy_anthropic(req: ProxyRequest):
    """Server-side Anthropic proxy — uses server API key, not client BYOK."""
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="Server-side Anthropic not configured")

    async with httpx.AsyncClient() as client:
        payload: dict = {
            "model": req.model,
            "max_tokens": req.max_tokens,
            "temperature": req.temperature,
            "messages": [m for m in req.messages if m.get("role") != "system"],
        }
        if req.system:
            payload["system"] = req.system

        res = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
            },
            json=payload,
            timeout=60,
        )
        if not res.is_success:
            raise HTTPException(status_code=res.status_code, detail=res.text)
        return res.json()
