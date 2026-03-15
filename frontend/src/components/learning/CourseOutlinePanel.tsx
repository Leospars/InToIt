/**
 * frontend/src/components/learning/CourseOutlinePanel.tsx  v2
 *
 * Personalized study plan panel — auto-shown when user gets a question wrong.
 * Powered by the knowledge graph: shows BKT-derived "why you're stuck",
 * prerequisite gaps, and each lesson targeting a specific mistake pattern.
 */

import { useState } from "react"
import { BookOpen, Clock, CheckCircle, Circle, Play, ChevronRight, X, Target } from "lucide-react"
import type { CourseOutline, Video } from "@hooks/useBrain"

const ICONS: Record<string, string> = { video: "▶", exercise: "✏", reading: "📖", quiz: "❓" }

const VideoThumb = ({ video }: { video: Video }) => {
  const [playing, setPlaying] = useState(false)
  return (
    <div style={{ borderRadius: 8, overflow: "hidden", background: "#111", flexShrink: 0, width: 156 }}>
      {playing ? (
        <iframe src={`${video.embed_url}?autoplay=1&controls=1`} style={{ width: 156, height: 88, border: "none" }} allow="autoplay; encrypted-media" allowFullScreen title={video.title} />
      ) : (
        <div style={{ position: "relative", cursor: "pointer", width: 156, height: 88 }} onClick={() => setPlaying(true)}>
          <img src={video.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)" }}>
            <Play size={22} color="#fff" fill="#fff" />
          </div>
        </div>
      )}
      <div style={{ padding: "4px 6px" }}>
        <p style={{ fontSize: 10, color: "#ddd", margin: 0, lineHeight: 1.3, WebkitLineClamp: 2, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical" }}>{video.title}</p>
      </div>
    </div>
  )
}

interface Props {
  outline:        CourseOutline
  onClose:        () => void
  onStartLesson?: (conceptSlug: string) => void
}

const CourseOutlinePanel = ({ outline, onClose, onStartLesson }: Props) => {
  const [done, setDone] = useState<Set<number>>(new Set())

  const toggle = (step: number) => {
    setDone(prev => {
      const n = new Set(prev)
      n.has(step) ? n.delete(step) : n.add(step)
      return n
    })
  }

  const pct = outline.lessons.length > 0
    ? Math.round((done.size / outline.lessons.length) * 100)
    : 0

  return (
    <div style={{
      background: "#0a0a14",
      border: "1px solid #2d2d2d",
      borderRadius: 20,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      maxHeight: "90vh",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #161616", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <BookOpen size={13} color="#60a5fa" />
            <span style={{ fontSize: 10, color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Study Plan</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 0 }}><X size={15} /></button>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "7px 0 5px" }}>{outline.title}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 5 }}>
          <div style={{ flex: 1, height: 4, background: "#1e1e1e", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "#4f46e5", borderRadius: 999, transition: "width 0.3s" }} />
          </div>
          <span style={{ fontSize: 10, color: "#666" }}>{pct}%</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={10} color="#555" />
          <span style={{ fontSize: 11, color: "#555" }}>{outline.estimated_total_minutes} min</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Why struggling — uses specific KG data */}
        <div style={{ background: "#130f1e", border: "1px solid #7c3aed33", borderRadius: 10, padding: "10px 12px" }}>
          <p style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, margin: "0 0 4px", textTransform: "uppercase" }}>Why you're stuck</p>
          <p style={{ fontSize: 13, color: "#ccc", margin: 0, lineHeight: 1.6 }}>{outline.why_struggling}</p>
        </div>

        {/* Prerequisites */}
        {outline.prerequisites_to_review?.length > 0 && (
          <div>
            <p style={{ fontSize: 11, color: "#dc2626", fontWeight: 700, margin: "0 0 7px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Review these prerequisites first
            </p>
            {outline.prerequisites_to_review.map(p => (
              <div key={p.slug} style={{ background: "#1a0f0f", border: "1px solid #dc262633", borderRadius: 8, padding: "8px 10px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: "#fca5a5", margin: 0, fontWeight: 600 }}>{p.name}</p>
                  <p style={{ fontSize: 11, color: "#888", margin: "2px 0 0" }}>{p.why}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                  <span style={{ fontSize: 10, color: "#555" }}>{p.estimated_minutes}m</span>
                  {onStartLesson && (
                    <button onClick={() => onStartLesson(p.slug)} style={{ background: "#dc262622", border: "1px solid #dc262644", borderRadius: 6, padding: "3px 8px", color: "#fca5a5", fontSize: 11, cursor: "pointer" }}>
                      Start
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lesson steps */}
        <div>
          <p style={{ fontSize: 11, color: "#666", fontWeight: 700, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            {outline.lessons.length} steps
          </p>
          {outline.lessons.map(lesson => {
            const isDone = done.has(lesson.step)
            return (
              <div key={lesson.step} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid #111", opacity: isDone ? 0.45 : 1 }}>
                <button onClick={() => toggle(lesson.step)} style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0, padding: 0, marginTop: 2 }}>
                  {isDone ? <CheckCircle size={15} color="#16a34a" fill="#16a34a" /> : <Circle size={15} color="#333" />}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <p style={{ fontSize: 13, color: isDone ? "#555" : "#ddd", fontWeight: isDone ? 400 : 600, margin: 0, textDecoration: isDone ? "line-through" : "none" }}>
                      <span style={{ fontSize: 10, marginRight: 5, color: lesson.is_prerequisite ? "#dc2626" : "#4f46e5" }}>
                        {ICONS[lesson.content_type] || "•"}
                      </span>
                      {lesson.title}
                    </p>
                    <span style={{ fontSize: 10, color: "#444", flexShrink: 0, marginLeft: 8 }}>{lesson.estimated_minutes}m</span>
                  </div>
                  <p style={{ fontSize: 11, color: "#666", margin: "3px 0 0", lineHeight: 1.4 }}>{lesson.description}</p>
                  {/* Mistake target badge */}
                  {lesson.targets_mistake && lesson.targets_mistake !== "null" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <Target size={9} color="#d97706" />
                      <span style={{ fontSize: 10, color: "#d97706" }}>Targets: {lesson.targets_mistake}</span>
                    </div>
                  )}
                  {onStartLesson && !isDone && (
                    <button onClick={() => onStartLesson(lesson.concept_slug)} style={{ marginTop: 5, background: "none", border: "none", color: "#4f46e5", fontSize: 11, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 3 }}>
                      Start <ChevronRight size={10} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Videos */}
        {outline.videos?.length > 0 && (
          <div>
            <p style={{ fontSize: 10, color: "#555", fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.07em" }}>Watch to learn</p>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {outline.videos.slice(0, 5).map(v => <VideoThumb key={v.id} video={v} />)}
            </div>
          </div>
        )}

        {/* Success criteria */}
        <div style={{ background: "#0f1a0f", border: "1px solid #16a34a33", borderRadius: 10, padding: "10px 12px" }}>
          <p style={{ fontSize: 10, color: "#16a34a", fontWeight: 700, margin: "0 0 4px", textTransform: "uppercase" }}>You'll know you've mastered this when…</p>
          <p style={{ fontSize: 13, color: "#ccc", margin: 0, lineHeight: 1.6 }}>{outline.success_criteria}</p>
        </div>
      </div>
    </div>
  )
}

export default CourseOutlinePanel