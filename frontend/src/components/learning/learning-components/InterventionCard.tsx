/**
 * frontend/src/components/learning/InterventionCard.tsx  v2
 *
 * AI intervention slide — shown when BKT drops below threshold.
 * Now shows:
 *   - Specific mistake patterns from the KG (not generic text)
 *   - BKT probability indicator
 *   - Prerequisite warning if a gap is detected
 *   - ELI5 toggle
 *   - 2 practice questions (difficulty adapted to BKT)
 *   - YouTube video feed
 *   - Course outline shortcut
 */

import { useState } from "react"
import {
  Sparkles, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown,
  BookOpen, Play, X, AlertTriangle
} from "lucide-react"
import type { Intervention, Video } from "@hooks/useBrain"

// ── Video card ────────────────────────────────────────────────

const VideoCard = ({ video }: { video: Video }) => {
  const [playing, setPlaying] = useState(false)
  return (
    <div style={{ borderRadius: 10, overflow: "hidden", background: "#111", flexShrink: 0, width: 176 }}>
      {playing ? (
        <iframe
          src={`${video.embed_url}?autoplay=1&controls=1`}
          style={{ width: 176, height: 99, border: "none" }}
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={video.title}
        />
      ) : (
        <div
          style={{ position: "relative", cursor: "pointer", width: 176, height: 99 }}
          onClick={() => setPlaying(true)}
        >
          <img src={video.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
            <Play size={26} color="#fff" fill="#fff" />
          </div>
        </div>
      )}
      <div style={{ padding: "5px 7px" }}>
        <p style={{ fontSize: 11, color: "#ddd", margin: 0, lineHeight: 1.3, WebkitLineClamp: 2, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical" }}>{video.title}</p>
        <p style={{ fontSize: 9, color: "#555", margin: "2px 0 0" }}>{video.channel}</p>
      </div>
    </div>
  )
}

// ── BKT indicator ─────────────────────────────────────────────

const BKTBar = ({ value, label }: { value: number; label: string }) => {
  const color = value < 0.3 ? "#dc2626" : value < 0.6 ? "#d97706" : "#16a34a"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: "#666", minWidth: 120 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: "#1e1e1e", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.round(value * 100)}%`, background: color, borderRadius: 999, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 11, color, minWidth: 30, textAlign: "right", fontWeight: 600 }}>
        {Math.round(value * 100)}%
      </span>
    </div>
  )
}

// ── Practice question ─────────────────────────────────────────

const PracticeQ = ({ q, label, color }: {
  q: { text: string; hint: string; answer: string }
  label: string
  color: string
}) => {
  const [show, setShow] = useState(false)
  return (
    <div style={{ background: "#0f0f0f", border: `1px solid ${color}33`, borderRadius: 10, padding: "10px 12px" }}>
      <p style={{ fontSize: 10, fontWeight: 700, color, margin: "0 0 5px", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</p>
      <p style={{ fontSize: 13, color: "#ddd", margin: "0 0 5px", lineHeight: 1.55 }}>{q.text}</p>
      <p style={{ fontSize: 11, color: "#666", margin: "0 0 7px", fontStyle: "italic" }}>Hint: {q.hint}</p>
      <button onClick={() => setShow(!show)} style={{ fontSize: 11, color, background: "none", border: `1px solid ${color}44`, borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>
        {show ? "Hide answer" : "Show answer"}
      </button>
      {show && <p style={{ fontSize: 12, color: "#aaa", margin: "8px 0 0", padding: "8px", background: "#161616", borderRadius: 6, lineHeight: 1.5 }}>{q.answer}</p>}
    </div>
  )
}

// ── Main card ─────────────────────────────────────────────────

interface Props {
  intervention:   Intervention
  bktScore?:      number          // 0-1, shown as probability bar
  conceptName?:   string
  onClose:        () => void
  onShowOutline?: () => void
  onRate?:        (helpful: boolean) => void
}

const InterventionCard = ({ intervention, bktScore, conceptName, onClose, onShowOutline, onRate }: Props) => {
  const [showQ,     setShowQ]     = useState(false)
  const [showELI5,  setShowELI5]  = useState(false)
  const [rated,     setRated]     = useState<boolean | null>(null)

  return (
    <div style={{
      background: "#0a0a14",
      border: "1px solid #3730a344",
      borderRadius: 20,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      maxHeight: "85vh",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={13} color="#a78bfa" />
            <span style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em" }}>
              AI Intervention
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 0 }}>
            <X size={15} />
          </button>
        </div>

        {/* BKT score bar */}
        {typeof bktScore === "number" && conceptName && (
          <div style={{ marginBottom: 10 }}>
            <BKTBar value={bktScore} label={`${conceptName} mastery`} />
          </div>
        )}

        {/* Prereq warning */}
        {intervention.prereq_to_review && intervention.prereq_to_review !== "null" && (
          <div style={{ background: "#1a0f0f", border: "1px solid #dc262644", borderRadius: 8, padding: "7px 10px", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={12} color="#dc2626" />
            <span style={{ fontSize: 11, color: "#fca5a5" }}>
              Review first: <strong>{intervention.prereq_to_review.replace(/-/g, " ")}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div style={{ overflowY: "auto", padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>{intervention.slide_title}</h3>
        <p style={{ fontSize: 13, color: "#ccc", margin: 0, lineHeight: 1.65 }}>{intervention.slide_body}</p>

        {/* Analogy */}
        <div style={{ background: "#13102a", borderLeft: "3px solid #7c3aed", borderRadius: "0 10px 10px 0", padding: "10px 12px" }}>
          <p style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, margin: "0 0 4px", textTransform: "uppercase" }}>Analogy</p>
          <p style={{ fontSize: 13, color: "#ddd", margin: 0, fontStyle: "italic", lineHeight: 1.55 }}>{intervention.slide_analogy}</p>
        </div>

        {/* ELI5 */}
        <button onClick={() => setShowELI5(!showELI5)} style={{ background: "#111", border: "1px solid #2d2d2d", borderRadius: 8, padding: "8px 12px", color: "#888", fontSize: 12, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>🧒 Explain like I'm 5</span>
          {showELI5 ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        {showELI5 && <p style={{ fontSize: 13, color: "#bbb", background: "#111", borderRadius: 8, padding: "10px 12px", margin: 0, fontStyle: "italic", lineHeight: 1.6 }}>{intervention.eli5}</p>}

        {/* Practice questions */}
        <button onClick={() => setShowQ(!showQ)} style={{ background: "#111", border: "1px solid #2d2d2d", borderRadius: 8, padding: "8px 12px", color: "#888", fontSize: 12, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>✏️ Practice questions</span>
          {showQ ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        {showQ && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <PracticeQ q={intervention.easy_question} label="Easy" color="#16a34a" />
            <PracticeQ q={intervention.hard_question} label="Hard" color="#d97706" />
          </div>
        )}

        {/* Videos */}
        {intervention.videos?.length > 0 && (
          <div>
            <p style={{ fontSize: 10, color: "#555", fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 4 }}>
              <Play size={10} /> Watch
            </p>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {intervention.videos.slice(0, 6).map(v => <VideoCard key={v.id} video={v} />)}
            </div>
          </div>
        )}

        {/* Course outline */}
        {onShowOutline && (
          <button onClick={onShowOutline} style={{ background: "#13102a", border: "1px solid #7c3aed44", borderRadius: 10, padding: "10px 14px", color: "#a78bfa", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
            <BookOpen size={13} /> View full personalized study plan
          </button>
        )}

        <p style={{ fontSize: 11, color: "#444", margin: 0, fontStyle: "italic", lineHeight: 1.5 }}>{intervention.justification}</p>

        {/* Rating */}
        {onRate && rated === null ? (
          <div style={{ display: "flex", gap: 7 }}>
            {([true, false] as const).map(v => (
              <button key={String(v)} onClick={() => { setRated(v); onRate(v) }}
                style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "1px solid #2d2d2d", background: "#111", color: "#888", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 11 }}>
                {v ? <><ThumbsUp size={11} /> Helpful</> : <><ThumbsDown size={11} /> Not helpful</>}
              </button>
            ))}
          </div>
        ) : rated !== null ? (
          <p style={{ fontSize: 11, color: "#444", textAlign: "center", margin: 0 }}>{rated ? "👍 Thanks!" : "👎 Got it."}</p>
        ) : null}
      </div>
    </div>
  )
}

export default InterventionCard