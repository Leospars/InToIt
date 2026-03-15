"""app/api/routes/knowledge.py — BKT + Knowledge Graph endpoints"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google import genai

from app.db.supabase import get_supabase
from app.core.config import settings
from app.core.bkt import update_bkt, batch_update, classify_mastery, build_gemini_context

router = APIRouter()


# ── Pydantic Models ───────────────────────────────────────────────────────────

class QuizAnswerResult(BaseModel):
    question: Optional[str] = None
    selected_answer: Optional[str] = None
    correct_answer: Optional[str] = None
    correct: bool
    time_taken_ms: Optional[int] = None


class QuizResultRequest(BaseModel):
    topic_id: str
    quiz_source: Optional[str] = None
    source_file_id: Optional[str] = None
    difficulty: Optional[str] = "medium"
    results: List[QuizAnswerResult]


class KGEdgeRequest(BaseModel):
    from_topic: str
    to_topic: str
    weight: float = 1.0


# ── Internal helpers ──────────────────────────────────────────────────────────

def compute_next_topics(
    bkt_map: Dict[str, Dict],
    topics: List[Dict],
    edges: List[Dict],
    limit: int = 5,
) -> List[Dict]:
    """Return unlocked, unmastered topics sorted by ascending p_know.

    A topic is *unlocked* when every prerequisite has p_know >= 0.50.
    Prerequisites come from both kg_edges and topics.prerequisites[].
    """
    prereq_map: Dict[str, List[str]] = {}

    for edge in edges:
        prereq_map.setdefault(edge["to_topic"], []).append(edge["from_topic"])

    for t in topics:
        tid   = t["topic_id"]
        prereqs = t.get("prerequisites") or []
        for p in prereqs:
            if p not in prereq_map.get(tid, []):
                prereq_map.setdefault(tid, []).append(p)

    result: List[Dict] = []
    for t in topics:
        tid   = t["topic_id"]
        bkt   = bkt_map.get(tid, {})
        p_know = bkt.get("p_know", 0.0)

        if p_know >= 0.85:
            continue

        prereqs = prereq_map.get(tid, [])
        unlocked = all(bkt_map.get(p, {}).get("p_know", 0.0) >= 0.50 for p in prereqs)

        if unlocked:
            result.append({
                **t,
                "p_know":        p_know,
                "mastery_level": bkt.get("mastery_level", "untouched"),
                "attempts":      bkt.get("attempts", 0),
            })

    result.sort(key=lambda x: x["p_know"])
    return result[:limit]


async def _generate_common_mistake(
    topic_id: str,
    topic_name: str,
    wrong_answers: List[Dict],
) -> Optional[str]:
    """Call Gemini to produce a one-sentence misconception summary."""
    if not wrong_answers:
        return None
    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        wrong_fmt = "\n".join(
            f'Q: {w.get("question", "")}\n'
            f'  User answered: {w.get("selected_answer", "")}\n'
            f'  Correct: {w.get("correct_answer", "")}'
            for w in wrong_answers[:5]
        )
        prompt = (
            f'A student is learning about "{topic_name}". '
            f"They got the following questions wrong:\n\n{wrong_fmt}\n\n"
            "In ONE sentence (max 25 words), describe the specific conceptual mistake "
            "or misconception this student likely has. Be precise, not generic. "
            'Start with a verb: "Confuses", "Misunderstands", "Incorrectly assumes", etc.'
        )
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        return response.text.strip()
    except Exception:
        return None


async def get_user_bkt_context(
    user_id: str,
    active_topic: Optional[str] = None,
) -> str:
    """Build the full RAG context block for a user (called by ai.py routes)."""
    db = get_supabase()

    bkt_rows    = db.table("bkt_state").select("*").eq("user_id", user_id).execute().data or []
    topics_rows = db.table("topics").select("topic_id, name, category, difficulty_level, prerequisites").execute().data or []
    edges_rows  = db.table("kg_edges").select("from_topic, to_topic, weight").execute().data or []

    bkt_map = {r["topic_id"]: r for r in bkt_rows}

    bkt_states: List[Dict] = []
    for t in topics_rows:
        tid  = t["topic_id"]
        bkt  = bkt_map.get(tid, {})
        name = t.get("name", tid)
        if active_topic and tid == active_topic:
            name += " \u2190 active topic"
        bkt_states.append({
            "topic_id":       tid,
            "topic_name":     name,
            "category":       t.get("category", ""),
            "p_know":         bkt.get("p_know", 0.0),
            "mastery_level":  bkt.get("mastery_level", "untouched"),
            "attempts":       bkt.get("attempts", 0),
            "common_mistake": bkt.get("common_mistake"),
        })

    next_topics = compute_next_topics(bkt_map, topics_rows, edges_rows, limit=5)
    return build_gemini_context(bkt_states, next_topics)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/graph/edges")
async def add_kg_edge(edge: KGEdgeRequest):
    """Admin: add or update a prerequisite edge in the knowledge graph."""
    db = get_supabase()
    result = db.table("kg_edges").upsert(
        {"from_topic": edge.from_topic, "to_topic": edge.to_topic, "weight": edge.weight},
        on_conflict="from_topic,to_topic",
    ).execute()
    return {"status": "ok", "edge": result.data}


@router.get("/{user_id}/state")
async def get_bkt_state(user_id: str):
    """Full BKT mastery state across all topics for a user."""
    db = get_supabase()

    topics_rows = db.table("topics").select(
        "topic_id, name, category, difficulty_level, prerequisites"
    ).execute().data or []

    bkt_rows = db.table("bkt_state").select("*").eq("user_id", user_id).execute().data or []
    bkt_map  = {r["topic_id"]: r for r in bkt_rows}

    state: List[Dict] = []
    for t in topics_rows:
        tid  = t["topic_id"]
        bkt  = bkt_map.get(tid, {})
        state.append({
            "topic_id":       tid,
            "name":           t.get("name", tid),
            "category":       t.get("category", ""),
            "difficulty":     t.get("difficulty_level", "medium"),
            "prerequisites":  t.get("prerequisites") or [],
            "p_know":         bkt.get("p_know", 0.0),
            "p_transit":      bkt.get("p_transit", 0.10),
            "p_slip":         bkt.get("p_slip", 0.10),
            "p_guess":        bkt.get("p_guess", 0.20),
            "attempts":       bkt.get("attempts", 0),
            "mastery_level":  bkt.get("mastery_level", "untouched"),
            "common_mistake": bkt.get("common_mistake"),
            "last_updated":   bkt.get("last_updated"),
        })

    return {"user_id": user_id, "topics": state, "total": len(state)}


@router.get("/{user_id}/graph")
async def get_knowledge_graph(user_id: str):
    """Knowledge graph nodes + edges with p_know overlay for the user."""
    db = get_supabase()

    topics_rows = db.table("topics").select(
        "topic_id, name, category, difficulty_level, prerequisites"
    ).execute().data or []

    edges_rows = db.table("kg_edges").select(
        "from_topic, to_topic, weight"
    ).execute().data or []

    bkt_rows = db.table("bkt_state").select(
        "topic_id, p_know, mastery_level, attempts, common_mistake, last_updated"
    ).eq("user_id", user_id).execute().data or []
    bkt_map  = {r["topic_id"]: r for r in bkt_rows}

    nodes: List[Dict] = []
    for t in topics_rows:
        tid = t["topic_id"]
        bkt = bkt_map.get(tid, {})
        nodes.append({
            "id":             tid,
            "name":           t.get("name", tid),
            "category":       t.get("category", ""),
            "difficulty":     t.get("difficulty_level", "medium"),
            "prerequisites":  t.get("prerequisites") or [],
            "p_know":         bkt.get("p_know", 0.0),
            "mastery_level":  bkt.get("mastery_level", "untouched"),
            "attempts":       bkt.get("attempts", 0),
            "common_mistake": bkt.get("common_mistake"),
            "last_updated":   bkt.get("last_updated"),
        })

    edges: List[Dict] = [
        {"from": e["from_topic"], "to": e["to_topic"], "weight": e["weight"]}
        for e in edges_rows
    ]

    return {"nodes": nodes, "edges": edges}


@router.get("/{user_id}/weak-areas")
async def get_weak_areas(user_id: str):
    """Topics where p_know < 0.50 and at least one attempt, sorted ascending."""
    db = get_supabase()

    rows = (
        db.table("bkt_state")
        .select("topic_id, p_know, mastery_level, attempts, common_mistake, last_updated")
        .eq("user_id", user_id)
        .lt("p_know", 0.50)
        .gt("attempts", 0)
        .order("p_know", desc=False)
        .execute()
        .data or []
    )

    if not rows:
        return {"user_id": user_id, "weak_areas": []}

    topic_ids   = [r["topic_id"] for r in rows]
    topics_rows = (
        db.table("topics")
        .select("topic_id, name, category")
        .in_("topic_id", topic_ids)
        .execute()
        .data or []
    )
    topic_meta = {t["topic_id"]: t for t in topics_rows}

    weak = [
        {
            **r,
            "name":     topic_meta.get(r["topic_id"], {}).get("name", r["topic_id"]),
            "category": topic_meta.get(r["topic_id"], {}).get("category", ""),
        }
        for r in rows
    ]
    return {"user_id": user_id, "weak_areas": weak}


@router.get("/{user_id}/strong-areas")
async def get_strong_areas(user_id: str):
    """Topics where p_know >= 0.85 (mastered), sorted descending."""
    db = get_supabase()

    rows = (
        db.table("bkt_state")
        .select("topic_id, p_know, mastery_level, attempts, last_updated")
        .eq("user_id", user_id)
        .gte("p_know", 0.85)
        .order("p_know", desc=True)
        .execute()
        .data or []
    )

    if not rows:
        return {"user_id": user_id, "strong_areas": []}

    topic_ids   = [r["topic_id"] for r in rows]
    topics_rows = (
        db.table("topics")
        .select("topic_id, name, category")
        .in_("topic_id", topic_ids)
        .execute()
        .data or []
    )
    topic_meta = {t["topic_id"]: t for t in topics_rows}

    strong = [
        {
            **r,
            "name":     topic_meta.get(r["topic_id"], {}).get("name", r["topic_id"]),
            "category": topic_meta.get(r["topic_id"], {}).get("category", ""),
        }
        for r in rows
    ]
    return {"user_id": user_id, "strong_areas": strong}


@router.get("/{user_id}/next-topics")
async def get_next_topics(user_id: str, limit: int = 5):
    """Recommend next topics: unlocked by prerequisites, not yet mastered."""
    db = get_supabase()

    topics_rows = db.table("topics").select(
        "topic_id, name, category, difficulty_level, prerequisites"
    ).execute().data or []

    edges_rows = db.table("kg_edges").select(
        "from_topic, to_topic, weight"
    ).execute().data or []

    bkt_rows = (
        db.table("bkt_state")
        .select("topic_id, p_know, mastery_level, attempts")
        .eq("user_id", user_id)
        .execute()
        .data or []
    )
    bkt_map = {r["topic_id"]: r for r in bkt_rows}

    next_topics = compute_next_topics(bkt_map, topics_rows, edges_rows, limit=limit)
    return {"user_id": user_id, "next_topics": next_topics}


@router.post("/{user_id}/quiz-result")
async def submit_quiz_result(user_id: str, body: QuizResultRequest):
    """Submit quiz answers → BKT update → persist → generate common mistake.

    Returns updated BKT state, common_mistake, and next recommended topics.
    """
    db       = get_supabase()
    topic_id = body.topic_id

    # 1. Load existing BKT state (or use defaults)
    existing = db.table("bkt_state").select("*").eq("user_id", user_id).eq("topic_id", topic_id).execute()
    bkt_data = existing.data[0] if existing.data else {}

    p_know_init   = bkt_data.get("p_know", 0.0)
    p_transit     = bkt_data.get("p_transit", 0.10)
    p_slip        = bkt_data.get("p_slip", 0.10)
    p_guess       = bkt_data.get("p_guess", 0.20)
    prev_attempts = bkt_data.get("attempts", 0)

    results_dicts = [r.model_dump() for r in body.results]

    # 2. Batch BKT update
    p_know_final, p_befores, p_afters = batch_update(
        p_know_init, p_transit, p_slip, p_guess, results_dicts
    )
    new_attempts = prev_attempts + len(results_dicts)
    new_mastery  = classify_mastery(p_know_final, new_attempts)

    # 3. Resolve topic name
    topic_row  = db.table("topics").select("topic_id, name").eq("topic_id", topic_id).execute()
    topic_name = topic_row.data[0].get("name", topic_id) if topic_row.data else topic_id

    # 4. Insert quiz_events (one row per answer)
    events = [
        {
            "user_id":       user_id,
            "topic_id":      topic_id,
            "question":      r.get("question"),
            "correct":       r["correct"],
            "time_taken_ms": r.get("time_taken_ms"),
            "p_know_before": p_befores[i],
            "p_know_after":  p_afters[i],
        }
        for i, r in enumerate(results_dicts)
    ]
    if events:
        db.table("quiz_events").insert(events).execute()

    # 5. Generate common_mistake from wrong answers (keep existing if all correct)
    wrong_answers  = [r for r in results_dicts if not r["correct"]]
    common_mistake = bkt_data.get("common_mistake")
    if wrong_answers:
        common_mistake = await _generate_common_mistake(topic_id, topic_name, wrong_answers)

    # 6. Upsert bkt_state
    upsert_payload: Dict[str, Any] = {
        "user_id":       user_id,
        "topic_id":      topic_id,
        "p_know":        round(p_know_final, 6),
        "p_transit":     p_transit,
        "p_slip":        p_slip,
        "p_guess":       p_guess,
        "attempts":      new_attempts,
        "mastery_level": new_mastery,
    }
    if common_mistake is not None:
        upsert_payload["common_mistake"] = common_mistake

    db.table("bkt_state").upsert(upsert_payload, on_conflict="user_id,topic_id").execute()

    # 7. Compute next topics using refreshed BKT map
    topics_rows = db.table("topics").select(
        "topic_id, name, category, difficulty_level, prerequisites"
    ).execute().data or []
    edges_rows  = db.table("kg_edges").select("from_topic, to_topic, weight").execute().data or []
    bkt_rows    = db.table("bkt_state").select("topic_id, p_know, mastery_level, attempts").eq("user_id", user_id).execute().data or []
    bkt_map     = {r["topic_id"]: r for r in bkt_rows}
    bkt_map[topic_id] = {"p_know": p_know_final, "mastery_level": new_mastery, "attempts": new_attempts}

    next_topics = compute_next_topics(bkt_map, topics_rows, edges_rows, limit=3)

    return {
        "topic_id":      topic_id,
        "topic_name":    topic_name,
        "p_know_before": round(p_know_init, 4),
        "p_know_after":  round(p_know_final, 4),
        "mastery_level": new_mastery,
        "attempts":      new_attempts,
        "correct_count": sum(1 for r in results_dicts if r["correct"]),
        "wrong_count":   len(wrong_answers),
        "common_mistake": common_mistake,
        "next_topics": [
            {
                "topic_id":      t["topic_id"],
                "name":          t.get("name", t["topic_id"]),
                "p_know":        t.get("p_know", 0.0),
                "mastery_level": t.get("mastery_level", "untouched"),
            }
            for t in next_topics
        ],
        "bkt_state": {
            "p_know":        round(p_know_final, 6),
            "p_transit":     p_transit,
            "p_slip":        p_slip,
            "p_guess":       p_guess,
            "mastery_level": new_mastery,
        },
    }
