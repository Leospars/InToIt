"""
INTOIT Learning — FastAPI Backend
Python 3.12 + FastAPI + Supabase + Anthropic
"""
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.routes import auth, progress, search, proxy, voice, live_chat, files, ai, knowledge
from app.models.progress import ProgressUpdate
from google import genai
from app.core.gemini_live import GeminiLive
from app.db.supabase import get_supabase

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"INTOIT backend starting — env: {settings.environment}")
    yield
    # Shutdown
    print("INTOIT backend shutting down")


app = FastAPI(
    title="INTOIT Learning API",
    description="AI Agent Intelligence Platform backend",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────
app.include_router(auth.router,     prefix="/api/auth",     tags=["auth"])
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])
app.include_router(search.router,   prefix="/api/search",   tags=["search"])
app.include_router(proxy.router,    prefix="/api/proxy",    tags=["proxy"])
app.include_router(voice.router,    prefix="/api/voice",    tags=["voice"])
app.include_router(live_chat.router, prefix="/api/live-chat", tags=["live-chat"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(ai.router, prefix="/api", tags=["ai"])
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["knowledge"])

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(status_code=500, content={"detail": str(exc)})


@app.patch("api/progress")
async def progress(progress_data: ProgressUpdate):
    # Store/ Update user progress
    user_id = progress_data.user_id
    lesson_id = progress_data.lesson_id
    quiz_score = progress_data.quiz_score
    time_spent = progress_data.time_spent
    completed_lessons = progress_data.completed_lessons
    
    pass


@app.get("api/progress")
async def get_progress():
    # Retrieve user progress
    
    pass
