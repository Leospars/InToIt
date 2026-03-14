# INTOIT Learning — AI Agent Intelligence Platform

> **59 core concepts · 67+ agent patterns · 6 neuro-learning paradigms · Adaptive quizzing · Spaced repetition · The Forge · BYOK — your keys, your data**

---

## Quick Start

```bash
# Clone
git clone https://github.com/your-org/intoit-learning
cd intoit-learning

# Frontend
cd frontend
npm install
npm run dev        # http://localhost:5173

# Backend (separate terminal)
cd ../backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in Supabase + Anthropic keys
uvicorn app.main:app --reload  # http://localhost:8000
```

Open the app → **Settings (⚙)** → **LLM Providers** → paste your API key → click **Use**.

---

## Architecture

```
intoit-learning/
├── frontend/                    # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx              # Root layout + navigation
│   │   ├── components/
│   │   │   ├── settings/        # SettingsSheet (all providers)
│   │   │   ├── learning/
│   │   │   │   ├── tracks/      # 6 learning tracks + capsule runner
│   │   │   │   └── flashcards/  # SM-2 spaced repetition cards
│   │   │   ├── quiz/            # Adaptive quiz engine
│   │   │   ├── forge/           # 4 assessment disciplines
│   │   │   ├── lab/             # 6 neuro-learning paradigms
│   │   │   ├── atlas/           # D3 learning atlas
│   │   │   └── visualization/   # React Flow agent patterns
│   │   ├── hooks/
│   │   │   ├── useVoiceInput.ts # Web Speech + cloud STT
│   │   │   └── useSearchGrounding.ts  # 13 search providers
│   │   ├── lib/
│   │   │   ├── llmClient.ts     # Unified LLM caller (15+ providers)
│   │   │   ├── providers.ts     # Provider defaults + groups
│   │   │   ├── idb.ts           # IndexedDB (offline cards)
│   │   │   └── utils.ts         # SM-2, helpers, theme
│   │   ├── store/index.ts       # Zustand + localStorage BYOK
│   │   └── types/index.ts       # All TypeScript types
│   ├── public/
│   │   ├── sw.js                # Service worker (PWA)
│   │   ├── offline.html         # Offline fallback
│   │   └── staticwebapp.config.json  # Azure SWA config
│   ├── vite.config.ts           # PWA, chunking, proxy
│   └── tailwind.config.ts       # Design tokens
│
├── backend/                     # Python 3.12 + FastAPI
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── core/config.py       # pydantic-settings
│   │   ├── db/supabase.py       # Supabase client
│   │   └── api/routes/
│   │       ├── auth.py          # JWT verification
│   │       ├── progress.py      # User progress CRUD
│   │       ├── search.py        # 6 search provider proxies
│   │       ├── proxy.py         # Server-side LLM proxy
│   │       └── voice.py         # STT/TTS proxies
│   ├── supabase_schema.sql      # Complete DB schema
│   └── requirements.txt
│
├── .github/workflows/ci.yml     # GitHub Actions CI/CD
├── vercel.json                  # Vercel deployment
└── README.md
```

---

## LLM Providers (15+)

| Group | Providers |
|-------|-----------|
| **Cloud — Western** | Anthropic Claude, OpenAI, Azure OpenAI, Google Gemini, Hugging Face, OpenRouter, Custom |
| **Local (no key)** | Ollama (`localhost:11434`), LM Studio (`localhost:1234`) |
| **China** | DeepSeek, Zhipu AI (GLM), Alibaba Qwen, Moonshot AI, Volcano Engine |
| **Europe** | Mistral AI |
| **India** | Sarvam AI, BharatGen |

> **Security**: All API keys stored in `localStorage` only. Zero server access. BYOK by design.

---

## Speech Services

| Type | Providers |
|------|-----------|
| **STT** | Web Speech API (free), Whisper WASM (offline), OpenAI Whisper, Azure Speech, Deepgram, Google STT, AWS Transcribe |
| **TTS** | Browser TTS (free), OpenAI TTS, OpenAI Audio (translate+speak), Azure Speech, ElevenLabs, Google TTS, AWS Polly |

---

## Search Grounding (13 providers)

Tavily · Exa · You.com · Brave · Google · Bing · SerpAPI · Kagi · Mojeek · Yandex · Baidu · Naver · SearXNG (self-hosted)

---

## Features

### Learning
- **6 tracks**: Foundations → Architecture → Protocols → Production → Advanced → Applied
- **5-stage capsules**: Learn → Quiz → Apply → Reflect → Expand
- **Adaptive difficulty**: Questions get harder/easier based on performance (SM-2 + consecutive answer tracking)
- **Spaced repetition**: SM-2 algorithm schedules card reviews
- **8 exploration modes**: Explain simply, quiz, expand, debate, research, analogies, code, custom
- **59 concepts**, **67+ agent patterns** with React Flow visualizations

### Gamification
- XP, levels (50 levels), daily streaks, mastery badges
- Per-provider XP scaling (harder difficulty = more XP)
- Forge Score + Lab Score as separate achievement tracks

### The Forge
- **Socratic Defense**: LLM examiner probes architecture decisions under Bloom's taxonomy
- **Prompt Autopsy**: Find bugs in flawed AI output (precision/recall scoring)
- **Epistemic Gym**: AI-free timed reasoning challenges
- **Trust Calibration Lab**: Set agent autonomy vs expert consensus

### Neuro Lab (6 paradigms)
- **Burst Grafting**: 400ms multi-sensory encoding
- **Void Mapping**: Negative-space definitions
- **Glitch Resolution**: Cognitive dissonance resolution
- **Ephemeral Sparks**: One-shot decay learning
- **Hemispheric Weaving**: Stereo dual processing (Phase 2)
- **Glyph Cognition**: Symbol-to-meaning recall (Phase 2)
- Full seizure safety gate + `prefers-reduced-motion` support

### Visualizations
- **D3 Learning Atlas**: Radial taxonomy tree, SVG/PNG export
- **React Flow Agent Patterns**: Interactive node diagrams
- **17 themes**: 12 dark + 5 light with CSS variable system

---

## Deployment

### Vercel (recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# From repo root
vercel

# Set env vars in Vercel dashboard:
# SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY
```

### Azure Static Web Apps
```bash
# Install Azure CLI + SWA CLI
npm install -g @azure/static-web-apps-cli

swa deploy frontend/dist \
  --deployment-token $AZURE_SWA_TOKEN \
  --env production
```

### GitHub Actions
Set these secrets in your repo:
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- `AZURE_STATIC_WEB_APPS_API_TOKEN` (if using Azure)

---

## Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run `backend/supabase_schema.sql` in the SQL editor
3. Copy your Project URL and service role key to `.env`

---

## Environment Variables

### Backend (`backend/.env`)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...   # optional — only for server proxy
SECRET_KEY=random-64-char-string
```

### Frontend
All keys are BYOK via the Settings panel — no `.env` needed for frontend.
Optionally set `VITE_API_URL` to override the backend URL.

---

## PWA

The app installs as a native PWA on mobile and desktop:
- **Offline**: Content cached via Workbox service worker
- **Background sync**: Progress synced when connection restores
- **Install prompt**: Menu → "Install App"

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + TypeScript + Vite |
| Styling | TailwindCSS 4 + Radix UI |
| State | Zustand + Immer + localStorage |
| Animations | Framer Motion |
| Visualizations | D3.js + React Flow |
| Voice | Web Speech API + Whisper WASM |
| Offline | IndexedDB (idb) + Workbox |
| Backend | Python 3.12 + FastAPI |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| AI | Anthropic SDK + direct fetch for all others |
| Deploy | Vercel + Azure Static Web Apps + GitHub Actions |

---

## License
MIT
