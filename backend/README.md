# INTOIT Learning — Backend

AI-powered adaptive learning platform backend. FastAPI + Supabase + Google Gemini.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI (Python 3.12) |
| Database | Supabase (Postgres + Storage + Auth) |
| AI | Google Gemini 2.0 Flash |
| Auth | Supabase JWT |
| Deployment | Render / any ASGI host |

---

## Setup

```bash
# 1. Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY

# 4. Apply database schema
# Run supabase_schema.sql in the Supabase SQL editor

# 5. Start server
uvicorn app.main:app --reload
```

API docs available at `http://localhost:8000/api/docs`

---

## Features

### 1. Authentication — `/api/auth`
- Sign up / sign in / sign out via Supabase Auth
- Auto-profile creation on signup (via Postgres trigger)
- JWT-protected routes throughout

---

### 2. File Management — `/api/files`

Upload course materials and have them automatically processed.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/files/upload` | Upload PDF, DOCX, or PPTX to a course |
| `GET` | `/api/files/course/{course_id}` | List all files for a course |
| `GET` | `/api/files/{file_id}` | Get file metadata |
| `GET` | `/api/files/{file_id}/content` | Get extracted text content |
| `GET` | `/api/files/{file_id}/download` | Download raw file |
| `GET` | `/api/files/{file_id}/topics` | Get auto-generated topics for a file |
| `GET` | `/api/files/{file_id}/quizzes` | Get auto-generated quizzes for a file |
| `POST` | `/api/files/{file_id}/reextract` | Re-run content extraction |
| `DELETE` | `/api/files/{file_id}` | Delete file from storage and DB |

**Supported formats:** PDF, DOCX, DOC, PPTX, PPT (up to 50 MB)

#### File Upload → Auto-Generation Pipeline

When a file is uploaded with extractable content, topics and quizzes are **automatically generated in the background** using Gemini AI. The upload response returns immediately with `auto_generation_queued: true`; results are retrievable via the `/topics` and `/quizzes` endpoints within seconds.

```
POST /api/files/upload
  │
  ├── 1. Parse file → extract plain text (PDF / DOCX / PPTX)
  ├── 2. Upload raw file to Supabase Storage
  ├── 3. Insert metadata to public.course_files
  └── 4. Queue background task: auto_generate_content()
              │
              ├── Gemini analyzes full document content
              │     → Identifies 3–8 learning topics
              │     → Each topic: topic_id, name, category, description,
              │                   difficulty_level, prerequisites, key_concepts
              │     → Topics stored in public.topics (linked via source_file_id)
              │
              └── For each topic → Gemini generates a 5-question quiz
                    → Stored in public.file_quizzes
                    → Immediately retrievable via GET /api/files/{file_id}/quizzes
```

**Upload response:**
```json
{
  "success": true,
  "file_id": "f3a8c291-...",
  "filename": "data_structures.pdf",
  "storage_path": "courses/cs101/f3a8c291-.../data_structures.pdf",
  "extracted_content_preview": "Chapter 1: Arrays and Linked Lists...",
  "auto_generation_queued": true,
  "message": "File uploaded successfully. Topics and quizzes are being generated."
}
```

**Example — topics Gemini extracts from a document:**
```json
{
  "topics": [
    {
      "topic_id": "linked_lists",
      "name": "Linked Lists",
      "category": "Data Structures",
      "description": "Singly and doubly linked lists, node structure, traversal.",
      "difficulty_level": "medium",
      "prerequisites": ["pointers"],
      "key_concepts": ["node", "head pointer", "traversal", "insertion", "deletion"]
    }
  ]
}
```

Topic IDs are namespaced with the first 8 chars of the `file_id` to avoid global collisions (e.g. `f3a8c291_linked_lists`). Prerequisites are resolved within the same file's topic list.

---

### 3. AI Content Generation — `/api/generate`

On-demand generation powered by Gemini.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/generate/quiz` | Generate a quiz for any topic |
| `POST` | `/api/generate/flashcards` | Generate flashcards for any topic |
| `POST` | `/api/explain` | AI explanation with analogies |

**Quiz request:**
```json
{ "topic": "binary trees", "difficulty": "medium", "num_questions": 5 }
```

**Flashcards request:**
```json
{ "topic": "sorting algorithms", "num_cards": 10 }
```

> When `user_id` is provided, Gemini receives the user's BKT learning profile and tailors questions to their weak areas — see [BKT System](#5-knowledge--bkt-system----apiknowledge) below.

---

### 4. Progress Tracking — `/api/progress`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/progress/{user_id}` | Get user profile + stats |
| `PATCH` | `/api/progress/{user_id}` | Update profile (XP, level, streak, theme…) |
| `POST` | `/api/progress/{user_id}/topic` | Mark topic complete, record XP |
| `GET` | `/api/progress/{user_id}/due-cards` | Get flash cards due for SM-2 review |
| `POST` | `/api/progress/{user_id}/cards` | Save / upsert flash cards |
| `POST` | `/api/progress/{user_id}/report` | Generate comprehensive progress report |
| `GET` | `/api/progress/{user_id}/report/latest` | Retrieve latest progress report |

**Progress report includes:** answer stats (accuracy, correct/wrong counts), per-topic completion, struggling areas, XP, streak, recommendations.

Flash cards use **SM-2 spaced repetition** — `ease_factor`, `interval_days`, and `next_review` are tracked per card.

---

### 5. Knowledge & BKT System — `/api/knowledge`

Adaptive learning engine combining **Bayesian Knowledge Tracing (BKT)** with a **prerequisite knowledge graph**.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/knowledge/{user_id}/state` | Full BKT mastery state across all topics |
| `GET` | `/api/knowledge/{user_id}/graph` | Knowledge graph nodes + edges with p_know overlay |
| `GET` | `/api/knowledge/{user_id}/weak-areas` | Topics where `p_know < 0.50`, sorted ascending |
| `GET` | `/api/knowledge/{user_id}/strong-areas` | Topics where `p_know >= 0.85` |
| `GET` | `/api/knowledge/{user_id}/next-topics` | Recommended next topics to study |
| `POST` | `/api/knowledge/{user_id}/quiz-result` | Submit quiz answers → update BKT state |
| `POST` | `/api/knowledge/graph/edges` | Admin: add/update prerequisite edges |

#### BKT — How Mastery Is Tracked

Each `(user, topic)` pair maintains a **4-parameter BKT state**:

| Parameter | Default | Meaning |
|---|---|---|
| `p_know` | `0.0 → 1.0` | Current mastery probability (live estimate) |
| `p_transit` | `0.10` | P(user learns on this attempt) |
| `p_slip` | `0.10` | P(wrong answer despite knowing — careless error) |
| `p_guess` | `0.20` | P(correct answer despite not knowing — lucky guess) |

**Update formula applied per quiz answer:**
```
# Step 1 — Bayesian posterior (adjust for evidence)
if correct:
    p_posterior = p_know × (1 − p_slip)
                  ─────────────────────────────────────────────────────
                  p_know × (1−p_slip)  +  (1−p_know) × p_guess

else:
    p_posterior = p_know × p_slip
                  ─────────────────────────────────────────────────────
                  p_know × p_slip  +  (1−p_know) × (1−p_guess)

# Step 2 — Apply learning transition
p_know_new = p_posterior + (1 − p_posterior) × p_transit
```

Applied sequentially across all answers in a quiz batch — the output of each step becomes the input of the next.

**Mastery thresholds:**
```
p_know >= 0.85         → mastered    ✅
0.50 <= p_know < 0.85  → learning    📘
0.00 < p_know < 0.50   → struggling  ⚠️
attempts == 0           → untouched   ○
```

After each quiz, Gemini analyses wrong answers and produces a `common_mistake` — a one-sentence misconception summary stored on the `bkt_state` row (e.g. `"Confuses *ptr=NULL with free(ptr); treats pointer nulling as equivalent to freeing heap memory."`).

---

#### How "Next Topics" Is Determined

`GET /api/knowledge/{user_id}/next-topics` uses the **knowledge graph** (`kg_edges`) and the user's **BKT state** (`bkt_state`) to compute what to study next.

**Algorithm (3 steps):**

**Step 1 — Unlock check**
A topic is *eligible* when **every one of its prerequisite topics** satisfies `p_know >= 0.50` (learning threshold), OR it has no prerequisites.

**Step 2 — Filter mastered**
Eligible topics are included only if their own `p_know < 0.85` (not yet mastered — no point re-studying what is already known).

**Step 3 — Rank**
Eligible topics are sorted by:
1. Ascending `p_know` → weakest unlocked topic first (reinforce before advancing)
2. Shortest prerequisite chain → topics closer to current knowledge state

**Example:**
```
memory_allocation (p=0.91 ✅) ──► pointers (p=0.65 📘) ──► linked_lists (p=0.31 ⚠️) ──► trees (○)
binary_math       (p=0.88 ✅) ────────────────────────────────────────────────────────► trees (○)
```

Result of `/next-topics`:
1. `linked_lists` — prerequisites met (pointers 0.65 ≥ 0.50 ✅), not mastered (0.31 < 0.85) → **top pick**
2. `trees` — NOT yet eligible, requires `linked_lists` to reach ≥ 0.50 first

**Full quiz-result → BKT update flow:**
```
POST /api/knowledge/{user_id}/quiz-result
  │
  ├── Load bkt_state for (user_id, topic_id)
  ├── Batch BKT update — sequential per answer
  │     → p_know_before / p_know_after recorded per answer
  ├── INSERT quiz_events (one row per answer)
  ├── UPSERT bkt_state (new p_know + mastery_level)
  ├── Wrong answers → Gemini → common_mistake string
  │     → UPDATE bkt_state SET common_mistake = ...
  └── Return { p_know_after, mastery_level, common_mistake, next_topics }
```

---

#### Gemini RAG Context Injection

When `user_id` is provided to quiz or explain endpoints, the user's full BKT profile is prepended to every Gemini prompt:

```
[USER LEARNING PROFILE]
Mastered  (p >= 0.85): Binary Math (0.91), Logic Gates (0.88), Pointers (0.87)
Learning  (0.50–0.85): Memory Allocation (0.72), Linked Lists (0.51)
Struggling (p < 0.50): Recurrence Relations (0.31), Trees (0.22)
Common misconceptions:
  - Linked Lists:        "Confuses *ptr=NULL with free(ptr)"
  - Recurrence Rel.:     "Solves T(n)=2T(n/2)+n as O(n²) instead of applying Master Theorem"
Recommended next: linked_lists, trees, recurrence_relations
[/USER LEARNING PROFILE]
```

This makes every quiz and explanation **personalized** — targeting weak areas, building on mastered concepts, and directly probing known misconceptions.

---

### 6. Live AI Chat — `/api/live-chat`

Real-time AI chat backed by Gemini Live with session tracking.

---

### 7. Voice — `/api/voice`

Voice interaction endpoint powered by Gemini.

---

### 8. Search — `/api/search`

Full-text search across course content and topics.

---

### 9. Videos — `/api/videos`

Video asset management and retrieval for course modules.

---

## Database Schema — Key Tables

| Table | Purpose |
|---|---|
| `profiles` | User profiles — XP, level, streak, theme, accuracy stats |
| `topics` | Topic catalogue — name, category, difficulty, prerequisites, `source_file_id` |
| `courses` | Course definitions |
| `course_modules` | Module structure within courses |
| `course_files` | Uploaded file metadata + extracted text content |
| `file_quizzes` | **Auto-generated quizzes** per topic per uploaded file |
| `topic_progress` | Per-user topic completion state |
| `flash_cards` | SM-2 flash cards per user |
| `quiz_answers` | Per-answer quiz log (analytics) |
| `bkt_state` | Per-user BKT mastery state per topic |
| `quiz_events` | Per-answer BKT event log |
| `kg_edges` | Knowledge graph prerequisite edges (`from_topic → to_topic`) |
| `generated_content` | On-demand Gemini content cache (7-day TTL) |
| `lesson_progress` | Lesson-level completion tracking |
| `forge_sessions` | Forge mode session scores |
| `lab_sessions` | Lab mode session scores |
| `badges` | Earned badges per user |
| `chat_sessions` | Live chat session metadata |
| `progress_reports` | Cached progress report snapshots |

---

## Full API Reference

```
GET  /api/health

# Auth
POST /api/auth/signup
POST /api/auth/signin
POST /api/auth/signout

# Files
POST   /api/files/upload                       ← triggers auto topic+quiz generation
GET    /api/files/course/{course_id}
GET    /api/files/{file_id}
GET    /api/files/{file_id}/content
GET    /api/files/{file_id}/download
GET    /api/files/{file_id}/topics             ← auto-generated topics from file
GET    /api/files/{file_id}/quizzes            ← auto-generated quizzes from file
POST   /api/files/{file_id}/reextract
DELETE /api/files/{file_id}

# AI Generation (on-demand)
POST /api/generate/quiz
POST /api/generate/flashcards
POST /api/explain

# Progress
GET    /api/progress/{user_id}
PATCH  /api/progress/{user_id}
POST   /api/progress/{user_id}/topic
GET    /api/progress/{user_id}/due-cards
POST   /api/progress/{user_id}/cards
POST   /api/progress/{user_id}/report
GET    /api/progress/{user_id}/report/latest

# Knowledge / BKT
GET  /api/knowledge/{user_id}/state
GET  /api/knowledge/{user_id}/graph
GET  /api/knowledge/{user_id}/weak-areas
GET  /api/knowledge/{user_id}/strong-areas
GET  /api/knowledge/{user_id}/next-topics
POST /api/knowledge/{user_id}/quiz-result
POST /api/knowledge/graph/edges

# Live Chat / Voice / Search / Videos
POST   /api/live-chat/session
POST   /api/live-chat/message
DELETE /api/live-chat/session/{session_id}
POST   /api/voice/...
GET    /api/search/...
GET    /api/videos/...
```
