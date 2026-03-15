"""
backend/app/api/routes/videos.py

Two jobs:
  1. User searches YouTube by keyword  →  GET  /api/videos/search?q=...
  2. AI prompt fetches YouTube videos  →  POST /api/videos/ai-search
"""

import httpx
import google.generativeai as genai
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter(prefix="/api/videos", tags=["videos"])

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"

# Init Gemini only if key exists
gemini_model = None
if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)
    gemini_model = genai.GenerativeModel("gemini-1.5-flash")


async def youtube_search(query: str, max_results: int = 10) -> list[dict]:
    """Core YouTube search — returns clean list of video dicts."""
    if not settings.youtube_api_key:
        raise HTTPException(status_code=500, detail="YouTube API key not configured.")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            YOUTUBE_SEARCH_URL,
            params={
                "part": "snippet",
                "q": query,
                "type": "video",
                "maxResults": max_results,
                "key": settings.youtube_api_key,
            },
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"YouTube API error: {resp.text[:200]}")

    videos = []
    for item in resp.json().get("items", []):
        video_id = item.get("id", {}).get("videoId")
        if not video_id:
            continue
        snippet = item.get("snippet", {})
        videos.append({
            "id": video_id,
            "title": snippet.get("title", ""),
            "channel": snippet.get("channelTitle", ""),
            "thumbnail": snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
            "embed_url": f"https://www.youtube.com/embed/{video_id}",
            "watch_url": f"https://www.youtube.com/watch?v={video_id}",
        })
    return videos


# ── 1. User keyword search ────────────────────────────────────

@router.get("/search")
async def search_videos(
    q: str = Query(..., description="Search term"),
    max_results: int = Query(10, ge=1, le=25),
):
    videos = await youtube_search(q, max_results)
    if not videos:
        raise HTTPException(status_code=404, detail="No videos found.")
    return {"videos": videos, "query": q}


# ── 2. AI prompt → YouTube search ────────────────────────────

class AiSearchRequest(BaseModel):
    prompt: str
    max_results: int = 10


@router.post("/ai-search")
async def ai_search_videos(body: AiSearchRequest):
    """
    Takes a natural-language prompt, uses Gemini to produce
    the best YouTube search query, then returns the results.
    """
    if not gemini_model:
        raise HTTPException(status_code=500, detail="Gemini API key not configured.")

    try:
        result = gemini_model.generate_content(
            f'Convert this into one specific YouTube search query. '
            f'Return only the query string, no quotes, no explanation.\n\n{body.prompt}'
        )
        search_query = result.text.strip().strip('"').strip("'")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini error: {str(e)}")

    videos = await youtube_search(search_query, body.max_results)
    if not videos:
        raise HTTPException(status_code=404, detail="No videos found.")

    return {
        "videos": videos,
        "prompt": body.prompt,
        "search_query": search_query,
    }


# ── 3. AI-enhanced shorts search ──────────────────────────────

@router.get("/shorts/search")
async def search_shorts(
    q: str = Query(..., description="Search term for shorts"),
    max_results: int = Query(10, ge=1, le=25),
):
    """
    Search YouTube Shorts with Gemini AI processing.
    Uses Gemini to enhance the search query for better shorts results.
    """
    if not gemini_model:
        raise HTTPException(status_code=500, detail="Gemini API key not configured.")

    try:
        # Use Gemini to enhance the search query for shorts
        gemini_prompt = f"""The user wants to find YouTube Shorts about: "{q}"

Generate 2-3 specific YouTube Shorts search queries. Focus on:
- Short-form content (TikTok-style, under 60 seconds)
- Educational or entertaining shorts
- Relevant to the topic

Return ONLY the queries as a JSON array, no other text:
["query1", "query2", "query3"]"""
        
        response = gemini_model.generate_content(gemini_prompt)
        response_text = response.text.strip()
        
        try:
            import json
            search_queries = json.loads(response_text)
        except (json.JSONDecodeError, ValueError):
            search_queries = [f"{q} shorts"]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini error: {str(e)}")

    # Search for shorts using all queries
    all_shorts = []
    videos_per_query = max(1, max_results // len(search_queries))

    async with httpx.AsyncClient() as client:
        for query in search_queries:
            resp = await client.get(
                YOUTUBE_SEARCH_URL,
                params={
                    "part": "snippet",
                    "q": query,
                    "type": "video",
                    "videoDuration": "short",  # Videos under 4 minutes
                    "maxResults": videos_per_query * 2,
                    "key": settings.youtube_api_key,
                    "order": "relevance",
                },
            )

            if resp.status_code != 200:
                continue

            for item in resp.json().get("items", []):
                video_id = item.get("id", {}).get("videoId")
                if not video_id:
                    continue
                snippet = item.get("snippet", {})
                all_shorts.append({
                    "id": video_id,
                    "title": snippet.get("title", ""),
                    "channel": snippet.get("channelTitle", ""),
                    "thumbnail": snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
                    "embed_url": f"https://www.youtube.com/embed/{video_id}",
                })

            if len(all_shorts) >= max_results:
                break

    if not all_shorts:
        raise HTTPException(status_code=404, detail="No shorts found.")

    return {
        "shorts": all_shorts[:max_results],
        "ai_queries": search_queries,
        "search_term": q,
        "total_found": len(all_shorts),
    }