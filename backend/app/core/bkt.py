"""app/core/bkt.py — Pure BKT computation (no DB dependency)"""

BKT_DEFAULTS = {
    "p_transit": 0.10,
    "p_slip": 0.10,
    "p_guess": 0.20,
}

MASTERY_THRESHOLDS = {
    "mastered": 0.85,
    "learning": 0.50,
}


def update_bkt(
    p_know: float,
    p_transit: float,
    p_slip: float,
    p_guess: float,
    correct: bool,
) -> float:
    """One BKT step: Bayes posterior then transit probability.

    Correct answer:
        p_posterior = p_know*(1-p_slip) / [p_know*(1-p_slip) + (1-p_know)*p_guess]
    Wrong answer:
        p_posterior = p_know*p_slip     / [p_know*p_slip     + (1-p_know)*(1-p_guess)]
    Transition:
        p_know_new  = p_posterior + (1 - p_posterior)*p_transit
    """
    if correct:
        numerator = p_know * (1.0 - p_slip)
        denominator = numerator + (1.0 - p_know) * p_guess
    else:
        numerator = p_know * p_slip
        denominator = numerator + (1.0 - p_know) * (1.0 - p_guess)

    p_posterior = (numerator / denominator) if denominator > 0.0 else p_know
    return p_posterior + (1.0 - p_posterior) * p_transit


def classify_mastery(p_know: float, attempts: int = 1) -> str:
    """Map p_know + attempts to a named mastery level."""
    if attempts == 0:
        return "untouched"
    if p_know >= MASTERY_THRESHOLDS["mastered"]:
        return "mastered"
    if p_know >= MASTERY_THRESHOLDS["learning"]:
        return "learning"
    return "struggling"


def batch_update(
    p_know: float,
    p_transit: float,
    p_slip: float,
    p_guess: float,
    results: list[dict],
) -> tuple[float, list[float], list[float]]:
    """Apply BKT update sequentially across a list of quiz answers.

    Returns:
        (p_know_final, p_know_before_per_step, p_know_after_per_step)
    """
    p = p_know
    p_befores: list[float] = []
    p_afters: list[float] = []

    for r in results:
        p_befores.append(round(p, 6))
        p = update_bkt(p, p_transit, p_slip, p_guess, r["correct"])
        p_afters.append(round(p, 6))

    return p, p_befores, p_afters


def build_gemini_context(bkt_states: list[dict], next_topics: list[dict]) -> str:
    """Build the full RAG context block to prepend to Gemini prompts.

    Args:
        bkt_states: list of dicts — keys: topic_id, topic_name/name,
                    p_know, mastery_level, attempts, common_mistake (optional)
        next_topics: list of dicts from compute_next_topics()
    """
    mastered   = [s for s in bkt_states if s.get("mastery_level") == "mastered"]
    learning   = [s for s in bkt_states if s.get("mastery_level") == "learning"]
    struggling = [s for s in bkt_states if s.get("mastery_level") == "struggling"]
    untouched  = [s for s in bkt_states if s.get("mastery_level") == "untouched"]

    def _fmt(s: dict) -> str:
        name = s.get("topic_name") or s.get("name") or s.get("topic_id", "")
        p    = s.get("p_know", 0.0)
        att  = s.get("attempts", 0)
        return f"      - {name} (p={p:.2f}, {att} attempts)"

    mastered_str   = "\n".join(_fmt(s) for s in mastered[:8])   or "      None yet"
    learning_str   = "\n".join(_fmt(s) for s in learning[:8])   or "      None yet"
    struggling_str = "\n".join(_fmt(s) for s in struggling[:8]) or "      None yet"
    untouched_str  = ", ".join(
        s.get("topic_name") or s.get("name") or s.get("topic_id", "")
        for s in untouched[:6]
    ) or "None"

    mistakes = [s for s in bkt_states if s.get("common_mistake")]
    mistakes_str = "\n".join(
        f'  - {s.get("topic_name") or s.get("name") or s.get("topic_id", "")}: "{s["common_mistake"]}"'
        for s in mistakes[:5]
    ) or "  None recorded yet"

    next_str = "\n".join(
        f"  {i + 1}. {t.get('name', t.get('topic_id', ''))} (p={t.get('p_know', 0.0):.2f})"
        for i, t in enumerate(next_topics[:5])
    ) or "  No recommendations yet"

    return f"""[USER LEARNING PROFILE]
────────────────────────────────────────────────────────────

Skill Mastery (Bayesian Knowledge Tracing estimate):
  \u2705 Mastered  (p \u2265 0.85):
{mastered_str}

  \U0001f4d8 Learning  (0.50 \u2264 p < 0.85):
{learning_str}

  \u26a0\ufe0f  Struggling (p < 0.50):
{struggling_str}

  \u25cb  Not yet started:
      {untouched_str}

────────────────────────────────────────────────────────────

Common Misconceptions (from recent wrong answers):
{mistakes_str}

────────────────────────────────────────────────────────────

Recommended Next Topics (prerequisites met, not yet mastered):
{next_str}

[/USER LEARNING PROFILE]"""
