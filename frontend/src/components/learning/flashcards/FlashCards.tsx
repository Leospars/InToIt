import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Zap, RotateCcw, ChevronRight, Layers, Clock, Star } from 'lucide-react'
import { useStore } from '@/store'
import { callLLMJson } from '@/lib/llmClient'
import { sm2Update, shuffle, cn } from '@/lib/utils'
import type { FlashCard, CardType } from '@/types'
import { idb } from '@/lib/idb'

// ─── Card type metadata ───────────────────────────────────
const CARD_TYPES: Record<CardType, { label: string; color: string; icon: string; desc: string }> = {
  'definition':    { label: 'Definition',    color: 'text-cyan',      icon: '📖', desc: 'Core concept definition' },
  'logic':         { label: 'Logic',          color: 'text-violet',    icon: '🔗', desc: 'Cause and effect reasoning' },
  'mini-pattern':  { label: 'Mini Pattern',   color: 'text-amber',     icon: '⚙️', desc: 'Repeatable pattern or template' },
  'learning-loop': { label: 'Learning Loop',  color: 'text-pink',      icon: '🔄', desc: 'Feedback and iteration cycle' },
  'real-world':    { label: 'Real World',     color: 'text-green-400', icon: '🌍', desc: 'Practical application example' },
}

// ─── SM-2 grade buttons ───────────────────────────────────
const GRADES = [
  { grade: 0 as const, label: 'Blank',    color: 'border-red-500/50   bg-red-500/10   text-red-400'   },
  { grade: 2 as const, label: 'Hard',     color: 'border-orange-500/40 bg-orange-500/8 text-orange-400' },
  { grade: 3 as const, label: 'Good',     color: 'border-amber/40     bg-amber-dim    text-amber'     },
  { grade: 5 as const, label: 'Easy',     color: 'border-green-500/50  bg-green-500/10 text-green-400' },
]

// ─── Card Generator ───────────────────────────────────────
async function generateCard(
  provider: ReturnType<typeof useStore>['providers'][string],
  concept: string,
  type: CardType,
): Promise<FlashCard> {
  const typeDescs: Record<CardType, string> = {
    'definition':    'a clear, concise definition of the concept',
    'logic':         'a cause-and-effect or if-then logic chain about the concept',
    'mini-pattern':  'a reusable code or architectural pattern related to the concept',
    'learning-loop': 'a feedback loop or iterative process the concept enables',
    'real-world':    'a concrete, real-world scenario or company use case',
  }

  const schema = `{
    "front": "the question or prompt (1–2 sentences)",
    "back": "the answer or explanation (2–4 sentences, clear and memorable)"
  }`

  const data = await callLLMJson<{ front: string; back: string }>(
    provider,
    `Create a flashcard of type "${type}" (${typeDescs[type]}) for the AI concept: "${concept}".
The front should be a crisp question or prompt. The back should be a clear, memorable answer.`,
    schema,
  )

  return {
    id: crypto.randomUUID(),
    conceptId: concept.toLowerCase().replace(/\s+/g, '-'),
    type,
    front: data.front,
    back: data.back,
    xpReward: 2,
    nextReview: Date.now(),
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
  }
}

// ─── Single Card Face ─────────────────────────────────────
function CardFace({
  card,
  face,
  flipped,
  onFlip,
}: {
  card: FlashCard
  face: 'front' | 'back'
  flipped: boolean
  onFlip: () => void
}) {
  const meta = CARD_TYPES[card.type]

  return (
    <motion.div
      className="relative cursor-pointer select-none"
      onClick={onFlip}
      style={{ perspective: 1200 }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: 'preserve-3d', position: 'relative', minHeight: 260 }}
      >
        {/* Front */}
        <div
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          className="absolute inset-0 flex flex-col bg-surface border border-border rounded-3xl p-8 shadow-card"
        >
          <div className="flex items-center justify-between mb-6">
            <span className={cn('text-xs font-semibold uppercase tracking-wider', meta.color)}>
              {meta.icon} {meta.label}
            </span>
            <span className="text-xs text-text/30">Tap to reveal</span>
          </div>
          <div className="flex-1 flex items-center justify-center text-center">
            <p className="font-serif text-xl text-text leading-relaxed">{card.front}</p>
          </div>
          <div className="mt-6 text-xs text-text/20 text-center">{meta.desc}</div>
        </div>

        {/* Back */}
        <div
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          className="absolute inset-0 flex flex-col bg-surface-2 border border-border-2 rounded-3xl p-8 shadow-card"
        >
          <div className="flex items-center gap-2 mb-6">
            <span className={cn('text-xs font-semibold uppercase tracking-wider', meta.color)}>
              {meta.icon} Answer
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center text-center">
            <p className="text-base text-text/90 leading-relaxed">{card.back}</p>
          </div>
          <div className="mt-4 text-xs text-text/30 text-center">How well did you know this?</div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Deck Builder ─────────────────────────────────────────
function DeckBuilder({
  onStart,
}: {
  onStart: (concept: string, types: CardType[], count: number) => void
}) {
  const [concept, setConcept] = useState('Multi-Agent Systems')
  const [selectedTypes, setSelectedTypes] = useState<CardType[]>(['definition', 'logic', 'mini-pattern', 'learning-loop', 'real-world'])
  const [count, setCount] = useState(5)

  const toggleType = (t: CardType) =>
    setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <label className="text-xs text-text/50 mb-2 block">Concept to study</label>
        <input
          value={concept}
          onChange={e => setConcept(e.target.value)}
          placeholder="e.g. Retrieval Augmented Generation"
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-cyan/40"
        />
      </div>

      <div>
        <label className="text-xs text-text/50 mb-2 block">Card types (5 per concept)</label>
        <div className="grid grid-cols-1 gap-2">
          {(Object.entries(CARD_TYPES) as [CardType, typeof CARD_TYPES[CardType]][]).map(([type, meta]) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border text-left transition-all text-sm',
                selectedTypes.includes(type)
                  ? 'border-cyan/30 bg-cyan-dim'
                  : 'border-border bg-surface-2/50 hover:border-border-2',
              )}
            >
              <div className={cn(
                'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                selectedTypes.includes(type) ? 'border-cyan bg-cyan' : 'border-border',
              )}>
                {selectedTypes.includes(type) && <span className="text-void text-[9px] font-bold">✓</span>}
              </div>
              <span className="text-lg">{meta.icon}</span>
              <div>
                <div className={cn('font-medium text-sm', meta.color)}>{meta.label}</div>
                <div className="text-xs text-text/40">{meta.desc}</div>
              </div>
              <span className="ml-auto text-xs text-text/30">+2 XP</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-text/50 mb-2 block">Cards per session: {count}</label>
        <input
          type="range" min={3} max={20} value={count}
          onChange={e => setCount(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <button
        onClick={() => onStart(concept, selectedTypes, count)}
        disabled={selectedTypes.length === 0 || !concept.trim()}
        className="w-full py-3 rounded-xl bg-cyan text-void font-semibold text-sm hover:bg-cyan/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Generate {count} Cards →
      </button>
    </div>
  )
}

// ─── Progress Stats Bar ───────────────────────────────────
function SessionStats({
  total, seen, correct, xpEarned,
}: {
  total: number; seen: number; correct: number; xpEarned: number
}) {
  const pct = total > 0 ? Math.round((seen / total) * 100) : 0
  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {[
        { label: 'Progress', value: `${pct}%`, icon: <Layers size={12} /> },
        { label: 'Seen',     value: `${seen}/${total}`, icon: <ChevronRight size={12} /> },
        { label: 'Correct',  value: correct, icon: <Star size={12} /> },
        { label: 'XP',       value: `+${xpEarned}`, icon: <Zap size={12} /> },
      ].map(({ label, value, icon }) => (
        <div key={label} className="bg-surface border border-border rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-text/40 mb-1">{icon}<span className="text-[10px] uppercase tracking-wide">{label}</span></div>
          <div className="font-semibold text-sm text-text">{value}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Main FlashCards Page ─────────────────────────────────
export function FlashCards() {
  const provider = useStore(s => s.providers[s.activeProvider])
  const addXP = useStore(s => s.addXP)
  const markCardComplete = useStore(s => s.markCardComplete)

  const [phase, setPhase] = useState<'build' | 'study' | 'done'>('build')
  const [deck, setDeck] = useState<FlashCard[]>([])
  const [loading, setLoading] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [seen, setSeen] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [direction, setDirection] = useState(1)

  const currentCard = deck[currentIdx]

  const handleStart = async (concept: string, types: CardType[], count: number) => {
    if (!provider.isEnabled && !provider.isLocal) return
    setLoading(true)

    try {
      // Generate cards for requested types, cycling if count > types.length
      const typeQueue = shuffle([...Array(count)].map((_, i) => types[i % types.length]))
      const cards = await Promise.all(typeQueue.map(t => generateCard(provider, concept, t)))
      setDeck(cards)
      setCurrentIdx(0)
      setSeen(0)
      setCorrect(0)
      setXpEarned(0)
      setFlipped(false)
      setPhase('study')
    } catch (e) {
      console.error('Card generation failed', e)
    } finally {
      setLoading(false)
    }
  }

  const handleGrade = (grade: 0 | 1 | 2 | 3 | 4 | 5) => {
    if (!currentCard) return
    const updated = sm2Update(currentCard, grade)
    const isCorrect = grade >= 3

    // Update deck in-place
    setDeck(prev => prev.map((c, i) => i === currentIdx ? updated : c))
    setSeen(s => s + 1)
    if (isCorrect) {
      setCorrect(c => c + 1)
      addXP(currentCard.xpReward)
      setXpEarned(x => x + currentCard.xpReward)
      markCardComplete(currentCard.id)
    }

    setDirection(1)
    setFlipped(false)

    if (currentIdx + 1 >= deck.length) {
      setPhase('done')
    } else {
      setTimeout(() => setCurrentIdx(i => i + 1), 120)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-12 h-12 rounded-2xl border-2 border-cyan/30 border-t-cyan animate-spin" />
        <p className="text-text/50 text-sm">Generating your deck…</p>
      </div>
    )
  }

  if (phase === 'build') {
    return (
      <div className="py-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🃏</div>
          <h2 className="font-serif text-2xl text-text mb-1">Flash Cards</h2>
          <p className="text-text/50 text-sm">
            5 card types × any concept. SM-2 spaced repetition keeps knowledge fresh for months.
          </p>
        </div>
        {!provider.isEnabled && !provider.isLocal ? (
          <div className="text-center py-12 text-text/40 text-sm">
            <Brain size={32} className="mx-auto mb-3 opacity-30" />
            Configure an LLM provider in Settings to generate cards.
          </div>
        ) : (
          <DeckBuilder onStart={handleStart} />
        )}
      </div>
    )
  }

  if (phase === 'done') {
    const accuracy = deck.length > 0 ? Math.round((correct / deck.length) * 100) : 0
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6 animate-slide-up">
        <div className="text-6xl">
          {accuracy >= 80 ? '🏆' : accuracy >= 60 ? '🌟' : '📚'}
        </div>
        <h2 className="font-serif text-2xl text-text">Session Complete</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-cyan">{accuracy}%</div>
            <div className="text-xs text-text/50 mt-1">Accuracy</div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-amber">{correct}/{deck.length}</div>
            <div className="text-xs text-text/50 mt-1">Correct</div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-green-400">+{xpEarned}</div>
            <div className="text-xs text-text/50 mt-1">XP Earned</div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setCurrentIdx(0); setFlipped(false); setSeen(0); setCorrect(0); setXpEarned(0); setPhase('study') }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-surface-2 hover:border-border-2 text-sm text-text/70 transition-all"
          >
            <RotateCcw size={14} />Review Again
          </button>
          <button
            onClick={() => setPhase('build')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan text-void font-semibold text-sm hover:bg-cyan/90 transition-all"
          >
            New Deck <ChevronRight size={14} />
          </button>
        </div>
      </div>
    )
  }

  // Study phase
  return (
    <div className="max-w-xl mx-auto py-6 space-y-6">
      <SessionStats total={deck.length} seen={seen} correct={correct} xpEarned={xpEarned} />

      {/* Progress bar */}
      <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
        <div
          className="h-full bg-cyan rounded-full transition-all duration-500"
          style={{ width: `${(seen / deck.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        {currentCard && (
          <motion.div
            key={currentCard.id}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 40 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <CardFace
              card={currentCard}
              face="front"
              flipped={flipped}
              onFlip={() => setFlipped(f => !f)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* SM-2 grade buttons — only show after flip */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-4 gap-2"
          >
            {GRADES.map(({ grade, label, color }) => (
              <button
                key={grade}
                onClick={() => handleGrade(grade)}
                className={cn(
                  'py-2.5 rounded-xl border text-sm font-semibold transition-all hover:scale-105 active:scale-95',
                  color,
                )}
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Due in… hint */}
      {currentCard && (
        <div className="flex items-center justify-between text-xs text-text/30">
          <span className="flex items-center gap-1"><Clock size={10} />Interval: {currentCard.interval}d</span>
          <span>Ease: {currentCard.easeFactor.toFixed(2)}</span>
          <span>Rep: #{currentCard.repetitions}</span>
        </div>
      )}
    </div>
  )
}

// Stub for idb import — real implementation uses 'idb' package
const idb = { get: async (_: string) => null, set: async (_: string, __: unknown) => {} }
