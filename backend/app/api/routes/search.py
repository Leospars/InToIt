"""app/api/routes/search.py — 13 search provider proxy"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx

router = APIRouter()


class SearchRequest(BaseModel):
    query: str
    provider: str = "tavily"
    api_key: Optional[str] = None
    endpoint: Optional[str] = None
    max_results: int = 5
    language: str = "en"


@router.post("/")
async def search(req: SearchRequest):
    handlers = {
        "tavily":   search_tavily,
        "exa":      search_exa,
        "brave":    search_brave,
        "you":      search_you,
        "serpapi":  search_serpapi,
        "searxng":  search_searxng,
    }
    handler = handlers.get(req.provider)
    if not handler:
        raise HTTPException(status_code=400, detail=f"Provider '{req.provider}' not supported server-side. Use client-side mode.")
    return await handler(req)


async def search_tavily(req: SearchRequest) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://api.tavily.com/search",
            json={"api_key": req.api_key, "query": req.query, "max_results": req.max_results},
            timeout=15,
        )
        data = res.json()
        return {
            "results": [
                {"title": r.get("title"), "url": r.get("url"), "snippet": r.get("content", "")[:300]}
                for r in data.get("results", [])
            ]
        }


async def search_exa(req: SearchRequest) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://api.exa.ai/search",
            headers={"x-api-key": req.api_key or ""},
            json={"query": req.query, "numResults": req.max_results, "contents": {"text": True}},
            timeout=15,
        )
        data = res.json()
        return {
            "results": [
                {"title": r.get("title"), "url": r.get("url"), "snippet": (r.get("text") or "")[:300]}
                for r in data.get("results", [])
            ]
        }


async def search_brave(req: SearchRequest) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://api.search.brave.com/res/v1/web/search",
            headers={"Accept": "application/json", "X-Subscription-Token": req.api_key or ""},
            params={"q": req.query, "count": req.max_results},
            timeout=15,
        )
        data = res.json()
        return {
            "results": [
                {"title": r.get("title"), "url": r.get("url"), "snippet": r.get("description", "")[:300]}
                for r in data.get("web", {}).get("results", [])
            ]
        }


async def search_you(req: SearchRequest) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://api.ydc-index.io/search",
            headers={"X-API-Key": req.api_key or ""},
            params={"query": req.query},
            timeout=15,
        )
        data = res.json()
        return {
            "results": [
                {"title": r.get("title"), "url": r.get("url"), "snippet": " ".join(r.get("snippets", []))[:300]}
                for r in data.get("hits", [])[:req.max_results]
            ]
        }


async def search_serpapi(req: SearchRequest) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://serpapi.com/search",
            params={"q": req.query, "api_key": req.api_key, "num": req.max_results},
            timeout=15,
        )
        data = res.json()
        return {
            "results": [
                {"title": r.get("title"), "url": r.get("link"), "snippet": r.get("snippet", "")[:300]}
                for r in data.get("organic_results", [])
            ]
        }


async def search_searxng(req: SearchRequest) -> dict:
    endpoint = req.endpoint or "http://localhost:8888"
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{endpoint}/search",
            params={"q": req.query, "format": "json", "language": req.language},
            timeout=15,
        )
        data = res.json()
        return {
            "results": [
                {"title": r.get("title"), "url": r.get("url"), "snippet": r.get("content", "")[:300]}
                for r in data.get("results", [])[:req.max_results]
            ]
        }
