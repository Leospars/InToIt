/**
 * frontend/src/hooks/useBrain.ts  v2
 *
 * Complete knowledge graph hook.
 * Covers all three layers + BKT scores + mistake pattern tracking.
 *
 * Drop-in usage:
 *   const brain = useBrain()
 *
 *   // On every question answer:
 *   const intervention = await brain.logAnswer({
 *     questionRef: "q:12",
 *     conceptSlug: "retrieval-chunking",
 *     isCorrect: false,
 *     difficulty: 3,
 *     wrongAnswer: "cosine similarity is not symmetric",  // ← key for mistake tracking
 *     mistakeType: "confuses_concepts",                   // ← optional classification
 *   })
 *   // intervention is non-null when BKT triggers — show InterventionCard
 *   // brain.activeCourseOutline is auto-fetched on wrong answers
 *
 *   // On content view:
 *   await brain.logView("lesson:3", "prompt-chaining")
 *
 *   // Force intervention for any concept:
 *   const result = await brain.generate("rag-basics")
 *
 *   // For D3 Atlas mastery coloring:
 *   const score = brain.getBKT("vector-similarity")  // 0-1
 */

import { useState, useCallback, useEffect, useRef } from "react"
import { useAuth } from "../context/auth-context"

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

// ── Types ─────────────────────────────────────────────────────

export type MasteryStatus =
  | "unseen" | "exposed" | "fragile" | "developing" | "mastered" | "needs_review"

export type WeaknessType =
  | "repeated_failure" | "exposure_without_mastery" | "prerequisite_gap"
  | "decay" | "mistake_pattern" | "inconsistent"

export type MistakeType =
  | "confuses_concepts" | "applies_wrong_rule" | "misses_edge_case"
  | "syntax_error" | "prerequisite_gap" | "recall_failure"

export interface ConceptState {
  concept_id:        string
  mastery_status:    MasteryStatus
  mastery_score:     number
  bkt_p_know:        number       // BKT probability of knowledge (0-1)
  accuracy:          number | null
  attempts:          number
  correct:           number
  views:             number
  consecutive_correct: number
  consecutive_wrong:   number
  sm2_interval:      number
  next_review_at:    string | null
  concepts: {
    slug:       string
    name:       string
    difficulty: number
    track:      string
  }
}

export interface MistakePattern {
  id:              string
  concept_id:      string
  mistake_type:    MistakeType
  description:     string
  occurrence_count: number
  last_seen_at:    string
  confused_with?:  string
  concepts: { slug: string; name: string }
}

export interface LearnerProfile {
  user_id:          string
  mastered:         Array<{ slug: string; name: string; bkt: number }> | null
  struggling:       Array<{
    slug: string; name: string; bkt: number; accuracy: number
    status: string; attempts: number; consec_wrong: number
  }> | null
  active_mistakes:  Array<{
    concept: string; concept_slug: string; mistake_type: string
    description: string; count: number; confused_with?: string
  }> | null
  recent_wrong:     Array<{
    content_ref: string; concept: string; concept_slug: string
    wrong_answer?: string; difficulty?: number
  }> | null
  review_due:       Array<{ slug: string; name: string; due_at: string; last_bkt: number }> | null
  active_weaknesses: Array<{
    slug: string; name: string; type: WeaknessType; severity: string; evidence: unknown
  }> | null
  not_started:      Array<{ slug: string; name: string; track: string; difficulty: number }> | null
}

export interface AiQuestion {
  text:   string
  hint:   string
  answer: string
}

export interface Intervention {
  slide_title:       string
  slide_body:        string
  slide_analogy:     string
  eli5:              string
  easy_question:     AiQuestion
  hard_question:     AiQuestion
  youtube_query:     string
  prereq_to_review:  string | null
  justification:     string
  videos:            Video[]
}

export interface QuizQuestion {
  question:         string
  options:          string[]
  correct_index:    number
  explanation:      string
  concept_slug:     string
  difficulty:       number
  addresses_mistake?: string | null
}

export interface CourseLesson {
  step:              number
  title:             string
  description:       string
  content_type:      string
  concept_slug:      string
  estimated_minutes: number
  is_prerequisite:   boolean
  targets_mistake?:  string | null
}

export interface CourseOutline {
  title:                    string
  why_struggling:           string
  prerequisites_to_review:  Array<{ slug: string; name: string; why: string; estimated_minutes: number }>
  lessons:                  CourseLesson[]
  success_criteria:         string
  estimated_total_minutes:  number
  youtube_query:            string
  videos:                   Video[]
}

export interface Video {
  id:        string
  title:     string
  channel:   string
  thumbnail: string
  embed_url: string
  watch_url: string
}

export interface GraphData {
  nodes: Array<{
    id:       string
    data:     { label: string; slug: string; difficulty: number; track: string }
    position: { x: number; y: number }
  }>
  edges: Array<{
    id:     string
    source: string
    target: string
    type:   string
    label:  string
  }>
}

export interface LogAnswerParams {
  questionRef:  string
  conceptSlug:  string
  isCorrect:    boolean
  difficulty?:  number
  wrongAnswer?: string        // ← key for mistake pattern tracking
  mistakeType?: MistakeType   // ← optional classification
}

// ── Safe fetch ────────────────────────────────────────────────

async function call<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res  = await fetch(`${API}${path}`, { ...options, headers })
  const text = await res.text()

  if (!text.trim()) throw new Error(`Empty response (HTTP ${res.status}) from ${path}`)

  let data: unknown
  try { data = JSON.parse(text) }
  catch { throw new Error(`Bad JSON from ${path}: ${text.slice(0, 120)}`) }

  if (!res.ok) {
    const msg = (data as Record<string, unknown>)?.detail
    throw new Error(typeof msg === "string" ? msg : `Request failed (${res.status})`)
  }
  return data as T
}

// ── Offline event queue ───────────────────────────────────────
// Events queued while offline are flushed when connection restores

interface QueuedEvent {
  path:    string
  body:    unknown
  queued_at: number
}

function getQueue(): QueuedEvent[] {
  try { return JSON.parse(localStorage.getItem("brain_queue") || "[]") }
  catch { return [] }
}
function saveQueue(q: QueuedEvent[]) {
  try { localStorage.setItem("brain_queue", JSON.stringify(q.slice(-50))) }
  catch {}
}

// ── Main hook ─────────────────────────────────────────────────

export function useBrain() {
  const { session } = useAuth()
  const token = session?.access_token

  const [profile, setProfile]                   = useState<LearnerProfile | null>(null)
  const [conceptStates, setConceptStates]       = useState<ConceptState[]>([])
  const [mistakes, setMistakes]                 = useState<MistakePattern[]>([])
  const [graphData, setGraphData]               = useState<GraphData | null>(null)
  const [activeIntervention, setActiveIntervention] = useState<Intervention | null>(null)
  const [activeCourseOutline, setActiveCourseOutline] = useState<CourseOutline | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const flushingRef = useRef(false)

  // ── Offline queue flush ─────────────────────────────────────
  const flushQueue = useCallback(async () => {
    if (!token || flushingRef.current) return
    const q = getQueue()
    if (q.length === 0) return
    flushingRef.current = true
    const remaining: QueuedEvent[] = []
    for (const ev of q) {
      try {
        await call(ev.path, { method: "POST", body: JSON.stringify(ev.body) }, token)
      } catch {
        remaining.push(ev)
      }
    }
    saveQueue(remaining)
    flushingRef.current = false
  }, [token])

  useEffect(() => {
    const handler = () => flushQueue()
    window.addEventListener("online", handler)
    return () => window.removeEventListener("online", handler)
  }, [flushQueue])

  // ── Load state ──────────────────────────────────────────────

  const loadState = useCallback(async () => {
    if (!token) return
    try {
      const [p, c, m] = await Promise.all([
        call<LearnerProfile>("/brain/state", {}, token),
        call<ConceptState[]>("/brain/state/concepts", {}, token),
        call<MistakePattern[]>("/brain/mistakes", {}, token),
      ])
      setProfile(p)
      setConceptStates(c)
      setMistakes(m)
    } catch (e) {
      console.warn("[brain] loadState:", (e as Error).message)
    }
  }, [token])

  const loadGraph = useCallback(async () => {
    try {
      const g = await call<GraphData>("/brain/graph")
      setGraphData(g)
      return g
    } catch (e) {
      console.warn("[brain] loadGraph:", (e as Error).message)
      return null
    }
  }, [])

  // ── Session ─────────────────────────────────────────────────

  const startSession = useCallback(async (type: string, focusSlug?: string) => {
    if (!token) return null
    try {
      const r = await call<{ session_id: string; recommendations: unknown[] }>(
        "/brain/session/start",
        { method: "POST", body: JSON.stringify({ session_type: type, focus_concept_slug: focusSlug }) },
        token,
      )
      setCurrentSessionId(r.session_id)
      return r
    } catch (e) {
      console.warn("[brain] startSession:", (e as Error).message)
      return null
    }
  }, [token])

  const endSession = useCallback(async (sessionId?: string) => {
    const sid = sessionId || currentSessionId
    if (!token || !sid) return
    try {
      await call(`/brain/session/end?session_id=${sid}`, { method: "POST" }, token)
      setCurrentSessionId(null)
      await loadState()
    } catch (e) {
      console.warn("[brain] endSession:", (e as Error).message)
    }
  }, [token, currentSessionId, loadState])

  // ── Event logging ────────────────────────────────────────────

  const _enqueue = (path: string, body: unknown) => {
    const q = getQueue()
    q.push({ path, body, queued_at: Date.now() })
    saveQueue(q)
  }

  /**
   * Log any learning event.
   * Returns Intervention if BKT triggers an AI response.
   */
  const logEvent = useCallback(async (payload: {
    event_type:   string
    concept_slug?: string
    content_ref?:  string
    is_correct?:   boolean
    score?:        number
    duration_sec?: number
    difficulty?:   number
    confidence?:   number
    wrong_answer?: string
    mistake_type?: string
    metadata?:     Record<string, unknown>
  }): Promise<Intervention | null> => {
    if (!token) {
      _enqueue("/brain/event", { ...payload, session_id: currentSessionId })
      return null
    }

    try {
      const r = await call<{ logged: boolean; intervention: Intervention | null }>(
        "/brain/event",
        { method: "POST", body: JSON.stringify({ ...payload, session_id: currentSessionId }) },
        token,
      )
      if (r.intervention) setActiveIntervention(r.intervention)
      // Async refresh — don't await to avoid blocking
      loadState().catch(console.warn)
      return r.intervention
    } catch (e) {
      // Queue for retry if offline
      _enqueue("/brain/event", { ...payload, session_id: currentSessionId })
      console.warn("[brain] logEvent (queued):", (e as Error).message)
      return null
    }
  }, [token, currentSessionId, loadState])

  /**
   * Log a question answer with full mistake context.
   * Key improvement: passes wrongAnswer text for mistake pattern tracking.
   * Auto-fetches course outline in the background on wrong answers.
   */
  const logAnswer = useCallback(async (params: LogAnswerParams): Promise<Intervention | null> => {
    const intervention = await logEvent({
      event_type:   "question_answered",
      concept_slug: params.conceptSlug,
      content_ref:  params.questionRef,
      is_correct:   params.isCorrect,
      ...(params.difficulty !== undefined && { difficulty: params.difficulty }),
      ...(params.wrongAnswer !== undefined && { wrong_answer: params.wrongAnswer }),
      ...(params.mistakeType !== undefined && { mistake_type: params.mistakeType }),
    })

    // Auto-fetch course outline on wrong answer (non-blocking)
    if (!params.isCorrect) {
      getCourseOutline(params.conceptSlug, params.questionRef).catch(console.warn)
    }

    return intervention
  }, [logEvent])

  const logView = useCallback(async (contentRef: string, conceptSlug: string) => {
    await logEvent({
      event_type:   "content_viewed",
      concept_slug: conceptSlug,
      content_ref:  contentRef,
    })
  }, [logEvent])

  // ── AI generation ────────────────────────────────────────────

  /**
   * Force an AI intervention for a concept.
   * Builds full RAG context from KG before calling Gemini.
   */
  const generate = useCallback(async (
    conceptSlug: string,
    trigger = "manual",
  ): Promise<Intervention | null> => {
    if (!token) return null
    setLoading(true); setError(null)
    try {
      const r = await call<Intervention>(
        "/brain/generate",
        { method: "POST", body: JSON.stringify({ concept_slug: conceptSlug, trigger }) },
        token,
      )
      setActiveIntervention(r)
      return r
    } catch (e) {
      setError((e as Error).message)
      return null
    } finally {
      setLoading(false)
    }
  }, [token])

  /**
   * Get an adaptive quiz question.
   * Pass type='bkt_adaptive' to auto-set difficulty from BKT score.
   */
  const getQuestion = useCallback(async (
    conceptSlug:  string,
    difficulty  = 3,
    type: "normal" | "hard" | "eli5" | "bkt_adaptive" = "bkt_adaptive",
  ): Promise<QuizQuestion | null> => {
    if (!token) return null
    try {
      return await call<QuizQuestion>(
        "/brain/quiz/question",
        { method: "POST", body: JSON.stringify({ concept_slug: conceptSlug, difficulty, question_type: type }) },
        token,
      )
    } catch (e) {
      console.warn("[brain] getQuestion:", (e as Error).message)
      return null
    }
  }, [token])

  /**
   * Get personalized course outline.
   * Auto-called when user gets a question wrong.
   * Pass wrongQuestionRef for context-aware "why you're stuck" explanation.
   */
  const getCourseOutline = useCallback(async (
    conceptSlug: string,
    wrongQuestionRef?: string,
  ): Promise<CourseOutline | null> => {
    if (!token) return null
    try {
      const r = await call<CourseOutline>(
        "/brain/course-outline",
        { method: "POST", body: JSON.stringify({ concept_slug: conceptSlug, wrong_question_ref: wrongQuestionRef }) },
        token,
      )
      setActiveCourseOutline(r)
      return r
    } catch (e) {
      console.warn("[brain] getCourseOutline:", (e as Error).message)
      return null
    }
  }, [token])

  const getConceptFeed = useCallback(async (conceptSlug: string, n = 10): Promise<Video[]> => {
    try {
      const r = await call<{ videos: Video[] }>(`/brain/feed/${conceptSlug}?max_results=${n}`)
      return r.videos
    } catch { return [] }
  }, [])

  // ── Helpers ──────────────────────────────────────────────────

  /** BKT probability of knowledge for a concept (0-1) */
  const getBKT = useCallback((slug: string): number => {
    return conceptStates.find(s => s.concepts?.slug === slug)?.bkt_p_know ?? 0
  }, [conceptStates])

  /** Mastery status string */
  const getMastery = useCallback((slug: string): MasteryStatus => {
    return conceptStates.find(s => s.concepts?.slug === slug)?.mastery_status ?? "unseen"
  }, [conceptStates])

  /** 0-1 mastery score */
  const getMasteryScore = useCallback((slug: string): number => {
    return conceptStates.find(s => s.concepts?.slug === slug)?.mastery_score ?? 0
  }, [conceptStates])

  /** True if user has active unresolved weaknesses for this concept */
  const isWeak = useCallback((slug: string): boolean => {
    return (profile?.active_weaknesses ?? []).some(w => w.slug === slug)
  }, [profile])

  /** Consecutive wrong answers for a concept — drives UI urgency */
  const getConsecWrong = useCallback((slug: string): number => {
    return conceptStates.find(s => s.concepts?.slug === slug)?.consecutive_wrong ?? 0
  }, [conceptStates])

  /** Active mistake patterns for a concept */
  const getMistakes = useCallback((slug: string): MistakePattern[] => {
    return mistakes.filter(m => m.concepts?.slug === slug)
  }, [mistakes])

  // Auto-load on mount + flush offline queue
  useEffect(() => {
    if (token) {
      loadState()
      flushQueue()
    }
  }, [token, loadState, flushQueue])

  return {
    // State
    profile,
    conceptStates,
    mistakes,
    graphData,
    activeIntervention,
    activeCourseOutline,
    currentSessionId,
    loading,
    error,

    // Derived shortcuts
    mastered:    profile?.mastered          ?? [],
    struggling:  profile?.struggling        ?? [],
    weaknesses:  profile?.active_weaknesses ?? [],
    recentWrong: profile?.recent_wrong      ?? [],
    reviewDue:   profile?.review_due        ?? [],
    notStarted:  profile?.not_started       ?? [],
    allMistakes: profile?.active_mistakes   ?? [],

    // Session
    startSession,
    endSession,

    // Logging
    logEvent,
    logAnswer,
    logView,

    // AI
    generate,
    getQuestion,
    getCourseOutline,
    getConceptFeed,

    // Graph
    loadState,
    loadGraph,

    // Helpers
    getBKT,
    getMastery,
    getMasteryScore,
    isWeak,
    getConsecWrong,
    getMistakes,

    // Setters
    setActiveIntervention,
    setActiveCourseOutline,
  }
}