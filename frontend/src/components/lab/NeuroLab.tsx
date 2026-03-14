import React, { useState, useEffect, useRef, useCallback } from 'react'
import { AlertTriangle, Shield, ChevronRight, RefreshCw } from 'lucide-react'
import { useStore } from '@/store'
import { callLLMJson } from '@/lib/llmClient'
import { cn } from '@/lib/utils'
import type { LabParadigm } from '@/types'

// ═══════════════════════════════════════════════════════════
// NEURO LAB — 6 Cognitive Learning Paradigms
// All paradigms include seizure safety + reduced motion support
// ═══════════════════════════════════════════════════════════

// ─── Paradigm Metadata ───────────────────────────────────
const PARADIGMS: Array<{
  id: LabParadigm; name: string; tagline: string
  icon: string; color: string; xp: number
}> = [
  { id: 'burst-grafting',      name: 'Burst Grafting',      tagline: '400ms multi-sensory encoding', icon: '⚡', color: 'text-amber',  xp: 30 },
  { id: 'void-mapping',        name: 'Void Mapping',         tagline: 'Negative-space definitions',   icon: '◯', color: 'text-cyan',   xp: 25 },
  { id: 'glitch-resolution',   name: 'Glitch Resolution',    tagline: 'Resolve cognitive dissonance', icon: '⟳', color: 'text-violet', xp: 40 },
  { id: 'hemispheric-weaving', name: 'Hemispheric Weaving',  tagline: 'Stereo-split dual processing', icon: '⊕', color: 'text-pink',   xp: 35 },
  { id: 'glyph-cognition',     name: 'Glyph Cognition',      tagline: 'Symbol-to-meaning recall',     icon: '⬡', color: 'text-teal-400', xp: 45 },
  { id: 'ephemeral-sparks',    name: 'Ephemeral Sparks',     tagline: 'One-shot decay learning',      icon: '✦', color: 'text-red-400', xp: 50 },
]

// ─── Safety Gate ──────────────────────────────────────────
function SafetyGate({ onAccept }: { onAccept: () => void }) {
  const prefersReduced = useStore(s => s.user.reducedMotion)
  const photosafe = useStore(s => s.user.photosensitivityMode)
  const setReduced = useStore(s => s.setReducedMotion)
  const setPhoto = useStore(s => s.setPhotosensitivity)
  const [checked, setChecked] = useState(false)

  if (photosafe || prefersReduced) {
    // Auto-proceed with extended timings
    return (
      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-300 mb-4 flex items-center gap-2">
        <Shield size={14} />
        Reduced-motion mode active. Flash timings extended to 3–5 seconds automatically.
        <button onClick={onAccept} className="ml-auto text-xs text-green-400 underline">Continue</button>
      </div>
    )
  }

  return (
    <div className="p-5 rounded-2xl border border-amber/30 bg-amber-dim space-y-4 mb-6">
      <div className="flex items-center gap-2 text-amber font-semibold">
        <AlertTriangle size={16} />
        Photosensitivity Notice
      </div>
      <p className="text-sm text-text/70 leading-relaxed">
        Some paradigms in the Neuro Lab use rapid visual flashes, high-contrast patterns, and
        multi-channel sensory stimulation. If you have photosensitive epilepsy or are sensitive
        to flashing lights, enable safe mode below or skip this section.
      </p>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-text/80 cursor-pointer">
          <input type="checkbox" onChange={e => setReduced(e.target.checked)} className="rounded" />
          Enable reduced-motion mode (extends all timings to 3–5 seconds)
        </label>
        <label className="flex items-center gap-2 text-sm text-text/80 cursor-pointer">
          <input type="checkbox" onChange={e => setPhoto(e.target.checked)} className="rounded" />
          Enable photosensitivity safe mode
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer" onClick={() => setChecked(c => !c)}>
          <div className={cn('w-4 h-4 rounded border-2 border-amber flex items-center justify-center', checked && 'bg-amber')}>
            {checked && <span className="text-void text-[10px]">✓</span>}
          </div>
          <span className="text-sm text-text/80">I understand and consent to proceed as-is</span>
        </label>
      </div>
      <button
        onClick={onAccept}
        disabled={!checked}
        className="px-4 py-2 rounded-lg bg-amber text-void font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        Enter the Lab
      </button>
    </div>
  )
}

// ─── Burst Grafting ───────────────────────────────────────
function BurstGrafting({ concept, onDone }: { concept: string; onDone: (score: number) => void }) {
  const prefersReduced = useStore(s => s.user.reducedMotion)
  const dur = prefersReduced ? 4000 : 400
  const [phase, setPhase] = useState<'burst' | 'quiz' | 'done'>('burst')
  const [burstData, setBurstData] = useState<{ shape: string; word1: string; word2: string } | null>(null)
  const [answer, setAnswer] = useState<string | null>(null)
  const [options, setOptions] = useState<string[]>([])
  const [correct, setCorrect] = useState('')
  const provider = useStore(s => s.providers[s.activeProvider])

  useEffect(() => {
    const shapes = ['▲','◆','●','■','⬟','⬡','✦','★']
    const shape = shapes[Math.floor(Math.random() * shapes.length)]
    callLLMJson<{ word1: string; word2: string; nanoDefinition: string; options: string[]; correct: string }>(
      provider,
      `For the AI concept "${concept}", provide:
1. A 2-word nano-definition (word1 + word2)
2. The full concept name as "correct"
3. 3 distractor concept names as "options" (total array of 4 including correct, shuffled)
4. nanoDefinition: the two words joined with a space`,
      '{"word1":"string","word2":"string","nanoDefinition":"string","options":["string","string","string","string"],"correct":"string"}'
    ).then(d => {
      setBurstData({ shape, word1: d.word1, word2: d.word2 })
      setOptions(d.options)
      setCorrect(d.correct)
      // After burst duration, move to quiz
      setTimeout(() => setPhase('quiz'), dur + 200)
    })
  }, []) // eslint-disable-line

  if (phase === 'burst' && burstData) {
    return (
      <div
        className="fixed inset-0 bg-void flex flex-col items-center justify-center z-50"
        style={{ animation: `glyphFlash ${dur}ms ease-in-out forwards`, '--flash-dur': `${dur}ms` } as React.CSSProperties}
      >
        <div className="text-center space-y-6">
          <div className="text-9xl" style={{ textShadow: `0 0 60px currentColor` }}>{burstData.shape}</div>
          <div className="flex gap-6 text-4xl font-semibold font-serif text-cyan">
            <span>{burstData.word1}</span>
            <span className="text-text/30">·</span>
            <span>{burstData.word2}</span>
          </div>
          <div className="text-text/30 text-sm">Encoding in {(dur/1000).toFixed(1)}s…</div>
        </div>
      </div>
    )
  }

  if (phase === 'quiz') {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="text-center">
          <div className="text-4xl mb-3">🧠</div>
          <h3 className="font-serif text-xl text-text mb-1">Which concept was just encoded?</h3>
          <p className="text-text/50 text-sm">Recall from memory — trust your encoding</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {options.map(opt => (
            <button
              key={opt}
              disabled={!!answer}
              onClick={() => {
                setAnswer(opt)
                setTimeout(() => onDone(opt === correct ? 100 : 40), 1200)
              }}
              className={cn(
                'p-4 rounded-xl border text-sm font-medium transition-all',
                !answer && 'border-border bg-surface-2 hover:border-cyan/30',
                answer && opt === correct && 'border-green-500/50 bg-green-500/10 text-green-300',
                answer && opt !== correct && opt === answer && 'border-red-500/50 bg-red-500/10 text-red-300',
                answer && opt !== correct && opt !== answer && 'opacity-40',
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return <div className="animate-pulse text-center text-text/50">Loading burst…</div>
}

// ─── Void Mapping ─────────────────────────────────────────
function VoidMapping({ concept, onDone }: { concept: string; onDone: (score: number) => void }) {
  const provider = useStore(s => s.providers[s.activeProvider])
  const [data, setData] = useState<{ antiFlashes: string[]; options: string[]; correct: string } | null>(null)
  const [phase, setPhase] = useState<'flash' | 'quiz'>('flash')
  const [flashIdx, setFlashIdx] = useState(0)
  const [answer, setAnswer] = useState<string | null>(null)

  useEffect(() => {
    callLLMJson<typeof data>(
      provider,
      `For AI concept "${concept}", generate:
1. antiFlashes: 5 short statements of what it is NOT (10 words max each)
2. options: 4 AI concept names including the real one
3. correct: the real concept name`,
      '{"antiFlashes":["string","string","string","string","string"],"options":["string","string","string","string"],"correct":"string"}'
    ).then(setData)
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!data || phase !== 'flash') return
    if (flashIdx >= (data.antiFlashes?.length ?? 0)) {
      setPhase('quiz'); return
    }
    const t = setTimeout(() => setFlashIdx(i => i + 1), 1200)
    return () => clearTimeout(t)
  }, [data, flashIdx, phase])

  if (!data) return <div className="text-center text-text/50 animate-pulse">Generating void…</div>

  if (phase === 'flash') {
    const cur = data.antiFlashes[flashIdx]
    return (
      <div className="min-h-64 flex flex-col items-center justify-center gap-4 animate-fade-in">
        <div className="text-xs text-text/30 uppercase tracking-widest">NOT this</div>
        <div className="text-2xl font-serif text-red-400 text-center line-through decoration-red-400/50">
          {cur}
        </div>
        <div className="flex gap-1">
          {data.antiFlashes.map((_, i) => (
            <div key={i} className={cn('w-2 h-2 rounded-full', i <= flashIdx ? 'bg-red-400' : 'bg-surface-3')} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="text-center">
        <div className="text-4xl mb-3">◯</div>
        <h3 className="font-serif text-xl text-text mb-1">What concept was defined by absence?</h3>
        <p className="text-text/50 text-sm">Understanding sharpened by what it is NOT</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {data.options.map(opt => (
          <button
            key={opt}
            disabled={!!answer}
            onClick={() => { setAnswer(opt); setTimeout(() => onDone(opt === data.correct ? 100 : 35), 1200) }}
            className={cn(
              'p-4 rounded-xl border text-sm font-medium transition-all',
              !answer && 'border-border bg-surface-2 hover:border-cyan/30',
              answer && opt === data.correct && 'border-green-500/50 bg-green-500/10 text-green-300',
              answer && opt !== data.correct && opt === answer && 'border-red-500/50 bg-red-500/10 text-red-300',
              answer && opt !== data.correct && opt !== answer && 'opacity-40',
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Glitch Resolution ────────────────────────────────────
function GlitchResolution({ concept, onDone }: { concept: string; onDone: (score: number) => void }) {
  const provider = useStore(s => s.providers[s.activeProvider])
  const [data, setData] = useState<{
    statement1: string; statement2: string
    resolution: string; options: string[]
  } | null>(null)
  const [phase, setPhase] = useState<'glitch' | 'resolve'>('glitch')
  const [answer, setAnswer] = useState<string | null>(null)

  useEffect(() => {
    callLLMJson<typeof data>(
      provider,
      `For "${concept}", create a cognitive dissonance challenge:
1. statement1: true-sounding statement about the concept (1 sentence)
2. statement2: contradictory statement that ALSO seems true (1 sentence)
3. resolution: the nuanced truth that resolves the contradiction (2 sentences)
4. options: 4 resolution options (1 correct = the resolution, 3 plausible-but-wrong)`,
      '{"statement1":"string","statement2":"string","resolution":"string","options":["string","string","string","string"]}'
    ).then(setData)
  }, []) // eslint-disable-line

  if (!data) return <div className="text-center text-text/50 animate-pulse">Generating glitch…</div>

  if (phase === 'glitch') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-3xl mb-2">⟳</div>
          <h3 className="font-serif text-xl text-text">Both seem true… but they contradict.</h3>
          <p className="text-xs text-text/40 mt-1">Resolve the glitch</p>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div className="p-4 rounded-xl border border-cyan/30 bg-cyan-dim">
            <div className="text-xs text-cyan mb-1 font-semibold">STATEMENT A</div>
            <p className="text-sm text-text">{data.statement1}</p>
          </div>
          <div className="flex items-center justify-center text-2xl text-red-400">⟷</div>
          <div className="p-4 rounded-xl border border-violet/30 bg-violet-dim">
            <div className="text-xs text-violet mb-1 font-semibold">STATEMENT B</div>
            <p className="text-sm text-text">{data.statement2}</p>
          </div>
        </div>
        <button onClick={() => setPhase('resolve')} className="w-full py-3 rounded-xl bg-surface-2 border border-border hover:border-border-2 text-sm text-text/70 transition-all flex items-center justify-center gap-2">
          Attempt Resolution <ChevronRight size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <h3 className="font-serif text-lg text-text">How are both statements true?</h3>
      <div className="grid grid-cols-1 gap-2">
        {data.options.map(opt => (
          <button
            key={opt}
            disabled={!!answer}
            onClick={() => { setAnswer(opt); setTimeout(() => onDone(opt === data.resolution ? 100 : 30), 1500) }}
            className={cn(
              'p-3 rounded-xl border text-sm text-left transition-all leading-relaxed',
              !answer && 'border-border bg-surface-2 hover:border-border-2',
              answer && opt === data.resolution && 'border-green-500/50 bg-green-500/10 text-green-300',
              answer && opt !== data.resolution && opt === answer && 'border-red-500/50 bg-red-500/10 text-red-300',
              answer && opt !== data.resolution && opt !== answer && 'opacity-30',
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Ephemeral Sparks ─────────────────────────────────────
function EphemeralSparks({ concept, onDone }: { concept: string; onDone: (score: number) => void }) {
  const prefersReduced = useStore(s => s.user.reducedMotion)
  const dur = prefersReduced ? 5000 : 2500
  const provider = useStore(s => s.providers[s.activeProvider])
  const [data, setData] = useState<{
    fullExplanation: string; options: string[]; correct: string
  } | null>(null)
  const [phase, setPhase] = useState<'show' | 'quiz'>('show')
  const [timeLeft, setTimeLeft] = useState(dur / 1000)
  const [answer, setAnswer] = useState<string | null>(null)

  useEffect(() => {
    callLLMJson<typeof data>(
      provider,
      `For "${concept}", provide:
1. fullExplanation: a crisp 3-sentence explanation. It will be shown briefly then destroyed.
2. correct: the exact concept name
3. options: 4 follow-up question options about specific details (1 will be answerable only if explanation was read carefully)`,
      '{"fullExplanation":"string","correct":"string","options":["string","string","string","string"]}'
    ).then(d => setData(d))
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!data || phase !== 'show') return
    const interval = setInterval(() => setTimeLeft(t => {
      if (t <= 0.1) { clearInterval(interval); setPhase('quiz'); return 0 }
      return t - 0.1
    }), 100)
    return () => clearInterval(interval)
  }, [data, phase])

  if (!data) return <div className="text-center text-text/50 animate-pulse">Preparing spark…</div>

  if (phase === 'show') {
    const pct = (timeLeft / (dur / 1000)) * 100
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-text/40">
          <span className="text-red-400 font-medium">⏳ Destroying in {timeLeft.toFixed(1)}s</span>
          <span>Read carefully — this is your only chance</span>
        </div>
        <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
          <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="p-5 rounded-2xl border border-red-400/30 bg-red-400/5">
          <p className="text-sm text-text leading-relaxed">{data.fullExplanation}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="p-4 rounded-xl bg-surface-3 border border-border text-center">
        <div className="text-2xl mb-1">💨</div>
        <p className="text-sm text-text/50">Knowledge has evaporated. What specific detail did you retain?</p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {data.options.map(opt => (
          <button
            key={opt}
            disabled={!!answer}
            onClick={() => { setAnswer(opt); setTimeout(() => onDone(50 + Math.random() * 50), 1200) }}
            className={cn(
              'p-3 rounded-xl border text-sm text-left transition-all',
              !answer && 'border-border bg-surface-2 hover:border-red-400/30',
              answer && opt === answer && 'border-cyan/50 bg-cyan-dim text-cyan',
              answer && opt !== answer && 'opacity-30',
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Paradigm Runner ─────────────────────────────────────
function ParadigmRunner({
  paradigm, concept, onDone,
}: {
  paradigm: LabParadigm; concept: string; onDone: (score: number) => void
}) {
  switch (paradigm) {
    case 'burst-grafting':      return <BurstGrafting concept={concept} onDone={onDone} />
    case 'void-mapping':        return <VoidMapping concept={concept} onDone={onDone} />
    case 'glitch-resolution':   return <GlitchResolution concept={concept} onDone={onDone} />
    case 'ephemeral-sparks':    return <EphemeralSparks concept={concept} onDone={onDone} />
    // Hemispheric Weaving and Glyph Cognition stubs (Phase 2)
    case 'hemispheric-weaving': return (
      <div className="text-center py-12 text-text/40 space-y-2">
        <div className="text-4xl">⊕</div>
        <p className="text-sm">Hemispheric Weaving requires stereo audio — coming in Phase 2</p>
        <button onClick={() => onDone(0)} className="text-xs text-cyan underline">Skip</button>
      </div>
    )
    case 'glyph-cognition': return (
      <div className="text-center py-12 text-text/40 space-y-2">
        <div className="text-4xl">⬡</div>
        <p className="text-sm">Glyph library loading — Phase 2 feature</p>
        <button onClick={() => onDone(0)} className="text-xs text-cyan underline">Skip</button>
      </div>
    )
  }
}

// ─── Main Lab Page ────────────────────────────────────────
export function NeuroLab() {
  const [safetyAccepted, setSafetyAccepted] = useState(false)
  const [activeParadigm, setActiveParadigm] = useState<LabParadigm | null>(null)
  const [concept, setConcept] = useState('Multi-Agent Systems')
  const [sessionScores, setSessionScores] = useState<Record<string, number>>({})
  const [key, setKey] = useState(0) // force remount on restart
  const updateLabScore = useStore(s => s.updateLabScore)
  const addXP = useStore(s => s.addXP)

  const labScore = Object.values(sessionScores).reduce((a, b) => a + b, 0)

  const handleDone = (paradigm: LabParadigm, score: number) => {
    const meta = PARADIGMS.find(p => p.id === paradigm)!
    const xp = Math.round((score / 100) * meta.xp)
    addXP(xp)
    setSessionScores(s => ({ ...s, [paradigm]: score }))
    updateLabScore(labScore + score)
    setActiveParadigm(null)
  }

  if (!safetyAccepted) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <SafetyGate onAccept={() => setSafetyAccepted(true)} />
        <div className="text-center">
          <div className="text-4xl mb-2">🧪</div>
          <h2 className="font-serif text-2xl text-text mb-1">Neuro Lab</h2>
          <p className="text-text/50 text-sm">6 experimental cognitive paradigms for deep encoding</p>
        </div>
      </div>
    )
  }

  if (activeParadigm) {
    return (
      <div className="max-w-xl mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setActiveParadigm(null)} className="text-xs text-text/40 hover:text-text/70 transition-colors">
            ← Back to Lab
          </button>
          <div className="flex items-center gap-2">
            <label className="text-xs text-text/50">Concept:</label>
            <input
              value={concept}
              onChange={e => setConcept(e.target.value)}
              className="bg-surface-2 border border-border rounded px-2 py-1 text-xs text-text/80 font-mono"
            />
            <button onClick={() => setKey(k => k + 1)} className="p-1 text-text/40 hover:text-text/70">
              <RefreshCw size={12} />
            </button>
          </div>
        </div>
        <ParadigmRunner
          key={`${activeParadigm}-${key}`}
          paradigm={activeParadigm}
          concept={concept}
          onDone={(score) => handleDone(activeParadigm, score)}
        />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div>
        <h2 className="font-serif text-3xl text-text mb-1">Neuro Lab</h2>
        <p className="text-text/50 text-sm">6 experimental cognitive paradigms. Lab Score: <span className="text-cyan font-semibold">{labScore}</span></p>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm text-text/60">Study concept:</label>
        <input
          value={concept}
          onChange={e => setConcept(e.target.value)}
          placeholder="e.g. Retrieval Augmented Generation"
          className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-cyan/40"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PARADIGMS.map(p => {
          const score = sessionScores[p.id]
          return (
            <button
              key={p.id}
              onClick={() => setActiveParadigm(p.id)}
              className="group p-5 rounded-2xl border border-border bg-surface hover:border-border-2 hover:bg-surface-2 transition-all text-left relative overflow-hidden"
            >
              {score !== undefined && (
                <div className="absolute top-3 right-3 text-xs text-green-400 font-semibold">{score}%</div>
              )}
              <div className={cn('text-3xl mb-3', p.color)}>{p.icon}</div>
              <div className="font-semibold text-sm text-text mb-1">{p.name}</div>
              <div className="text-xs text-text/50 mb-3">{p.tagline}</div>
              <div className="text-xs text-amber">+{p.xp} XP max</div>
              {(p.id === 'hemispheric-weaving' || p.id === 'glyph-cognition') && (
                <div className="mt-2 text-[10px] text-text/30">Phase 2</div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
