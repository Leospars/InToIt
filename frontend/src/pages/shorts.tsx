/**
 * frontend/src/components/Shorts.tsx
 *
 * TikTok-style vertical reel feed with full YouTube embed playback.
 *
 * Three feed sources:
 *   1. Manual keyword search
 *   2. AI prompt (Gemini generates the best query)
 *   3. Concept feed (auto-loaded from KG when user taps a weak concept
 *      or when an AI intervention fires after wrong answers)
 *
 * Tabs:
 *   Feed     — vertical scroll-snap video reel
 *   Progress — BKT scores, mistake patterns, mastery state
 *
 * Video player:
 *   - Full YouTube iframe embed (not thumbnail preview)
 *   - Autoplay with mute on scroll into view (IntersectionObserver)
 *   - Unmute button
 *   - Title + channel overlay at bottom
 *   - Skeleton shimmer while loading
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo
} from "react"
import {
  Search, Loader, Sparkles, BookOpen, Play, Volume2, VolumeX,
  AlertTriangle, RotateCcw
} from "lucide-react"
import { useBrain, Video, MasteryStatus } from "@hooks/useBrain"

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

// ── Constants ─────────────────────────────────────────────────
const MASTERY_COLOR: Record<MasteryStatus, string> = {
  unseen:       "#444",
  exposed:      "#7c3aed",
  fragile:      "#ef4444",
  developing:   "#f59e0b",
  mastered:     "#22c55e",
  needs_review: "#3b82f6",
}

// ── Safe fetch (never crashes on empty body) ──────────────────
async function safeFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res  = await fetch(url, opts)
  const text = await res.text()
  if (!text.trim()) throw new Error(`Empty response (${res.status})`)
  const data = JSON.parse(text)
  if (!res.ok) throw new Error(data?.detail ?? `HTTP ${res.status}`)
  return data as T
}

// ══════════════════════════════════════════════════════════════
// VIDEO PLAYER — full embed, autoplay on scroll into view
// ══════════════════════════════════════════════════════════════

interface PlayerProps {
  video:   Video
  active:  boolean   // true when this slide is the visible one
  muted:   boolean
  onMuteToggle: () => void
}

const VideoPlayer = ({ video, active, muted, onMuteToggle }: PlayerProps) => {
  const [loaded, setLoaded] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Build the embed URL.
  // autoplay=1 — starts when active
  // mute=1/0   — controlled by parent muted state
  // controls=0 — hide YouTube UI for TikTok feel
  // rel=0      — no related videos at end
  // loop=1 + playlist=VIDEO_ID — loops the single video
  // modestbranding=1 — minimal YouTube branding
  const src = useMemo(() => {
    const p = new URLSearchParams({
      autoplay:        active ? "1" : "0",
      mute:            muted ? "1" : "0",
      controls:        "0",
      rel:             "0",
      loop:            "1",
      playlist:        video.id,
      modestbranding:  "1",
      playsinline:     "1",
      enablejsapi:     "1",
    })
    return `https://www.youtube.com/embed/${video.id}?${p.toString()}`
  }, [video.id, active, muted])

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Shimmer skeleton */}
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, #0f0f0f 25%, #1a1a1a 50%, #0f0f0f 75%)",
          backgroundSize: "200% 100%",
          animation: "kg-shimmer 1.4s ease infinite",
          zIndex: 1,
        }} />
      )}

      {/* YouTube iframe */}
      <iframe
        ref={iframeRef}
        src={src}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "none",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.4s ease",
          background: "#000",
        }}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        onLoad={() => setLoaded(true)}
        title={video.title}
      />

      {/* Bottom overlay — title + controls */}
      {loaded && (
        <div style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          padding: "40px 16px 16px",
          background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
          zIndex: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}>
          <div style={{ flex: 1, marginRight: 12 }}>
            <p style={{
              fontSize: 13, fontWeight: 600, color: "#fff",
              margin: 0, lineHeight: 1.4,
              overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            }}>
              {video.title}
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: "3px 0 0" }}>
              {video.channel}
            </p>
          </div>
          {/* Mute toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); onMuteToggle() }}
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "50%",
              width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            {muted
              ? <VolumeX size={16} color="#fff" />
              : <Volume2 size={16} color="#fff" />
            }
          </button>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// SINGLE REEL SLIDE — full-screen snap item
// ══════════════════════════════════════════════════════════════

interface SlideProps {
  video:        Video
  index:        number
  activeIndex:  number
  globalMuted:  boolean
  onMuteToggle: () => void
}

const ReelSlide = ({ video, index, activeIndex, globalMuted, onMuteToggle }: SlideProps) => {
  const isActive = index === activeIndex
  return (
    <div style={{
      height: "100%",
      width: "100%",
      flexShrink: 0,
      scrollSnapAlign: "start",
      position: "relative",
      background: "#000",
    }}>
      <VideoPlayer
        video={video}
        active={isActive}
        muted={globalMuted}
        onMuteToggle={onMuteToggle}
      />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// REEL FEED — vertical scroll-snap container
// ══════════════════════════════════════════════════════════════

interface FeedProps {
  videos:  Video[]
  loading: boolean
  empty:   React.ReactNode
}

const ReelFeed = ({ videos, loading, empty }: FeedProps) => {
  const containerRef  = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [muted, setMuted]             = useState(true)

  // Track which slide is visible using scroll position
  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const idx = Math.round(el.scrollTop / el.clientHeight)
    setActiveIndex(idx)
  }, [])

  useEffect(() => {
    // Reset to top when videos change
    setActiveIndex(0)
    if (containerRef.current) containerRef.current.scrollTop = 0
  }, [videos])

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
        <Loader size={28} color="#555" style={{ animation: "kg-spin 0.8s linear infinite" }} />
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
        {empty}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        flex: 1,
        overflowY: "scroll",
        scrollSnapType: "y mandatory",
        scrollBehavior: "smooth",
        // Hide scrollbar cross-browser
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <style>{`::-webkit-scrollbar { display: none; }`}</style>
      {videos.map((v, i) => (
        <ReelSlide
          key={v.id}
          video={v}
          index={i}
          activeIndex={activeIndex}
          globalMuted={muted}
          onMuteToggle={() => setMuted(m => !m)}
        />
      ))}

      {/* Scroll indicator dots */}
      {videos.length > 1 && (
        <div style={{
          position: "fixed",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 5,
          zIndex: 10,
          pointerEvents: "none",
        }}>
          {videos.map((_, i) => (
            <div key={i} style={{
              width: 4, height: i === activeIndex ? 16 : 4,
              borderRadius: 999,
              background: i === activeIndex ? "#fff" : "rgba(255,255,255,0.3)",
              transition: "all 0.2s ease",
            }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// PROGRESS TAB — BKT bars, mistake patterns, mastery state
// ══════════════════════════════════════════════════════════════

const BKTBar = ({ value, name }: { value: number; name: string }) => {
  const color = value < 0.3 ? "#ef4444" : value < 0.6 ? "#f59e0b" : "#22c55e"
  const pct   = Math.round(value * 100)
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
      <span style={{ fontSize: 12, color: "#ccc", flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{name}</span>
      <div style={{ width: 80, height: 4, background: "#1e1e1e", borderRadius: 999, overflow: "hidden", flexShrink: 0 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 700, minWidth: 32, textAlign: "right" }}>{pct}%</span>
    </div>
  )
}

const MasteryPill = ({ status }: { status: string }) => {
  const color = MASTERY_COLOR[status as MasteryStatus] ?? "#444"
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
      background: color + "22", color, border: `1px solid ${color}44`,
      textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0,
    }}>
      {status.replace("_", " ")}
    </span>
  )
}

const ProgressPanel = ({ brain, onConceptClick }: {
  brain: ReturnType<typeof useBrain>
  onConceptClick: (slug: string) => void
}) => {
  const { mastered, struggling, reviewDue, notStarted, recentWrong, allMistakes } = brain
  const total = mastered.length + struggling.length + notStarted.length
  const pct   = total > 0 ? Math.round((mastered.length / total) * 100) : 0

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 40px", display: "flex", flexDirection: "column", gap: 20, background: "#0a0a0a" }}>

      {/* Summary */}
      <div style={{ background: "#111", borderRadius: 14, padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>Overall mastery</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>{pct}%</span>
        </div>
        <div style={{ height: 6, background: "#1e1e1e", borderRadius: 999, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #7c3aed, #22c55e)", borderRadius: 999, transition: "width 0.5s ease" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {([
            ["Mastered",  mastered.length,    "#22c55e"],
            ["Struggling",struggling.length,  "#ef4444"],
            ["Mistakes",  allMistakes.length, "#f59e0b"],
            ["Todo",      notStarted.length,  "#555"   ],
          ] as [string, number, string][]).map(([label, count, color]) => (
            <div key={label} style={{ textAlign: "center", background: "#161616", borderRadius: 10, padding: "8px 4px" }}>
              <p style={{ fontSize: 18, fontWeight: 700, color, margin: 0 }}>{count}</p>
              <p style={{ fontSize: 9, color: "#555", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Struggling with BKT probability bars */}
      {struggling.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 5 }}>
            <AlertTriangle size={11} /> Struggling — tap to watch
          </p>
          {struggling.map(c => (
            <button
              key={c.slug}
              onClick={() => onConceptClick(c.slug)}
              style={{ width: "100%", background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "12px 14px", marginBottom: 8, cursor: "pointer", textAlign: "left" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#ddd", fontWeight: 600 }}>{c.name}</span>
                <MasteryPill status={c.status} />
              </div>
              <BKTBar value={c.bkt ?? 0} name="P(Know)" />
              <p style={{ fontSize: 10, color: "#555", margin: "5px 0 0" }}>
                {Math.round((c.accuracy ?? 0) * 100)}% accuracy · {c.attempts} attempts
                {(c.consec_wrong ?? 0) > 0 && ` · ${c.consec_wrong} in a row wrong`}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Mistake patterns */}
      {allMistakes.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>
            Active mistake patterns
          </p>
          {allMistakes.slice(0, 6).map((m, i) => (
            <div key={i} style={{ background: "#110e00", border: "1px solid #f59e0b22", borderRadius: 10, padding: "9px 11px", marginBottom: 7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: "#fbbf24", fontWeight: 600 }}>{m.concept}</span>
                <span style={{ fontSize: 10, color: "#f59e0b", background: "#f59e0b22", borderRadius: 999, padding: "1px 7px" }}>×{m.count}</span>
              </div>
              <p style={{ fontSize: 11, color: "#888", margin: 0, fontStyle: "italic", lineHeight: 1.4 }}>{m.description}</p>
              {m.confused_with && (
                <p style={{ fontSize: 10, color: "#555", margin: "3px 0 0" }}>Confused with: <em>{m.confused_with}</em></p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review due */}
      {reviewDue.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 5 }}>
            <RotateCcw size={11} /> Review due
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {reviewDue.map(c => (
              <button
                key={c.slug}
                onClick={() => onConceptClick(c.slug)}
                style={{ fontSize: 12, color: "#3b82f6", background: "#3b82f618", border: "1px solid #3b82f633", borderRadius: 999, padding: "4px 12px", cursor: "pointer" }}
              >
                {c.name} · {Math.round((c.last_bkt ?? 0) * 100)}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mastered */}
      {mastered.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: "#22c55e", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>Mastered ✓</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {mastered.map(c => (
              <span key={c.slug} style={{ fontSize: 12, color: "#22c55e", background: "#22c55e18", border: "1px solid #22c55e33", borderRadius: 999, padding: "3px 11px" }}>
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent wrong with what they said */}
      {recentWrong.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>Recent mistakes</p>
          {recentWrong.slice(0, 6).map((w, i) => (
            <div key={i} style={{ fontSize: 12, color: "#666", padding: "5px 0", borderBottom: "1px solid #111", lineHeight: 1.4 }}>
              <span style={{ color: "#888" }}>{w.concept || w.content_ref}</span>
              {w.wrong_answer && <span style={{ color: "#555", fontStyle: "italic" }}> — said: "{w.wrong_answer}"</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// ROOT — Shorts component
// ══════════════════════════════════════════════════════════════

type Tab  = "feed" | "progress"
type Mode = "search" | "ai"

const Shorts = () => {
  const brain = useBrain()

  const [tab, setTab]         = useState<Tab>("feed")
  const [mode, setMode]       = useState<Mode>("search")
  const [query, setQuery]     = useState("")
  const [videos, setVideos]   = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [aiQueryUsed, setAiQueryUsed] = useState<string | null>(null)
  const [activeConcept, setActiveConcept] = useState<string | null>(null)

  // When AI intervention fires, auto-load its YouTube query
  useEffect(() => {
    const q = brain.activeIntervention?.youtube_query
    if (!q) return
    setTab("feed")
    loadByQuery(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brain.activeIntervention])

  // ── Fetch helpers ──────────────────────────────────────────

  const loadByQuery = useCallback(async (q: string) => {
    setLoading(true); setError(null); setVideos([])
    try {
      const data = await safeFetch<{ videos: Video[] }>(
        `${API}/api/videos/search?q=${encodeURIComponent(q)}&max_results=12`
      )
      if (!data.videos?.length) throw new Error("No videos found for this query.")
      setVideos(data.videos)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return

    setLoading(true); setError(null); setAiQueryUsed(null); setVideos([])

    try {
      if (mode === "search") {
        await loadByQuery(q)
      } else {
        // AI mode: Gemini generates the optimal search query
        const data = await safeFetch<{ videos: Video[]; search_query?: string }>(
          `${API}/api/videos/ai-search`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: q, max_results: 12 }),
          }
        )
        if (!data.videos?.length) throw new Error("No videos found. Try rephrasing.")
        setVideos(data.videos)
        setAiQueryUsed(data.search_query ?? null)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Tap a weak concept → load its feed AND trigger AI intervention
  const handleConceptClick = useCallback(async (slug: string) => {
    setActiveConcept(slug)
    setTab("feed")
    setLoading(true)
    try {
      const [vids] = await Promise.all([
        brain.getConceptFeed(slug, 12),
        brain.generate(slug, "concept_tap"),  // fires intervention → auto-loads youtube_query
      ])
      setVideos(vids)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [brain])

  const totalAlerts = (brain.weaknesses?.length ?? 0) + (brain.allMistakes?.length ?? 0)

  // ── Empty states ───────────────────────────────────────────

  const emptyState = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "0 32px", textAlign: "center" }}>
      {mode === "ai"
        ? <Sparkles size={32} color="#7c3aed" />
        : <Play size={32} color="#333" />
      }
      <p style={{ fontSize: 14, color: "#555", margin: 0, lineHeight: 1.6 }}>
        {totalAlerts > 0
          ? "Go to Progress and tap a concept to load its video feed"
          : mode === "ai"
            ? "Describe what you want to learn"
            : "Search for a topic above"
        }
      </p>
      {totalAlerts > 0 && (
        <button
          onClick={() => setTab("progress")}
          style={{ fontSize: 12, color: "#7c3aed", background: "#7c3aed18", border: "1px solid #7c3aed44", borderRadius: 999, padding: "6px 16px", cursor: "pointer" }}
        >
          View my weak concepts →
        </button>
      )}
    </div>
  )

  // ── Render ─────────────────────────────────────────────────

  return (
    <>
      {/* Global keyframes — injected once */}
      <style>{`
        @keyframes kg-shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
        @keyframes kg-spin {
          to { transform: rotate(360deg) }
        }
      `}</style>

      <div style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#000",
        overflow: "hidden",
      }}>

        {/* ── Top navigation ── */}
        <div style={{ flexShrink: 0, background: "#0a0a0a", borderBottom: "1px solid #161616", padding: "10px 14px" }}>

          {/* Feed / Progress tabs */}
          <div style={{ display: "flex", gap: 3, background: "#111", borderRadius: 10, padding: 3, marginBottom: 10 }}>
            {(["feed", "progress"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: "7px 0", border: "none", borderRadius: 8,
                  background: tab === t ? (t === "feed" ? "#e11d48" : "#4f46e5") : "transparent",
                  color: tab === t ? "#fff" : "#555",
                  fontSize: 12, fontWeight: tab === t ? 600 : 400,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  transition: "all 0.15s ease",
                }}
              >
                {t === "feed"
                  ? <><Play size={11} style={{ fill: tab === "feed" ? "#fff" : "none" }} /> Reels</>
                  : <>
                      <BookOpen size={11} /> Progress
                      {totalAlerts > 0 && (
                        <span style={{ background: "#ef4444", color: "#fff", fontSize: 9, borderRadius: 999, padding: "1px 5px", marginLeft: 2, fontWeight: 700 }}>
                          {totalAlerts}
                        </span>
                      )}
                    </>
                }
              </button>
            ))}
          </div>

          {/* Search bar (only on feed tab) */}
          {tab === "feed" && (
            <>
              {/* Mode toggle */}
              <div style={{ display: "flex", gap: 3, background: "#111", borderRadius: 8, padding: 3, marginBottom: 8 }}>
                {(["search", "ai"] as Mode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    style={{
                      flex: 1, padding: "5px 0", border: "none", borderRadius: 6,
                      background: mode === m ? (m === "ai" ? "#7c3aed" : "#374151") : "transparent",
                      color: mode === m ? "#fff" : "#555",
                      fontSize: 11, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {m === "ai"
                      ? <><Sparkles size={10} /> Ask AI</>
                      : <><Search size={10} /> Search</>
                    }
                  </button>
                ))}
              </div>

              {/* Search input */}
              <form onSubmit={handleSubmit} style={{ display: "flex", gap: 7 }}>
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={
                    mode === "ai"
                      ? "e.g. explain retrieval augmented generation"
                      : "e.g. RAG tutorial, prompt chaining"
                  }
                  style={{
                    flex: 1, padding: "9px 12px", borderRadius: 9,
                    border: "1px solid #2d2d2d", background: "#111",
                    color: "#fff", fontSize: 13, outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  style={{
                    padding: "9px 14px", borderRadius: 9, border: "none",
                    background: loading || !query.trim()
                      ? "#1e1e1e"
                      : mode === "ai" ? "#7c3aed" : "#e11d48",
                    color: loading || !query.trim() ? "#555" : "#fff",
                    cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                    transition: "background 0.15s ease",
                  }}
                >
                  {loading
                    ? <Loader size={15} style={{ animation: "kg-spin 0.8s linear infinite" }} />
                    : mode === "ai" ? <Sparkles size={15} /> : <Search size={15} />
                  }
                </button>
              </form>

              {/* Status messages */}
              {activeConcept && !error && (
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#7c3aed" }}>
                  Watching: <strong style={{ color: "#a78bfa" }}>{activeConcept.replace(/-/g, " ")}</strong>
                </p>
              )}
              {aiQueryUsed && (
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#555" }}>
                  AI searched: <span style={{ color: "#a78bfa" }}>"{aiQueryUsed}"</span>
                </p>
              )}
              {error && (
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "#ef4444" }}>{error}</p>
              )}
            </>
          )}
        </div>

        {/* ── Body ── */}
        {tab === "progress" ? (
          <ProgressPanel brain={brain} onConceptClick={handleConceptClick} />
        ) : (
          <ReelFeed
            videos={videos}
            loading={loading}
            empty={emptyState}
          />
        )}
      </div>
    </>
  )
}

export default Shorts