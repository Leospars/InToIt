# BKT Math, DB Schema & RAG Prompt Engineering — INTOIT

Deep-dive reference covering the full BKT update math, knowledge graph node/edge structure, Supabase Postgres queries, completed-quiz request format, and how all of it is assembled into a RAG prompt with AI-generated common mistake indicators.

---

## 1. BKT — Full Math Reference

### 1.1 The Four Parameters

Each (user, topic) pair carries its own state. Parameters are initialised once per topic (seeded from global defaults; can be tuned per-topic later):

| Symbol | Name | Default | Meaning |
|---|---|---|---|
| **P(L₀)** | Prior knowledge | `0.0` | P(user already knows topic before any attempt) |
| **P(T)** | Transit / learn | `0.10` | P(user learns the concept on a single opportunity) |
| **P(S)** | Slip | `0.10` | P(wrong answer despite knowing — careless error) |
| **P(G)** | Guess | `0.20` | P(correct answer despite not knowing — lucky guess) |
| **P(Lₙ)** | Current mastery | `0.0 → 1.0` | Live estimate of whether user knows the skill |

---

### 1.2 Update After a Single Answer

**Step 1 — Bayes posterior (adjust for evidence):**

```
# Correct answer observed
P(Lₙ | correct) = P(Lₙ₋₁) × (1 − P(S))
                  ─────────────────────────────────────────────────────
                  P(Lₙ₋₁) × (1 − P(S))  +  (1 − P(Lₙ₋₁)) × P(G)

# Wrong answer observed
P(Lₙ | wrong)   = P(Lₙ₋₁) × P(S)
                  ─────────────────────────────────────────────────────
                  P(Lₙ₋₁) × P(S)  +  (1 − P(Lₙ₋₁)) × (1 − P(G))
```

**Step 2 — Apply learning transition (did they learn from this attempt?):**

```
P(Lₙ₊₁) = P(Lₙ | evidence) + (1 − P(Lₙ | evidence)) × P(T)
```

This is the value stored as `p_know` after each event.

---

### 1.3 Batch Update (full quiz of N questions on the same topic)

Apply steps 1 & 2 sequentially for each answer in chronological order. The output of step 2 for answer `i` becomes `P(Lₙ₋₁)` for answer `i+1`:

```python
p = p_know_initial  # loaded from bkt_state row

for answer in quiz_results:
    # Step 1: posterior
    if answer["correct"]:
        numerator   = p * (1 - p_slip)
        denominator = numerator + (1 - p) * p_guess
    else:
        numerator   = p * p_slip
        denominator = numerator + (1 - p) * (1 - p_guess)

    p_posterior = numerator / denominator  # Bayesian update

    # Step 2: transit
    p = p_posterior + (1 - p_posterior) * p_transit  # final p_know for this step

p_know_final = p  # write back to bkt_state
```

---

### 1.4 Mastery Classification

```
p_know ≥ 0.85          → mastered
0.50 ≤ p_know < 0.85   → learning
0.00 < p_know < 0.50   → struggling
attempts == 0           → untouched
```

---

### 1.5 Worked Example

Topic: `linked_lists`. Prior `p_know = 0.35`, defaults `P(T)=0.10, P(S)=0.10, P(G)=0.20`.

| # | Correct? | p_posterior | p_know (after transit) |
|---|---|---|---|
| 1 | ✗ | `0.35×0.10 / (0.035 + 0.65×0.80)` = **0.063** | `0.063 + 0.937×0.10` = **0.157** |
| 2 | ✓ | `0.157×0.90 / (0.141 + 0.843×0.20)` = **0.457** | `0.457 + 0.543×0.10` = **0.511** |
| 3 | ✓ | `0.511×0.90 / (0.460 + 0.489×0.20)` = **0.708** | `0.708 + 0.292×0.10` = **0.737** |

After 3 answers (2 correct, 1 wrong), `linked_lists` moves from `struggling` → `learning (73.7%)`.

---

## 2. Knowledge Graph — Node & Edge Structure

### 2.1 Node Schema (from `public.topics` + BKT overlay)

```
Node {
  id            : topic_id text          -- "linked_lists"
  name          : text                   -- "Linked Lists"
  category      : text                   -- "Data Structures"
  difficulty    : text                   -- "medium"
  prerequisites : text[]                 -- ["pointers", "memory_allocation"]
  
  -- BKT overlay (joined at query time, not stored in topics)
  p_know        : float                  -- 0.737
  mastery_level : text                   -- "learning"
  attempts      : int                    -- 3
  last_updated  : timestamptz
}
```

### 2.2 Edge Schema (`public.kg_edges`)

Edges are **directed**: `from_topic` must be mastered/understood before `to_topic` is recommended.

```
Edge {
  from_topic : text    -- "pointers"          (prerequisite)
  to_topic   : text    -- "linked_lists"      (dependent)
  weight     : float   -- 1.0                 (dependency strength, 0–1)
}
```

**Example graph segment:**
```
memory_allocation ──1.0──► pointers ──1.0──► linked_lists ──0.8──► trees
binary_math ──────0.6──────────────────────────────────────────────► trees
logic_gates ──────1.0──► cpu_architecture
```

### 2.3 "Unlocked" Topic Logic

A topic is **unlocked** (eligible to recommend) when:
- All prerequisite topics have `p_know ≥ 0.50` (learning threshold), OR
- The topic has no prerequisites

A topic is **next_recommended** when:
- It is unlocked
- Its own `p_know < 0.85` (not yet mastered)
- Sorted by: ascending `p_know` first among unlocked (reinforce weak first), then by shortest prerequisite chain

---

## 3. Supabase Postgres — Connection & Query Structure

### 3.1 Tables Involved

```
public.topics          ← global topic catalogue (read-only)
public.kg_edges        ← global prerequisite graph (read-only to users)
public.bkt_state       ← per-user mastery state (RLS: own rows)
public.quiz_events     ← per-answer event log   (RLS: own rows)
```

### 3.2 Key Queries

**Upsert BKT state after quiz (Python, supabase-py):**
```python
db.table("bkt_state").upsert({
    "user_id":      user_id,
    "topic_id":     topic_id,
    "p_know":       p_know_final,
    "p_transit":    p_transit,
    "p_slip":       p_slip,
    "p_guess":      p_guess,
    "attempts":     new_attempts,
    "mastery_level": classify_mastery(p_know_final),
    "last_updated": "now()"
}, on_conflict="user_id,topic_id").execute()
```

**Bulk insert quiz events:**
```python
events = [
    {
        "user_id":       user_id,
        "topic_id":      topic_id,
        "question":      r["question"],
        "correct":       r["correct"],
        "time_taken_ms": r["time_taken_ms"],
        "p_know_before": p_before,
        "p_know_after":  p_after_this_step
    }
    for r, p_before, p_after_this_step in zip(results, p_befores, p_afters)
]
db.table("quiz_events").insert(events).execute()
```

**Graph + BKT overlay (single join query via RPC or two queries):**
```python
# 1. All edges
edges = db.table("kg_edges").select("from_topic, to_topic, weight").execute().data

# 2. User's BKT state (all topics)
bkt = db.table("bkt_state")\
        .select("topic_id, p_know, mastery_level, attempts")\
        .eq("user_id", user_id).execute().data

# 3. Topic metadata
topics = db.table("topics").select("topic_id, name, category, difficulty_level, prerequisites").execute().data

# Merge in Python: topics dict + bkt dict keyed by topic_id
bkt_map = {row["topic_id"]: row for row in bkt}
nodes = [
    {**t, **bkt_map.get(t["topic_id"], {"p_know": 0.0, "mastery_level": "untouched", "attempts": 0})}
    for t in topics
]
```

**Recent wrong answers for common mistake generation:**
```python
wrong = db.table("quiz_events")\
          .select("topic_id, question, correct, created_at")\
          .eq("user_id", user_id)\
          .eq("topic_id", topic_id)\
          .eq("correct", False)\
          .order("created_at", desc=True)\
          .limit(10).execute().data
```

### 3.3 Indexes (add to schema)

```sql
create index if not exists idx_bkt_state_user_id     on public.bkt_state(user_id);
create index if not exists idx_bkt_state_mastery      on public.bkt_state(user_id, mastery_level);
create index if not exists idx_quiz_events_user_topic on public.quiz_events(user_id, topic_id, created_at desc);
create index if not exists idx_kg_edges_from          on public.kg_edges(from_topic);
create index if not exists idx_kg_edges_to            on public.kg_edges(to_topic);
```

---

## 4. Full Quiz Completion Request Body

This is what the frontend POSTs to `POST /api/knowledge/{user_id}/quiz-result` immediately after the user finishes a quiz:

```json
{
  "topic_id": "linked_lists",
  "quiz_source": "uploaded_content",
  "source_file_id": "f3a8c291-...",
  "difficulty": "medium",
  "results": [
    {
      "question": "What does a node in a singly linked list contain?",
      "selected_answer": "Data and a pointer to the next node",
      "correct_answer": "Data and a pointer to the next node",
      "correct": true,
      "time_taken_ms": 4200
    },
    {
      "question": "How do you free memory for a node in C?",
      "selected_answer": "*ptr = NULL",
      "correct_answer": "free(ptr)",
      "correct": false,
      "time_taken_ms": 9800
    },
    {
      "question": "What is the time complexity of inserting at the head of a linked list?",
      "selected_answer": "O(n)",
      "correct_answer": "O(1)",
      "correct": false,
      "time_taken_ms": 6100
    },
    {
      "question": "In a doubly linked list, each node has how many pointers?",
      "selected_answer": "2",
      "correct_answer": "2",
      "correct": true,
      "time_taken_ms": 2300
    }
  ]
}
```

### Backend Processing Flow

```
POST /api/knowledge/{user_id}/quiz-result
  │
  ├─ 1. Load bkt_state for (user_id, topic_id) from Supabase
  │      → get current p_know, p_transit, p_slip, p_guess
  │
  ├─ 2. Run batch BKT update (section 1.3)
  │      → record p_know_before / p_know_after per answer
  │
  ├─ 3. Insert quiz_events rows (one per answer)
  │
  ├─ 4. Upsert bkt_state with new p_know + mastery_level
  │
  ├─ 5. Extract wrong answers → call generate_common_mistake()
  │      → Gemini generates one-line mistake summary
  │      → stored in bkt_state.common_mistake (add column)
  │
  └─ 6. Return updated BKT state + common_mistake + next_topics
```

**Response:**
```json
{
  "topic_id": "linked_lists",
  "p_know_before": 0.35,
  "p_know_after": 0.511,
  "mastery_level": "learning",
  "attempts": 7,
  "common_mistake": "Confuses pointer assignment (*ptr = NULL) with memory deallocation (free(ptr)); treats pointer nulling as equivalent to freeing heap memory.",
  "next_topics": ["trees", "stacks_queues"],
  "bkt_state": {
    "p_know": 0.511,
    "p_transit": 0.10,
    "p_slip": 0.10,
    "p_guess": 0.20,
    "mastery_level": "learning"
  }
}
```

---

## 5. Common Mistake Indicator — Generation & Storage

### 5.1 What It Is

A short natural-language description of the **misconception pattern** detected from the user's wrong answers. Generated by calling Gemini on the wrong answers **once** after each quiz, then cached in `bkt_state`.

### 5.2 Generation Prompt

```python
def generate_common_mistake(topic_id: str, wrong_answers: list[dict]) -> str:
    wrong_formatted = "\n".join([
        f"Q: {w['question']}\n  User answered: {w['selected_answer']}\n  Correct: {w['correct_answer']}"
        for w in wrong_answers
    ])
    
    prompt = f"""
A student is learning about "{topic_id}". They got the following questions wrong:

{wrong_formatted}

In ONE sentence (max 20 words), describe the specific conceptual mistake or misconception 
this student likely has. Be precise, not generic. Start with a verb like "Confuses", 
"Misunderstands", "Incorrectly assumes", etc.
"""
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt
    )
    return response.text.strip()
```

**Example outputs:**
- `"Confuses pointer dereferencing (*ptr) with value copying, treating them as identical operations."`
- `"Incorrectly assumes linked list insertion is O(n) regardless of position."`
- `"Misunderstands that NULL assignment does not release heap memory allocated by malloc."`

### 5.3 Storage

Add `common_mistake text` column to `bkt_state`:
```sql
alter table public.bkt_state add column if not exists common_mistake text;
```

Updated on every quiz submission if ≥1 wrong answer exists. `NULL` if user got everything correct.

---

## 6. RAG Prompt — Full Assembly

This is the **complete context block** prepended to every Gemini prompt when `user_id` is provided. Built by `build_gemini_context()` in `app/core/bkt.py`.

### 6.1 Data Retrieved (3 Supabase queries)

```
1. bkt_state WHERE user_id = X               → all topic mastery rows
2. kg_edges                                   → prerequisite graph
3. quiz_events WHERE user_id = X, last 5 rows → recent activity signal
```

### 6.2 Context Block Structure

```
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
```

### 6.3 How It Is Injected Per Endpoint

**`POST /api/generate/quiz` (generate_quiz)**
```
{LEARNING PROFILE BLOCK}

Now generate a {difficulty} quiz on "{topic}" with {n} questions.

Instructions:
- Target questions toward the student's STRUGGLING sub-areas listed above.
- Avoid questions already well-covered by mastered topics (don't re-test what they know).
- One question should specifically probe the listed common misconception for this topic.
- Vary question types: 1 recall, 2 application, 1 analysis, 1 misconception trap.

Format: {JSON format}
```

**`POST /api/explain` (explain)**
```
{LEARNING PROFILE BLOCK}

Explain "{topic}" to this student.

Instructions:
- They have already mastered: [mastered list]. Build on these — use them as analogies.
- They are currently learning: [learning list]. Connect to those if relevant.
- Address this specific misconception directly: "{common_mistake for topic}".
- Go slower on: {struggling topics}. Use concrete examples and visual metaphors.
- Do NOT over-explain concepts they have already mastered.
- End with a 2-question comprehension check targeting their weak area.
```

---

## 7. `bkt_state` Final Column Reference

```sql
create table public.bkt_state (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references public.profiles(id) on delete cascade not null,
  topic_id       text not null,
  p_know         float not null default 0.0,
  p_transit      float not null default 0.10,
  p_slip         float not null default 0.10,
  p_guess        float not null default 0.20,
  attempts       integer not null default 0,
  mastery_level  text not null default 'untouched'
                   check (mastery_level in ('untouched','struggling','learning','mastered')),
  common_mistake text,                           -- AI-generated misconception summary
  last_updated   timestamptz not null default now(),
  unique(user_id, topic_id)
);
```

---

## 8. End-to-End Data Flow Diagram

```
[User finishes quiz]
        │
        ▼
POST /api/knowledge/{user_id}/quiz-result
        │
        ├──► Load bkt_state (Supabase SELECT)
        │
        ├──► Batch BKT update  ← app/core/bkt.py
        │        └── p_know_before[], p_know_after[] per answer
        │
        ├──► INSERT quiz_events  (one row per answer)
        │
        ├──► UPSERT bkt_state   (new p_know, mastery_level)
        │
        ├──► Wrong answers → Gemini → common_mistake string
        │         └── UPDATE bkt_state SET common_mistake = ...
        │
        └──► Return: {p_know_after, mastery_level, common_mistake, next_topics}

[Next: User asks for explanation OR new quiz]
        │
        ▼
GET bkt_state + kg_edges + recent quiz_events  (3 Supabase queries)
        │
        ▼
build_gemini_context() → RAG context block string
        │
        ▼
Gemini prompt = context_block + task_prompt
        │
        ▼
Personalized quiz / explanation targeting actual weak areas
```
