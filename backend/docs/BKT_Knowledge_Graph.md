# BKT + Knowledge Graph — INTOIT Learning

Implement Bayesian Knowledge Tracing (BKT) and a topic knowledge graph to guide Gemini AI with personalized context, store mastery state in Supabase, expose analytics APIs, and visualize on two new frontend pages.

---

## 1. Data Model

### BKT State per User/Topic
Each topic gets 4 BKT parameters (defaults set sensibly for learning content):

| Field | Type | Description |
|---|---|---|
| `p_know` | float | Current P(mastered) — the live mastery score (0–1) |
| `p_transit` | float | P(learn on this attempt) — default 0.10 |
| `p_slip` | float | P(wrong despite knowing) — default 0.10 |
| `p_guess` | float | P(correct despite not knowing) — default 0.20 |
| `attempts` | int | Total quiz events for this topic |
| `mastery_level` | enum | `untouched` / `struggling` / `learning` / `mastered` |

**Mastery thresholds:** `p_know ≥ 0.85` → mastered, `≥ 0.5` → learning, `< 0.5` → struggling, 0 attempts → untouched.

**BKT update formula (per quiz answer):**
```
# Posterior after evidence
if correct:
    p_posterior = p_know * (1 - p_slip) / (p_know*(1-p_slip) + (1-p_know)*p_guess)
else:
    p_posterior = p_know * p_slip / (p_know*p_slip + (1-p_know)*(1-p_guess))

# Apply learning transition
p_know_new = p_posterior + (1 - p_posterior) * p_transit
```

### Knowledge Graph
Nodes = topics (from `public.topics`). Edges = prerequisite links (stored separately). The graph payload overlays `p_know` onto each node for the frontend.

---

## 2. Supabase Schema — New Tables

```sql
-- BKT state per user per topic
create table public.bkt_state (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.profiles(id) on delete cascade not null,
  topic_id     text not null,
  p_know       float not null default 0.0,
  p_transit    float not null default 0.10,
  p_slip       float not null default 0.10,
  p_guess      float not null default 0.20,
  attempts     integer not null default 0,
  mastery_level text not null default 'untouched',
  last_updated timestamptz not null default now(),
  unique(user_id, topic_id)
);

-- Quiz event log (drives BKT updates)
create table public.quiz_events (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  topic_id    text not null,
  question    text,
  correct     boolean not null,
  time_taken_ms integer,
  p_know_before float,
  p_know_after  float,
  created_at  timestamptz not null default now()
);

-- Knowledge graph edges (prerequisite relationships)
create table public.kg_edges (
  id          uuid primary key default uuid_generate_v4(),
  from_topic  text not null,
  to_topic    text not null,
  weight      float not null default 1.0,
  unique(from_topic, to_topic)
);
```

RLS: `bkt_state` and `quiz_events` — own rows only. `kg_edges` — public read.

---

## 3. New Files & Changes

### New: `app/api/routes/knowledge.py`
Houses all BKT + knowledge graph logic:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/knowledge/{user_id}/quiz-result` | POST | Accept quiz results array → run BKT update → store events → return updated `bkt_state` |
| `/api/knowledge/{user_id}/state` | GET | Full BKT state across all topics for a user |
| `/api/knowledge/{user_id}/graph` | GET | Knowledge graph nodes+edges with `p_know` overlay |
| `/api/knowledge/{user_id}/weak-areas` | GET | Topics where `p_know < 0.5`, sorted by p_know asc |
| `/api/knowledge/{user_id}/strong-areas` | GET | Topics where `p_know ≥ 0.85` |
| `/api/knowledge/{user_id}/next-topics` | GET | Recommend next topics: prerequisites met, not yet mastered |
| `/api/knowledge/graph/edges` | POST | Admin: add/update prerequisite edges |

**Request model for `quiz-result`:**
```json
{
  "topic_id": "binary_math",
  "results": [
    { "question": "...", "correct": true, "time_taken_ms": 3200 },
    { "question": "...", "correct": false, "time_taken_ms": 8100 }
  ]
}
```

**Graph response format:**
```json
{
  "nodes": [
    { "id": "logic_gates", "name": "Logic Gates", "category": "hardware",
      "p_know": 0.91, "mastery_level": "mastered", "attempts": 24 }
  ],
  "edges": [
    { "from": "logic_gates", "to": "cpu_architecture", "weight": 1.0 }
  ]
}
```

### New: `app/core/bkt.py`
Pure BKT computation module (no DB dependency):
- `update_bkt(p_know, p_transit, p_slip, p_guess, correct) → float`
- `batch_update(state, results) → BKTState`
- `classify_mastery(p_know) → str`
- `build_gemini_context(bkt_states, next_topics) → str`

### Modified: `app/main.py`

**`generate_quiz`** — add optional `user_id` field to `QuizRequest`:
```python
# Prepend BKT context to prompt
if request.user_id:
    bkt_ctx = await get_user_bkt_context(request.user_id, request.topic)
    prompt = f"{bkt_ctx}\n\n{base_prompt}"
```
Context injected:
```
User Knowledge Profile for [topic]:
- Current mastery: 0.62 (learning)
- Weak sub-areas: recurrence relations, asymptotic notation
- Strong sub-areas: big-O basics
- Tailor questions to reinforce weak areas. Avoid trivial questions already mastered.
```

**`explain`** — add optional `user_id` to `ExplainRequest`:
```python
if request.user_id:
    bkt_ctx = await get_user_bkt_context(request.user_id, request.topic)
    prompt = f"{bkt_ctx}\n\nExplain {request.topic}..."
```
Context injected:
```
User Knowledge Profile:
- Mastered: Logic Gates, Binary Math
- Currently learning: CPU Architecture (p_know=0.58)
- Struggling: Recurrence Relations (p_know=0.31)
Adjust explanation depth accordingly. Build on mastered topics. Go slower on struggling areas.
```

### Modified: `app/models/requests.py`
- Add `user_id: Optional[str]` to `QuizRequest` and `ExplainRequest`

### Modified: `app/main.py` router registration
```python
from app.api.routes import knowledge
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["knowledge"])
```

---

## 4. Gemini Context Builder (`build_gemini_context`)

```python
def build_gemini_context(bkt_states: list[dict], next_topics: list[str]) -> str:
    mastered  = [s for s in bkt_states if s["mastery_level"] == "mastered"]
    learning  = [s for s in bkt_states if s["mastery_level"] == "learning"]
    struggling= [s for s in bkt_states if s["mastery_level"] == "struggling"]
    return f"""
[USER KNOWLEDGE PROFILE]
Mastered ({len(mastered)}): {', '.join(s['topic_id'] for s in mastered[:5])}
Learning ({len(learning)}): {', '.join(f"{s['topic_id']} ({s['p_know']:.0%})" for s in learning[:5])}
Struggling ({len(struggling)}): {', '.join(f"{s['topic_id']} ({s['p_know']:.0%})" for s in struggling[:5])}
Recommended next: {', '.join(next_topics[:3])}
[/USER KNOWLEDGE PROFILE]
"""
```

---

## 5. Frontend Pages

### Page A — "Cortex" (BKT Mastery View)
**Route:** `/progress/cortex` or `/mastery`

**Design concept — Neural Cortex:**
- **Dark void background** (`bg-[#0a0a0f]`) matching the `void` theme from profiles
- Grid of topic **glowing orbs** arranged by category in clusters
- Each orb's: **size** = attempts count, **glow intensity + color** = mastery level
  - 🟢 Mastered → green glow (`#22c55e` with `box-shadow: 0 0 20px #22c55e`)
  - 🔵 Learning → blue pulse (`#3b82f6`)
  - 🟠 Struggling → orange/amber flicker (`#f97316`)
  - ⚫ Untouched → dim gray
- **Center ring** = overall mastery percentage radial progress arc
- Hovering an orb expands it showing: `p_know`, attempts, mastery_level, last active
- **Category lanes** separate topics into rows (e.g. Hardware, Algorithms, Data Structures)
- Top bar: filter chips `All | Struggling | Learning | Mastered`
- `font-semibold tracking-tight` headings, monospace numbers for p_know values
- Uses `recharts` RadialBarChart per category + custom SVG orbs via CSS

### Page B — "Synapse Map" (Knowledge Graph View)
**Route:** `/progress/graph`

**Design concept — Synaptic Map:**
- **Full-viewport dark canvas** — interactive force-directed graph using `react-force-graph-2d` (or `@visx/network` for lighter weight)
- **Nodes:** circles, color = mastery (same palette), size = `p_know * 40px`
  - Mastered nodes emit a subtle radial gradient glow
  - Struggling nodes pulse slowly with orange outline
- **Edges:** directed arrows (prerequisite → dependent), thickness = weight, color = dim `#2a2a3a`
  - Highlight prerequisite chain on node hover
- **On node click:** slide-in side panel (right drawer) showing:
  - Topic name, category, `p_know` progress bar
  - Last 5 quiz events (correct/wrong timeline)
  - Recommended action (e.g. "Review before attempting CPU Architecture")
  - "Start Quiz" button → navigates to quiz with `topic_id` + `user_id`
- **Top overlay controls:** zoom reset, filter by mastery, highlight learning path
- **"Next Learning Path"** button: highlights recommended chain from current knowledge state to a selected goal topic using BFS on the graph edges
- Monospace font for node labels at zoom level, `tracking-tight` for side panel

**Color palette (consistent with analytics.tsx):**
```
Mastered:   #22c55e (green)
Learning:   #3b82f6 (blue)  
Struggling: #f97316 (orange)
Untouched:  #374151 (gray-700)
Accent/BG:  #0a0a0f void dark
Edge lines: #1e1e2e
Text:       #f1f5f9
```

---

## 6. Implementation Steps

1. **`app/core/bkt.py`** — pure BKT math + context builder
2. **Supabase SQL** — add 3 new tables + RLS + indexes to `supabase_schema.sql`
3. **`app/api/routes/knowledge.py`** — all 7 endpoints
4. **`app/models/requests.py`** — add `user_id` to `QuizRequest` + `ExplainRequest`
5. **`app/main.py`** — wire `generate_quiz` + `explain` with BKT context, register knowledge router
6. **`frontend_snippets/cortex.tsx`** — BKT Mastery Cortex page
7. **`frontend_snippets/synapse_map.tsx`** — Knowledge Graph page

---

## 7. API Summary (for frontend consumption)

```
GET  /api/knowledge/{user_id}/state          → full BKT state array
GET  /api/knowledge/{user_id}/graph          → nodes + edges JSON
GET  /api/knowledge/{user_id}/weak-areas     → sorted weak topics
GET  /api/knowledge/{user_id}/strong-areas   → mastered topics
GET  /api/knowledge/{user_id}/next-topics    → recommended next topics
POST /api/knowledge/{user_id}/quiz-result    → submit answers, get updated BKT
POST /api/knowledge/graph/edges              → manage prerequisite graph
```

All knowledge endpoints are protected by RLS; `user_id` in path is validated against `auth.uid()` in Supabase calls.

### Plan Summary
What's being built
- BKT engine (app/core/bkt.py) — pure math module, updates p_know per quiz answer using the 4-parameter BKT formula
- 3 new Supabase tables — bkt_state, quiz_events, kg_edges
- app/api/routes/knowledge.py — 7 endpoints (BKT state, graph, weak/strong areas, next-topics, submit quiz results, manage edges)
- Gemini context injection — generate_quiz + explain both get an optional user_id; BKT state is prepended to the prompt so Gemini targets weak areas and builds on mastered ones
- Two frontend pages (snippets):
  - Cortex — glowing topic orbs clustered by category on a dark void canvas, orb glow = mastery level, radial arc = overall mastery
  - Synapse Map — interactive force-directed knowledge graph, node color = mastery, click = side panel with last quiz events + "Start Quiz" button, learning path BFS highlight
- Key design decisions
  - BKT defaults: p_transit=0.10, p_slip=0.10, p_guess=0.20 — tunable per topic
  - Mastery thresholds: ≥0.85 mastered, ≥0.5 learning, <0.5 struggling
  - Frontend palette stays consistent with analytics.tsx: green/blue/orange/red + void dark bg
  - kg_edges is global (admin-managed), bkt_state + quiz_events are per-user RLS