import asyncio
import base64
import json
import os

from fastapi import APIRouter
from fastapi import WebSocket, WebSocketDisconnect
from app.core.gemini_live import GeminiLive
from app.api.routes import knowledge
from app.db.supabase import get_supabase

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for Gemini Live."""

    # ── Token Extraction ───────────────────────────────────────
    # Client sends token in subprotocol format: "token.{ACCESS_TOKEN}"
    subprotocols = websocket.headers.get("sec-websocket-protocol", "")
    access_token = None

    for protocol in subprotocols.split(","):
        protocol = protocol.strip()
        if protocol.startswith("token."):
            access_token = protocol[len("token."):]
            break

    if not access_token:
        await websocket.close(code=1008, reason="Missing token in subprotocol")
        return

    # ── Token Verification via Supabase ────────────────────────
    try:
        db = get_supabase()
        user_response = db.auth.get_user(access_token)

        if not user_response or not user_response.user:
            await websocket.close(code=1008, reason="Invalid or expired token")
            return

        user_id = user_response.user.id

    except Exception as e:
        print(f"Token verification failed: {e}")
        await websocket.close(code=1008, reason="Token verification failed")
        return

    # ── Accept with matching subprotocol ──────────────────────
    # Must echo back the matched subprotocol, otherwise the browser
    # will reject the connection with a subprotocol mismatch error
    await websocket.accept(subprotocol=f"token.{access_token}")

    print(f"WebSocket connection accepted for user: {user_id}")

    audio_input_queue = asyncio.Queue()
    video_input_queue = asyncio.Queue()
    text_input_queue = asyncio.Queue()

    async def audio_output_callback(data):
        await websocket.send_bytes(data)

    async def audio_interrupt_callback():
        # The event queue handles the JSON message, but we might want to do something else here
        pass

    gemini_client = GeminiLive(
        api_key=os.environ.get("GEMINI_API_KEY"),
        model="models/gemini-2.5-flash-native-audio-preview-12-2025",
        input_sample_rate=16000,
    )

    async def receive_from_client():
        try:
            while True:
                message = await websocket.receive()

                if message.get("bytes"):
                    await audio_input_queue.put(message["bytes"])
                elif message.get("text"):
                    text = message["text"]
                    try:
                        payload = json.loads(text)
                        if isinstance(payload, dict) and payload.get("type") == "image":
                            print(f"Received image chunk from client: {len(payload['data'])} base64 chars")
                            image_data = base64.b64decode(payload["data"])
                            await video_input_queue.put(image_data)
                            continue
                    except json.JSONDecodeError:
                        pass

                    await text_input_queue.put(text)
        except WebSocketDisconnect:
            print("WebSocket disconnected")
        except Exception as e:
            print(f"Error receiving from client: {e}")

    receive_task = asyncio.create_task(receive_from_client())
    user_profile = await knowledge.get_user_bkt_context(user_id)
    aiPrompt = f"""
        {user_profile}

        you are fun teacher.
        Ask the user what they'd like to lern or review based on their profile and
        tell them what you know about them.

    """

    async def run_session():
        async for event in gemini_client.start_session(
            prompt=aiPrompt,
            audio_input_queue=audio_input_queue,
            video_input_queue=video_input_queue,
            text_input_queue=text_input_queue,
            audio_output_callback=audio_output_callback,
            audio_interrupt_callback=audio_interrupt_callback,
        ):
            if event:
                # Forward events (transcriptions, etc) to client
                await websocket.send_json(event)

    try:
        await run_session()
    except Exception as e:
        print(f"Error in Gemini session: {e}")
    finally:
        receive_task.cancel()
        # Ensure websocket is closed if not already
        try:
            await websocket.close()
        except:
            pass