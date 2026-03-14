import React, { useState, useCallback } from 'react'
import {
  BookOpen, Cpu, Radio, Wrench, Zap, FlaskConical,
  ChevronLeft, Check, Lock, Star,
} from 'lucide-react'
import { useStore } from '@/store'
import { callLLM } from '@/lib/llmClient'
import { cn } from '@/lib/utils'
import type { TrackId, CapsuleStage } from '@/types'

export const TRACKS = [
  {
    id: 'foundations' as TrackId, title: 'Foundations',
    description: 'LLM basics, prompt engineering, tokenization, context windows, embeddings, RAG.',
    icon: <BookOpen size={20} />, color: 'text-cyan', bgColor: 'bg-cyan/10',
    borderColor: 'border-cyan/30', accentColor: '#00e5ff',
    prerequisites: [] as TrackId[], estimatedHours: 4,
    concepts: ['LLM Fundamentals','Prompt Engineering','Tokenization','Context Windows','Temperature & Sampling','Embeddings','RAG Basics'],
  },
  {
    id: 'architecture' as TrackId, title: 'Architecture',
    description: 'ReAct, Chain of Thought, tool use, memory types, planning loops, multi-agent systems.',
    icon: <Cpu size={20} />, color: 'text-violet', bgColor: 'bg-violet/10',
    borderColor: 'border-violet/30', accentColor: '#7c6df0',
    prerequisites: ['foundations'] as TrackId[], estimatedHours: 6,
    concepts: ['ReAct Pattern','Chain of Thought','Tool Use','Memory Types','Planning Loops','Reflection Agents','Hierarchical Agents','Multi-Agent Systems'],
  },
  {
    id: 'protocols' as TrackId, title: 'Protocols',
    description: 'MCP, A2A, ANP, function calling, streaming, structured outputs, tool schemas.',
    icon: <Radio size={20} />, color: 'text-amber', bgColor: 'bg-amber/10',
    borderColor: 'border-amber/30', accentColor: '#ffb340',
    prerequisites: ['architecture'] as TrackId[], estimatedHours: 5,
    concepts: ['MCP Protocol','A2A Protocol','ANP Protocol','Function Calling','Streaming','Structured Outputs','Tool Schemas'],
  },
  {
    id: 'production' as TrackId, title: 'Production',
    description: 'Observability, tracing, evals, cost optimization, latency, error recovery, deployment.',
    icon: <Wrench size={20} />, color: 'text-green-400', bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30', accentColor: '#00e676',
    prerequisites: ['protocols'] as TrackId[], estimatedHours: 7,
    concepts: ['Observability','Tracing','Evaluation Frameworks','Cost Optimization','Latency Reduction','Error Recovery','Rate Limiting','Deployment Patterns'],
  },
  {
    id: 'advanced' as TrackId, title: 'Advanced',
    description: 'Constitutional AI, RLHF, fine-tuning, alignment, adversarial prompting, hallucinations.',
    icon: <Zap size={20} />, color: 'text-pink', bgColor: 'bg-pink/10',
    borderColor: 'border-pink/30', accentColor: '#ff6b9d',
    prerequisites: ['production'] as TrackId[], estimatedHours: 8,
    concepts: ['Constitutional AI','RLHF','Fine-tuning','Alignment Techniques','Adversarial Prompting','Jailbreak Defense','Hallucination Mitigation'],
  },
  {
    id: 'applied' as TrackId, title: 'Applied',
    description: 'Code agents, research agents, data analysis, customer support, workflow automation.',
    icon: <FlaskConical size={20} />, color: 'text-teal-400', bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30', accentColor: '#22d3ee',
    prerequisites: ['advanced'] as TrackId[], estimatedHours: 6,
    concepts: ['Code Agents','Research Agents','Data Analysis Agents','Customer Support Agents','Workflow Automation','Document Processing','Agent Orchestration'],
  },
]

const STAGES: Array<{ id: CapsuleStage; label: string; icon: string; xp: number }> = [
  { id: 'learn',   label: 'Learn',   icon: '📖', xp: 15 },
  { id: 'quiz',    label: 'Quiz',    icon: '❓', xp: 25 },
  { id: 'apply',   label: 'Apply',   icon: '⚙️', xp: 30 },
  { id: 'reflect', label: 'Reflect', icon: '🔄', xp: 20 },
  { id: 'expand',  label: 'Expand',  icon: '🌐', xp: 10 },
]

const STAGE_PROMPT = (stage: CapsuleStage, concept: string, track: string): string => ({
  learn:   `Explain "${concept}" in AI agents context (${track}). 3-4 paragraphs, concrete examples, one key insight practitioners often miss. Plain prose.`,
  quiz:    `3 quiz questions about "${concept}" (${track}). Format: Q: / A: / Tip: for each. Progressively harder.`,
  apply:   `Hands-on coding challenge for "${concept}" (${track}). Task (2 sentences) + Python starter code (15-20 lines, commented) + expected output + extension challenge.`,
  reflect: `Deep reflection on "${concept}" (${track}). Cover: core mental model, key tradeoff, common production mistake, when to use vs not use, one analogy. Bullet points.`,
  expand:  `Advanced expansion beyond "${concept}" (${track}): 3 related concepts, 1 research direction, 2 real-world case studies, 1 open question. Be specific.`,
}[stage])

function CapsuleView({ concept, track, stage, onComplete, onClose }: {
  concept: string; track: string; stage: CapsuleStage
  onComplete: (s: CapsuleStage) => void; onClose: () => void
}) {
  const provider = useStore(s => s.providers[s.activeProvider])
  const addXP = useStore(s => s.addXP)
  const [content, setContent] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [done, setDone] = React.useState(false)
  const meta = STAGES.find(s => s.id === stage)!
  const idx = STAGES.findIndex(s => s.id === stage)

  React.useEffect(() => {
    let alive = true
    setLoading(true); setContent(''); setDone(false)
    callLLM(provider, [{ role: 'user', content: STAGE_PROMPT(stage, concept, track) }], { maxTokens: 750 })
      .then(r => { if (alive) { setContent(r); setLoading(false) } })
      .catch(() => { if (alive) { setContent('Error — check your provider config.'); setLoading(false) } })
    return () => { alive = false }
  }, [stage, concept]) // eslint-disable-line

  const handleComplete = () => {
    if (done) return
    setDone(true)
    addXP(meta.xp)
    onComplete(stage)
  }

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.icon}</span>
          <div>
            <div className="text-[10px] text-text/40 uppercase tracking-wide">{concept}</div>
            <div className="font-semibold text-sm">{meta.label}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber">+{meta.xp} XP</span>
          <button onClick={onClose} className="text-text/30 hover:text-text/60 transition-colors">✕</button>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        {STAGES.map((s, i) => (
          <div key={s.id} className={cn('flex-1 h-1 rounded-full transition-all',
            i < idx ? 'bg-cyan' : i === idx ? 'bg-cyan/50' : 'bg-surface-3')} />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto text-sm text-text/85 leading-relaxed whitespace-pre-wrap">
        {loading
          ? <div className="space-y-2 animate-pulse">{[95,80,90,72,85,78].map((w,i) => <div key={i} className="h-3 bg-surface-3 rounded" style={{width:`${w}%`}} />)}</div>
          : content}
      </div>

      <button onClick={handleComplete} disabled={loading || done}
        className={cn('mt-4 w-full py-2.5 rounded-xl font-semibold text-sm transition-all',
          done ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
               : 'bg-cyan text-void hover:bg-cyan/90 disabled:opacity-40 disabled:cursor-not-allowed')}>
        {done ? '✓ Completed' : `Mark Complete (+${meta.xp} XP)`}
      </button>
    </div>
  )
}

export function LearningTracks() {
  const [selectedTrack, setSelectedTrack] = useState<typeof TRACKS[0] | null>(null)
  const [activeConcept, setActiveConcept] = useState<string | null>(null)
  const [activeStage, setActiveStage] = useState<CapsuleStage>('learn')
  const [completedStages, setCompletedStages] = useState<Record<string, CapsuleStage[]>>({})
  const completedConcepts = useStore(s => s.user.completedConcepts)
  const markConceptComplete = useStore(s => s.markConceptComplete)
  const setUserTrack = useStore(s => s.setTrack)

  const isUnlocked = (track: typeof TRACKS[0]) => {
    if (!track.prerequisites.length) return true
    return track.prerequisites.every(pid => {
      const pre = TRACKS.find(t => t.id === pid)!
      const done = pre.concepts.filter(c => completedConcepts.includes(`${pid}:${c}`)).length
      return done >= Math.ceil(pre.concepts.length * 0.7)
    })
  }

  const onStageComplete = useCallback((stage: CapsuleStage) => {
    if (!activeConcept || !selectedTrack) return
    const key = `${selectedTrack.id}:${activeConcept}`
    setCompletedStages(prev => {
      const cur = prev[key] ?? []
      if (cur.includes(stage)) return prev
      const next = [...cur, stage]
      if (next.length === STAGES.length) markConceptComplete(key)
      return { ...prev, [key]: next }
    })
    const ni = STAGES.findIndex(s => s.id === stage) + 1
    if (ni < STAGES.length) setTimeout(() => setActiveStage(STAGES[ni].id), 500)
  }, [activeConcept, selectedTrack, markConceptComplete])

  // Capsule view
  if (selectedTrack && activeConcept) {
    const key = `${selectedTrack.id}:${activeConcept}`
    const csDone = completedStages[key] ?? []
    return (
      <div className="max-w-2xl mx-auto py-6">
        <div className="bg-surface border border-border rounded-3xl p-6">
          <CapsuleView concept={activeConcept} track={selectedTrack.title}
            stage={activeStage} onComplete={onStageComplete}
            onClose={() => { setActiveConcept(null); setActiveStage('learn') }} />
          <div className="flex gap-1 mt-4 bg-surface-2 p-1 rounded-xl">
            {STAGES.map(s => (
              <button key={s.id} onClick={() => setActiveStage(s.id)}
                className={cn('flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1',
                  activeStage === s.id ? 'bg-surface text-text' : 'text-text/40 hover:text-text/70')}>
                {csDone.includes(s.id) && <Check size={9} className="text-green-400" />}
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Track concept list
  if (selectedTrack) {
    return (
      <div className="max-w-3xl mx-auto py-6 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedTrack(null)} className="text-xs text-text/40 hover:text-text/70 flex items-center gap-1 transition-colors">
            <ChevronLeft size={13} />All Tracks
          </button>
          <div className={cn('flex items-center gap-2', selectedTrack.color)}>
            {selectedTrack.icon}
            <span className="font-semibold text-text">{selectedTrack.title}</span>
          </div>
          <span className="text-xs text-text/40 ml-auto">~{selectedTrack.estimatedHours}h</span>
        </div>
        <p className="text-sm text-text/60">{selectedTrack.description}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {selectedTrack.concepts.map(concept => {
            const key = `${selectedTrack.id}:${concept}`
            const done = completedStages[key] ?? []
            const allDone = done.length === STAGES.length
            return (
              <button key={concept} onClick={() => { setActiveConcept(concept); setActiveStage('learn') }}
                className={cn('p-4 rounded-2xl border text-left transition-all group',
                  allDone ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-surface hover:border-border-2 hover:bg-surface-2')}>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium text-text">{concept}</span>
                  {allDone && <Check size={14} className="text-green-400" />}
                </div>
                <div className="flex gap-1">
                  {STAGES.map(s => (
                    <div key={s.id} className="flex-1 h-1 rounded-full transition-all"
                      style={{ background: done.includes(s.id) ? selectedTrack.accentColor : 'rgba(255,255,255,0.06)' }} />
                  ))}
                </div>
                <div className="text-[10px] text-text/30 mt-1.5">{done.length}/{STAGES.length} stages</div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // All tracks
  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-text mb-1">Learning Tracks</h2>
        <p className="text-text/50 text-sm">6 tracks · 5-stage capsules ·
          <span className="text-cyan"> Learn → Quiz → Apply → Reflect → Expand</span>
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TRACKS.map(track => {
          const unlocked = isUnlocked(track)
          const done = track.concepts.filter(c => completedConcepts.includes(`${track.id}:${c}`)).length
          const pct = Math.round((done / track.concepts.length) * 100)
          return (
            <button key={track.id} onClick={unlocked ? () => { setSelectedTrack(track); setUserTrack(track.id) } : undefined}
              className={cn('group p-5 rounded-2xl border text-left transition-all',
                unlocked ? 'border-border bg-surface hover:border-border-2 hover:bg-surface-2' : 'border-border/50 bg-surface/40 cursor-not-allowed opacity-55')}>
              <div className="flex items-start justify-between mb-3">
                <div className={cn('p-2 rounded-xl', track.bgColor, track.color)}>{track.icon}</div>
                {!unlocked ? <Lock size={13} className="text-text/30 mt-1" /> : pct === 100 ? <Star size={13} className="text-amber mt-1" /> : null}
              </div>
              <div className="font-semibold text-text mb-1">{track.title}</div>
              <div className="text-xs text-text/50 leading-relaxed mb-3 line-clamp-2">{track.description}</div>
              <div className="flex items-center justify-between text-xs text-text/30 mb-2">
                <span>{track.concepts.length} concepts</span>
                <span>~{track.estimatedHours}h</span>
              </div>
              <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: track.accentColor }} />
              </div>
              {!unlocked && track.prerequisites.length > 0 && (
                <div className="text-[10px] text-text/30 mt-2">Unlock: complete 70% of {track.prerequisites.join(', ')}</div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
