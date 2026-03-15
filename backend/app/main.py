"""
INTOIT Learning — FastAPI Backend
Python 3.12 + FastAPI + Supabase + Anthropic
"""
from contextlib import asynccontextmanager
import os
import asyncio
import base64
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.routes import auth, progress, search, proxy, voice
from app.utils.audio_utils import validate_audio_format, convert_to_pcm16, get_audio_metadata
from app.models.progress import ProgressUpdate
from app.models.requests import QuizRequest, FlashcardsRequest, ExplainRequest
from google import genai


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

    print(response.text)
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

    print(response.text)
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


@app.websocket("/api/live-chat")
async def live_chat(websocket: WebSocket):
    await websocket.accept()
    
    # Gemini Live API configuration
    MODEL = "models/gemini-2.5-flash-native-audio-preview-12-2025"
    
    CONFIG = types.LiveConnectConfig(
        response_modalities=["AUDIO"],
        media_resolution="MEDIA_RESOLUTION_MEDIUM",
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Algieba")
            )
        ),
    )
    
    client = genai.Client(
        http_options={"api_version": "v1beta"},
        api_key=os.environ.get("GEMINI_API_KEY"),
    )
    
    try:
        async with client.aio.live.connect(model=MODEL, config=CONFIG) as session:
            print("Connected to Gemini Live API")
            
            # Handle bidirectional communication
            receive_task = asyncio.create_task(receive_from_gemini(session, websocket))
            send_task = asyncio.create_task(send_to_gemini(session, websocket))
            
            # Wait for either task to complete (connection closed)
            done, pending = await asyncio.wait(
                [receive_task, send_task], 
                return_when=asyncio.FIRST_COMPLETED
            )
            
            # Cancel pending tasks
            for task in pending:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
                    
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"Error in live chat: {e}")
        await websocket.close()

async def receive_from_gemini(session, websocket):
    """Receive audio responses from Gemini and send to client"""
    try:
        turn = session.receive()
        async for response in turn:
            if data := response.data:
                # Send audio data back to client
                await websocket.send_bytes(data)
            if text := response.text:
                # Send text response to client
                await websocket.send_text(json.dumps({"type": "text", "content": text}))
    except Exception as e:
        print(f"Error receiving from Gemini: {e}")

async def send_to_gemini(session, websocket):
    """Receive audio from client and send to Gemini"""
    try:
        while True:
            # Receive audio data from client
            data = await websocket.receive_bytes()
            
            # Validate audio format
            is_valid, error_msg = validate_audio_format(data)
            if not is_valid:
                print(f"Invalid audio format: {error_msg}")
                await websocket.send_text(json.dumps({
                    "type": "error", 
                    "message": f"Invalid audio format: {error_msg}"
                }))
                continue
            
            # Convert to PCM16 if needed
            pcm_data = convert_to_pcm16(data)
            
            # Log audio metadata for debugging
            metadata = get_audio_metadata(pcm_data)
            print(f"Received audio: {metadata}")
            
            # Send audio to Gemini in the correct format
            await session.send(input={"data": pcm_data, "mime_type": "audio/pcm"})
            
    except WebSocketDisconnect:
        print("Client disconnected from send task")
        # Signal end of turn to Gemini
        await session.send(input=".", end_of_turn=True)
    except Exception as e:
        print(f"Error sending to Gemini: {e}")
