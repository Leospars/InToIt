"""
INTOIT Learning — FastAPI Backend
Python 3.12 + FastAPI + Supabase + Anthropic
"""
from contextlib import asynccontextmanager
import os
import asyncio
import base64
import json
import websockets
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


@app.websocket("/api/live-chat")
async def live_chat(websocket: WebSocket):
    await websocket.accept()
    
    # Gemini Live API WebSocket configuration
    MODEL_NAME = "gemini-2.5-flash-native-audio-preview-12-2025"
    API_KEY = settings.gemini_api_key
    WS_URL = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key={API_KEY}"
    
    try:
        # Connect to Gemini Live API WebSocket
        async with websockets.connect(WS_URL) as gemini_ws:
            print("Connected to Gemini Live API")
            
            # Send initial configuration
            config_message = {
                "config": {
                    "model": f"models/{MODEL_NAME}",
                    "responseModalities": ["AUDIO"],
                    "systemInstruction": {
                        "parts": [{"text": "You are a helpful AI tutor. Be clear, concise, and encouraging."}]
                    },
                    "speechConfig": {
                        "voiceConfig": {
                            "prebuiltVoiceConfig": {
                                "voiceName": "Algieba"
                            }
                        }
                    }
                }
            }
            await gemini_ws.send(json.dumps(config_message))
            print("Configuration sent to Gemini")
            
            # Handle bidirectional communication
            receive_task = asyncio.create_task(receive_from_gemini(gemini_ws, websocket))
            send_task = asyncio.create_task(send_to_gemini(gemini_ws, websocket))
            
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
        print("Client WebSocket disconnected")
    except Exception as e:
        print(f"Error in live chat: {e}")
        await websocket.close()

async def receive_from_gemini(gemini_ws: websockets.WebSocketServerProtocol, websocket: WebSocket):
    """Receive responses from Gemini and send to client"""
    try:
        async for message in gemini_ws:
            response = json.loads(message)
            print("Received from Gemini:", response)
            
            # Handle server content
            if "serverContent" in response:
                server_content = response["serverContent"]
                
                # Receiving Audio
                if "modelTurn" in server_content and "parts" in server_content["modelTurn"]:
                    for part in server_content["modelTurn"]["parts"]:
                        if "inlineData" in part:
                            audio_data_b64 = part["inlineData"]["data"]
                            # Decode base64 audio and send to client
                            audio_data = base64.b64decode(audio_data_b64)
                            await websocket.send_bytes(audio_data)
                            print(f"Sent audio data to client (len: {len(audio_data)})")
                
                # Receiving Text Transcriptions
                if "inputTranscription" in server_content:
                    transcription_text = server_content['inputTranscription']['text']
                    await websocket.send_text(json.dumps({
                        "type": "transcription", 
                        "content": transcription_text,
                        "speaker": "user"
                    }))
                    print(f"User transcription: {transcription_text}")
                    
                if "outputTranscription" in server_content:
                    transcription_text = server_content['outputTranscription']['text']
                    await websocket.send_text(json.dumps({
                        "type": "transcription", 
                        "content": transcription_text,
                        "speaker": "gemini"
                    }))
                    print(f"Gemini transcription: {transcription_text}")
            
            # Handle tool calls
            if "toolCall" in response:
                await handle_tool_call(gemini_ws, response["toolCall"])
                
    except Exception as e:
        print(f"Error receiving from Gemini: {e}")

async def send_to_gemini(gemini_ws: websockets.WebSocketServerProtocol, websocket: WebSocket):
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
            
            # Encode audio as base64 and send to Gemini
            encoded_data = base64.b64encode(pcm_data).decode('utf-8')
            audio_message = {
                "realtimeInput": {
                    "audio": {
                        "data": encoded_data,
                        "mimeType": "audio/pcm;rate=16000"
                    }
                }
            }
            await gemini_ws.send(json.dumps(audio_message))
            
    except WebSocketDisconnect:
        print("Client disconnected from send task")
        # Signal end of turn to Gemini
        await gemini_ws.send(json.dumps({"realtimeInput": {"text": "."}}))
    except Exception as e:
        print(f"Error sending to Gemini: {e}")

async def handle_tool_call(gemini_ws: websockets.WebSocketServerProtocol, tool_call):
    """Handle tool calls from Gemini"""
    function_responses = []
    
    for fc in tool_call.get("functionCalls", []):
        # Execute the function locally (placeholder implementation)
        try:
            # Placeholder for actual tool execution
            result = {"status": "success", "data": "Tool executed"}
            response_data = {"result": result}
        except Exception as e:
            print(f"Error executing tool {fc.get('name', 'unknown')}: {e}")
            response_data = {"error": str(e)}
        
        # Prepare the response
        function_responses.append({
            "name": fc.get("name", "unknown"),
            "id": fc.get("id", "unknown"),
            "response": response_data
        })
    
    # Send the tool response back to Gemini
    tool_response_message = {
        "toolResponse": {
            "functionResponses": function_responses
        }
    }
    await gemini_ws.send(json.dumps(tool_response_message))
    print("Sent tool response to Gemini")
