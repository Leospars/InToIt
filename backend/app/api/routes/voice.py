"""app/api/routes/voice.py — STT/TTS proxy"""
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import Response
from typing import Optional
import httpx

router = APIRouter()


@router.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    provider: str = Form("openai-whisper"),
    api_key: str = Form(""),
    language: Optional[str] = Form(None),
):
    audio_bytes = await audio.read()

    if provider == "openai-whisper":
        async with httpx.AsyncClient() as client:
            files = {"file": (audio.filename or "audio.webm", audio_bytes, "audio/webm")}
            data = {"model": "whisper-1"}
            if language:
                data["language"] = language
            res = await client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {api_key}"},
                files=files, data=data, timeout=30,
            )
            return res.json()

    elif provider == "deepgram":
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://api.deepgram.com/v1/listen?smart_format=true",
                headers={"Authorization": f"Token {api_key}", "Content-Type": "audio/webm"},
                content=audio_bytes, timeout=30,
            )
            data = res.json()
            text = data.get("results", {}).get("channels", [{}])[0].get("alternatives", [{}])[0].get("transcript", "")
            return {"text": text}

    return {"error": f"Provider {provider} not supported server-side"}


@router.post("/synthesize")
async def synthesize(
    text: str = Form(...),
    provider: str = Form("browser-tts"),
    api_key: str = Form(""),
    voice: str = Form("alloy"),
    speed: float = Form(1.0),
):
    if provider == "openai-tts":
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://api.openai.com/v1/audio/speech",
                headers={"Authorization": f"Bearer {api_key}"},
                json={"model": "tts-1", "input": text, "voice": voice, "speed": speed},
                timeout=30,
            )
            return Response(content=res.content, media_type="audio/mpeg")

    elif provider == "elevenlabs":
        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice}",
                headers={"xi-api-key": api_key},
                json={"text": text, "model_id": "eleven_monolingual_v1"},
                timeout=30,
            )
            return Response(content=res.content, media_type="audio/mpeg")

    return {"error": "Provider not supported server-side — use browser TTS"}
