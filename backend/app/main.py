"""
INTOIT Learning — FastAPI Backend
Python 3.12 + FastAPI + Supabase + Anthropic
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.routes import auth, progress, search, proxy, voice, live_chat
from app.utils.audio_utils import validate_audio_format, convert_to_pcm16, get_audio_metadata
from app.models.progress import ProgressUpdate
from app.models.requests import QuizRequest, FlashcardsRequest, ExplainRequest
from google import genai
from app.core.gemini_live import GeminiLive

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
app.include_router(auth.router,         prefix="/api/auth",         tags=["auth"])
app.include_router(progress.router,     prefix="/api/progress",     tags=["progress"])
app.include_router(search.router,       prefix="/api/search",       tags=["search"])
app.include_router(proxy.router,        prefix="/api/proxy",        tags=["proxy"])
app.include_router(voice.router,        prefix="/api/voice",        tags=["voice"])
app.include_router(live_chat.router,    prefix="/api/live-chat",    tags=["live-chat"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(status_code=500, content={"detail": str(exc)})

@app.post("/api/generate/quiz")
async def generate_quiz(request: QuizRequest):
    # Prompt gemini
    client = genai.Client(api_key=settings.gemini_api_key)
    
    quiz_format = """
    {
        "quiz": [
            {
                "question": "What is the capital of France?",
                "options": [
                    "London",
                    "Berlin",
                    "Paris",
                    "Madrid"
                ],
                "correct_answer": "Paris"
            }
        ]
    }
    """

    prompt = f"Generate a {request.difficulty} difficulty quiz about {request.topic} with {request.num_questions} questions. Follow this JSON format: {quiz_format}"
    
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
        config={"response_mime_type": "application/json"}
    )

    return response.text

@app.post("/api/generate/flashcards")
async def generate_flashcards(request: FlashcardsRequest):
    # Prompt gemini
    client = genai.Client(api_key=settings.gemini_api_key)

    flashcards_format = """
    {
        "flashcards": [
            {
                "front": "What is the capital of France?",
                "back": "Paris"
            }
        ]
    }
    """

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=f"Generate {request.num_cards} flashcards about {request.topic}. Format as JSON: {flashcards_format}",
        config={"response_mime_type": "application/json"},
    )

    return response.text


@app.post("/api/explain")
async def explain(request: ExplainRequest):
    # Create chat session, prompt follow up questions to ensure understanding 
    # and be kind clear and break into simple steps using analogies the user may be familiar with.
    client = genai.Client(api_key=settings.gemini_api_key)

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=f"Explain {request.topic} in a {request.difficulty} way. Use clear steps and analogies.",
    )

    print(response.text)
    return response.text


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