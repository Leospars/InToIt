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
from app.api.routes import auth, progress, search, proxy, voice, live_chat, files
from app.models.progress import ProgressUpdate
from app.models.requests import QuizRequest, FlashcardsRequest, ExplainRequest
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
app.include_router(live_chat.router, prefix="/api", tags=["live-chat"])
app.include_router(files.router, prefix="/api/files", tags=["files"])

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(status_code=500, content={"detail": str(exc)})

def build_user_context(user_id: Optional[str] = None) -> str:
    """Build user learning profile context for Gemini prompts.
    
    Returns a formatted context block with:
    - Skill mastery levels (BKT p_know values)
    - Common misconceptions from recent wrong answers
    - Recommended next topics
    """
    if not user_id:
        return ""
    
    # TODO: Implement actual BKT state retrieval
    # Placeholder structure for now
    context = """
[USER LEARNING PROFILE]
────────────────────────────────────────────────────────────

Skill Mastery (Bayesian estimate):
  ✅ Mastered  (p ≥ 0.85):
      - Binary Math         (p=0.91, 18 attempts)
      - Logic Gates         (p=0.88, 12 attempts)
      - Pointers            (p=0.87, 22 attempts)

  📘 Learning  (0.50 ≤ p < 0.85):
      - Memory Allocation   (p=0.72, 14 attempts)
      - CPU Architecture    (p=0.61,  9 attempts)
      - Linked Lists        (p=0.51,  7 attempts)  ← active topic

  ⚠️  Struggling (p < 0.50):
      - Recurrence Rel.     (p=0.31,  5 attempts)
      - Trees & Graphs      (p=0.22,  3 attempts)

  ○  Not yet started:
      - Dynamic Programming, Sorting Algorithms, OS Scheduling

────────────────────────────────────────────────────────────

Common Misconceptions (from recent wrong answers):
  - Linked Lists:   "Confuses pointer assignment with memory deallocation; treats *ptr=NULL as equivalent to free(ptr)."
  - Recurrence Rel: "Incorrectly solves T(n)=2T(n/2)+n as O(n²) instead of applying Master Theorem."

────────────────────────────────────────────────────────────

Recommended Next Topics (prerequisites met, not yet mastered):
  1. Linked Lists (currently learning — reinforce)
  2. Trees & Graphs (prereqs: Pointers ✅, Memory Alloc ✅)
  3. Recurrence Relations (prereqs: Binary Math ✅)

────────────────────────────────────────────────────────────

Related Topic Clusters (knowledge graph context):
  - Pointers → Linked Lists → Trees → Graphs → Dynamic Programming
  - Binary Math → Recurrence Relations → Dynamic Programming
  - Logic Gates → CPU Architecture → OS Scheduling

[/USER LEARNING PROFILE]
"""
    return context.strip()


@app.post("/api/generate/quiz")
async def generate_quiz(request: QuizRequest, user_id: Optional[str] = Query(None)):
    # Prompt gemini with user context
    client = genai.Client(api_key=settings.gemini_api_key)
    
    quiz_format = """
    {
        "quiz": [
            {
                "question": "",
                "options": [..., ...],
                "correct_answer": ""
            }
        ]
    }
    """

    user_context = build_user_context(user_id)
    
    if user_id:
        prompt = f"""{user_context}

Now generate a {request.difficulty} quiz on "{request.topic}" with {request.num_questions} questions.

Instructions:
- Target questions toward the student's STRUGGLING sub-areas listed above.
- Avoid questions already well-covered by mastered topics (don't re-test what they know).
- One question should specifically probe the listed common misconception for this topic.
- Vary question types: 1 recall, 2 application, 1 analysis, 1 misconception trap.

Format: {quiz_format}"""
    else:
        prompt = f"Generate a {request.difficulty} difficulty quiz about {request.topic} with {request.num_questions} questions. Follow this JSON format: {quiz_format}"
    
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
        config={"response_mime_type": "application/json"}
    )

    return response.text

@app.post("/api/generate/flashcards")
async def generate_flashcards(request: FlashcardsRequest, user_id: Optional[str] = Query(None)):
    # Prompt gemini with user context
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

    user_context = build_user_context(user_id)
    
    if user_id:
        prompt = f"""{user_context}

Now generate {request.num_cards} flashcards about "{request.topic}".

Instructions:
- Focus on concepts the student is currently learning or struggling with.
- Include cards that address their common misconceptions.
- Use analogies from topics they have already mastered.
- Avoid concepts they have already mastered unless for reinforcement.

Format as JSON: {flashcards_format}"""
    else:
        prompt = f"Generate {request.num_cards} flashcards about {request.topic}. Format as JSON: {flashcards_format}"
    
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
        config={"response_mime_type": "application/json"},
    )

    return response.text


@app.post("/api/explain")
async def explain(request: ExplainRequest, user_id: Optional[str] = Query(None)):
    # Create chat session, prompt follow up questions to ensure understanding 
    # and be kind clear and break into simple steps using analogies the user may be familiar with.
    client = genai.Client(api_key=settings.gemini_api_key)

    user_context = build_user_context(user_id)
    
    if user_id:
        prompt = f"""{user_context}

Explain "{request.topic}" to this student.

Instructions:
- They have already mastered: [mastered list]. Build on these — use them as analogies.
- They are currently learning: [learning list]. Connect to those if relevant.
- Address this specific misconception directly: "{{common_mistake for topic}}".
- Go slower on: {{struggling topics}}. Use concrete examples and visual metaphors.
- Do NOT over-explain concepts they have already mastered.
- End with a 2-question comprehension check targeting their weak area.
- Explain in a {request.difficulty} way. Use clear steps and analogies."""
    else:
        prompt = f"Explain {request.topic} in a {request.difficulty} way. Use clear steps and analogies."
    
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
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
