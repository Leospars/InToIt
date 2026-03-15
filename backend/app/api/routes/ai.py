"""app/api/routes/ai.py — AI generation endpoints"""
from typing import Optional
from fastapi import APIRouter, Query
from google import genai
from app.core.config import settings
from app.models.requests import QuizRequest, FlashcardsRequest, ExplainRequest
from app.api.routes.knowledge import get_user_bkt_context

router = APIRouter()



@router.post("/generate/quiz")
async def generate_quiz(request: QuizRequest, user_id: Optional[str] = Query(None)):
    """Generate a quiz using Gemini AI"""
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

    user_context = await get_user_bkt_context(user_id, active_topic=request.topic) if user_id else ""

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


@router.post("/generate/flashcards")
async def generate_flashcards(request: FlashcardsRequest, user_id: Optional[str] = Query(None)):
    """Generate flashcards using Gemini AI"""
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

    user_context = await get_user_bkt_context(user_id, active_topic=request.topic) if user_id else ""

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


@router.post("/explain")
async def explain(request: ExplainRequest, user_id: Optional[str] = Query(None)):
    """Generate an explanation using Gemini AI"""
    client = genai.Client(api_key=settings.gemini_api_key)

    user_context = await get_user_bkt_context(user_id, active_topic=request.topic) if user_id else ""

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

    return response.text


