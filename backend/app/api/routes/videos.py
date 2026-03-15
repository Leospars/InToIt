"""
YouTube videos API endpoint
Fetches videos from YouTube Data API
Integrates with Google Gemini AI for intelligent recommendations
"""
import httpx
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
from app.core.config import settings

router = APIRouter()

YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3"

# Initialize Gemini if API key is available
if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)
    gemini_model = genai.GenerativeModel("gemini-1.5-flash")
else:
    gemini_model = None

class RecommendRequest(BaseModel):
    prompt: str
    max_results: int = 4

@router.post("/recommend")
async def recommend_videos(req: RecommendRequest):
    """
    Use Google Gemini AI to generate video recommendations from a user prompt.
    AI generates search queries based on the user's intent.
    """
    if not gemini_model:
        raise HTTPException(
            status_code=400,
            detail="Google Gemini API key not configured"
        )
    
    if not settings.youtube_api_key:
        raise HTTPException(
            status_code=400,
            detail="YouTube API key not configured"
        )
    
    try:
        # Use Gemini to generate video search queries based on user prompt
        prompt_text = f"""Based on this user request, generate 2-3 YouTube search queries to find relevant videos.
                    
User request: "{req.prompt}"

Return ONLY a JSON array of search query strings, like:
["query1", "query2", "query3"]

Make the queries specific and relevant to what the user is asking for."""
        
        response = gemini_model.generate_content(prompt_text)
        response_text = response.text
        
        try:
            search_queries = json.loads(response_text)
        except json.JSONDecodeError:
            # Fallback: use the original prompt as search query
            search_queries = [req.prompt]
        
        # Fetch videos for each search query
        all_videos = []
        videos_per_query = max(1, req.max_results // len(search_queries))
        
        async with httpx.AsyncClient() as client:
            for query in search_queries:
                params = {
                    "part": "snippet",
                    "q": query,
                    "type": "video",
                    "maxResults": videos_per_query,
                    "key": settings.youtube_api_key,
                    "order": "relevance",
                }
                response = await client.get(f"{YOUTUBE_API_URL}/search", params=params)
                response.raise_for_status()
                
                data = response.json()
                for item in data.get("items", []):
                    video_id = item.get("id", {}).get("videoId")
                    if video_id:
                        all_videos.append({
                            "id": video_id,
                            "title": item.get("snippet", {}).get("title"),
                            "description": item.get("snippet", {}).get("description"),
                            "thumbnail": item.get("snippet", {}).get("thumbnails", {}).get("medium", {}).get("url"),
                            "embed_url": f"https://www.youtube.com/embed/{video_id}",
                        })
                
                if len(all_videos) >= req.max_results:
                    break
        
        return {
            "videos": all_videos[:req.max_results],
            "ai_queries": search_queries,
            "prompt": req.prompt
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/search")
async def search_videos(query: str, max_results: int = 4):
    """Search YouTube for videos matching a query"""
    if not settings.youtube_api_key:
        raise HTTPException(
            status_code=400,
            detail="YouTube API key not configured"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            params = {
                "part": "snippet",
                "q": query,
                "type": "video",
                "maxResults": max_results,
                "key": settings.youtube_api_key,
                "order": "relevance",
            }
            response = await client.get(f"{YOUTUBE_API_URL}/search", params=params)
            response.raise_for_status()
            
            data = response.json()
            videos = []
            
            for item in data.get("items", []):
                video_id = item.get("id", {}).get("videoId")
                if video_id:
                    videos.append({
                        "id": video_id,
                        "title": item.get("snippet", {}).get("title"),
                        "description": item.get("snippet", {}).get("description"),
                        "thumbnail": item.get("snippet", {}).get("thumbnails", {}).get("medium", {}).get("url"),
                        "embed_url": f"https://www.youtube.com/embed/{video_id}",
                    })
            
            return {"videos": videos}
    
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"YouTube API error: {str(e)}")

@router.get("/videos/channel")
async def get_channel_videos(channel_id: str, max_results: int = 4):
    """Get latest videos from a YouTube channel"""
    if not settings.youtube_api_key:
        raise HTTPException(
            status_code=400,
            detail="YouTube API key not configured"
        )
    
    try:
        async with httpx.AsyncClient() as client:
            # First, get the uploads playlist ID
            params = {
                "part": "contentDetails",
                "id": channel_id,
                "key": settings.youtube_api_key,
            }
            response = await client.get(f"{YOUTUBE_API_URL}/channels", params=params)
            response.raise_for_status()
            
            data = response.json()
            uploads_playlist_id = data.get("items", [{}])[0].get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")
            
            if not uploads_playlist_id:
                raise HTTPException(status_code=400, detail="Channel not found")
            
            # Now get videos from the uploads playlist
            params = {
                "part": "snippet",
                "playlistId": uploads_playlist_id,
                "maxResults": max_results,
                "key": settings.youtube_api_key,
            }
            response = await client.get(f"{YOUTUBE_API_URL}/playlistItems", params=params)
            response.raise_for_status()
            
            data = response.json()
            videos = []
            
            for item in data.get("items", []):
                video_id = item.get("snippet", {}).get("resourceId", {}).get("videoId")
                if video_id:
                    videos.append({
                        "id": video_id,
                        "title": item.get("snippet", {}).get("title"),
                        "description": item.get("snippet", {}).get("description"),
                        "thumbnail": item.get("snippet", {}).get("thumbnails", {}).get("medium", {}).get("url"),
                        "embed_url": f"https://www.youtube.com/embed/{video_id}",
                    })
            
            return {"videos": videos}
    
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"YouTube API error: {str(e)}")
