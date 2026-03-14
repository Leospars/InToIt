import React, { useState, useCallback, useEffect } from 'react'
import { Brain, Zap, TrendingUp, TrendingDown, ChevronRight, RotateCcw, Lightbulb, AlertCircle } from 'lucide-react'
import { useStore, useAdaptiveDifficulty } from '@/store'
import { callLLMJson } from '@/lib/llmClient'
import type { QuizQuestion, DifficultyLevel, ConceptCategory } from '@/types'
import { cn } from '@/lib/utils'

// ─── AI-generated question schema ────────────────────────
const QUESTION_SCHEMA = `{
  "question": "string — clear question text",
  "options": ["string", "string", "string", "string"],
  "correctIndex": 0,
  "explanation": "string — why the answer is correct (2 sentences)",
  "misconception": "string — common mistake on this type of question",
  "aiInsight": "string — memorable tip or pattern to remember",
  "bloomLevel": "remember|understand|apply|analyze|evaluate|create"
}`

// ─── Difficulty label map ─────────────────────────────────
const DIFF_LABELS = ['Easy', 'Easy+', 'Medium', 'Medium+', 'Hard'] as const
const DIFF_COLORS = [
  'text-green-400 bg-green-400/10 border-green-400/20',
  'text-teal-400 bg-teal-400/10 border-teal-400/20',
  'text-amber bg-amber-dim border-amber/20',
  'text-orange-400 bg-orange-400/10 border-orange-400/20',
  'text-red-400 bg-red-400/10 border-red-400/20',
] as const

// ─── Adaptation Log ───────────────────────────────────────
interface AdaptLog { time: string; type: 'up' | 'down' | 'correct' | 'wrong' | 'info'; msg: string }

function useAdaptLog() {
  const [log, setLog] = useState<AdaptLog[]>([
    { time: now(), type: 'info', msg: 'System initialized. Waiting for first answer…' }
  ])
  const push = useCallback((type: AdaptLog['type'], msg: string) =>
    setLog(prev => [{ time: now(), type, msg }, ...prev].slice(0, 14)), [])
  return { log, push }
}

function now() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ─── Main Quiz Component ──────────────────────────────────
interface QuizEngineProps {
  conceptId?: string
  category?: ConceptCategory
  topicTitle?: string
}

export function QuizEngine({ conceptId, category = 'foundations', topicTitle = 'AI Agents' }: QuizEngineProps) {
  const provider = useStore(s => s.providers[s.activeProvider])
  const difficulty = useAdaptiveDifficulty()
  const recordAnswer = useStore(s => s.recordQuizAnswer)
  const resetQuiz = useStore(s => s.resetQuiz)
  const addXP = useStore(s => s.addXP)
  const streak = useStore(s => s.quizStreak)

  const [question, setQuestion] = useState<QuizQuestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [questionNum, setQuestionNum] = useState(1)
  const [sessionScore, setSessionScore] = useState(0)
  const [hintUsed, setHintUsed] = useState(false)
  const [hint, setHint] = useState('')
  const [hintLoading, setHintLoading] = useState(false)
  const { log, push } = useAdaptLog()

  const diffNames = ['very easy, beginner-friendly', 'easy', 'moderate', 'challenging, with nuance', 'hard and tricky, requiring deep understanding']

  const loadQuestion = useCallback(async () => {
    if (!provider.isEnabled && !provider.isLocal) return
    setLoading(true)
    setSelected(null)
    setAnswered(false)
    setHintUsed(false)
    setHint('')

    try {
      const q = await callLLMJson<QuizQuestion>(provider, `
Generate a multiple-choice quiz question about "${topicTitle}" in the context of AI agents and multi-agent systems.
Category: ${category}
Difficulty: ${diffNames[difficulty - 1]}
Question number: ${questionNum}

Make the question precise and educational. All 4 options should be plausible — avoid obviously wrong distractors.
Include a specific misconception that learners commonly have.
`, QUESTION_SCHEMA)
      setQuestion({ ...q, id: crypto.randomUUID(), conceptId: conceptId ?? '', category, difficulty: ['beginner','beginner','intermediate','intermediate','advanced'][difficulty-1] as DifficultyLevel, tags: [category] })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [provider, difficulty, category, topicTitle, questionNum, conceptId])

  useEffect(() => { loadQuestion() }, []) // eslint-disable-line

  const handleSelect = (idx: number) => {
    if (answered) return
    setSelected(idx)
    setAnswered(true)
    const correct = idx === question?.correctIndex

    recordAnswer(correct)
    if (correct) {
      const xpGain = 20 + difficulty * 10 + (streak > 2 ? 15 : 0) + (hintUsed ? -10 : 0)
      addXP(xpGain)
      setSessionScore(s => s + 1)
      push('correct', `Correct! +${xpGain} XP. Streak: ${streak + 1}`)
    } else {
      push('wrong', `Incorrect. Misconception flagged on "${topicTitle}"`)
    }
  }

  const handleNext = () => {
    setQuestionNum(n => n + 1)
    loadQuestion()
  }

  const handleHint = async () => {
    if (!question || hintUsed || !provider.isEnabled) return
    setHintLoading(true)
    setHintUsed(true)
    try {
      const h = await callLLMJson<{ hint: string }>(provider,
        `Give a one-sentence Socratic hint for: "${question.question}" — guide the student without revealing the answer.`,
        '{"hint":"string"}'
      )
      setHint(h.hint)
      push('info', 'Hint used — XP reduced for this question')
    } catch { setHint('Think about the core purpose of each option.') }
    finally { setHintLoading(false) }
  }

  if (!provider.isEnabled && !provider.isLocal) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Brain size={40} className="text-text/20 mb-4" />
        <p className="text-text/50 text-sm mb-2">No LLM provider configured</p>
        <p className="text-text/30 text-xs">Open Settings → LLM Providers to add your API key</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
      {/* Main quiz panel */}
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text/50">Q{questionNum}</span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', DIFF_COLORS[difficulty - 1])}>
              {DIFF_LABELS[difficulty - 1]}
            </span>
            {streak > 0 && (
              <span className="text-xs text-amber flex items-center gap-1">
                🔥 {streak} streak
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-text/40">
            Session: <span className="text-green-400 font-medium">{sessionScore}</span> correct
            <button onClick={() => { resetQuiz(); setSessionScore(0); setQuestionNum(1); loadQuestion() }} className="ml-2 p-1 hover:text-text/70 transition-colors">
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        {/* Question card */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-surface-3 rounded w-3/4" />
              <div className="h-4 bg-surface-3 rounded w-1/2" />
            </div>
          ) : (
            <p className="font-serif text-xl text-text leading-relaxed">
              {question?.question}
            </p>
          )}
        </div>

        {/* Hint */}
        {hint && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-violet-dim border border-violet/20 text-sm text-text/70 animate-slide-up">
            <Lightbulb size={14} className="text-violet mt-0.5 flex-shrink-0" />
            {hint}
          </div>
        )}

        {/* Options */}
        <div className="grid grid-cols-1 gap-2">
          {(['A','B','C','D'] as const).map((letter, idx) => {
            const opt = question?.options[idx]
            const isCorrect = idx === question?.correctIndex
            const isSelected = selected === idx
            let state: 'default' | 'correct' | 'wrong' | 'reveal' = 'default'
            if (answered) {
              if (isCorrect) state = 'correct'
              else if (isSelected) state = 'wrong'
              else state = 'reveal'
            }

            return (
              <button
                key={letter}
                disabled={answered || loading || !question}
                onClick={() => handleSelect(idx)}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border text-left transition-all text-sm',
                  state === 'default' && 'border-border bg-surface-2/50 hover:border-border-2 hover:bg-surface-2',
                  state === 'correct' && 'border-green-500/50 bg-green-500/10 text-green-300',
                  state === 'wrong' && 'border-red-500/50 bg-red-500/10 text-red-300',
                  state === 'reveal' && 'opacity-40',
                  (loading || !question) && 'opacity-30 cursor-not-allowed',
                )}
              >
                <span className={cn(
                  'w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0',
                  state === 'default' && 'bg-surface-3 text-text/60',
                  state === 'correct' && 'bg-green-500 text-white',
                  state === 'wrong' && 'bg-red-500 text-white',
                  state === 'reveal' && 'bg-surface-3 text-text/30',
                )}>
                  {letter}
                </span>
                {loading ? <div className="h-3 bg-surface-3 rounded w-32 animate-pulse" /> : opt}
              </button>
            )
          })}
        </div>

        {/* Feedback */}
        {answered && question && (
          <div className="space-y-3 animate-slide-up">
            <div className={cn(
              'p-4 rounded-xl border text-sm leading-relaxed',
              selected === question.correctIndex
                ? 'border-green-500/30 bg-green-500/8 text-green-200'
                : 'border-red-500/30 bg-red-500/8 text-red-200'
            )}>
              <div className="font-medium mb-1">
                {selected === question.correctIndex ? '✓ Correct!' : '✗ Not quite'}
              </div>
              {question.explanation}
            </div>

            {selected !== question.correctIndex && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-dim border border-amber/20 text-xs text-amber/80">
                <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                <div><span className="font-bold text-amber">Common misconception: </span>{question.misconception}</div>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 rounded-xl bg-cyan-dim border border-cyan/10 text-xs text-cyan/70">
              <Zap size={12} className="mt-0.5 flex-shrink-0 text-cyan" />
              <div><span className="font-bold text-cyan">Insight: </span>{question.aiInsight}</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleHint}
            disabled={answered || hintUsed || loading || !question}
            className="flex items-center gap-1.5 text-xs text-text/50 hover:text-text/70 border border-border hover:border-border-2 rounded-lg px-3 py-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Lightbulb size={12} />
            {hintLoading ? 'Getting hint…' : hintUsed ? 'Hint used' : '💡 Hint (−10 XP)'}
          </button>

          <button
            onClick={handleNext}
            disabled={!answered}
            className="flex items-center gap-2 bg-cyan text-void font-semibold text-sm px-5 py-2 rounded-xl hover:bg-cyan/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next Question
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* AI Brain panel */}
      <div className="space-y-4">
        {/* Difficulty meter */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="text-xs font-semibold text-text/50 uppercase tracking-wider mb-3">🧬 AI Difficulty Radar</div>
          <div className="text-xs text-text/40 mb-2">Current level</div>
          <div className="flex gap-1.5 mb-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className={cn(
                'flex-1 h-2 rounded-full transition-all duration-500',
                i <= difficulty
                  ? ['bg-green-400','bg-teal-400','bg-amber','bg-orange-400','bg-red-400'][difficulty-1]
                  : 'bg-surface-3'
              )} />
            ))}
          </div>
          <div className="text-xs text-text/40">
            {difficulty < 3
              ? 'Building foundations — answer more to level up'
              : difficulty < 5
              ? 'Intermediate — pushing your limits'
              : 'Expert level — maximum challenge'}
          </div>
        </div>

        {/* Adaptation log */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="text-xs font-semibold text-text/50 uppercase tracking-wider mb-3">📡 Adaptation Log</div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {log.map((entry, i) => (
              <div key={i} className="flex gap-2 text-[11px] py-1 border-b border-border/50 last:border-0">
                <span className="text-cyan/60 flex-shrink-0 font-mono">{entry.time}</span>
                <span className={cn(
                  entry.type === 'correct' && 'text-green-400',
                  entry.type === 'wrong' && 'text-red-400',
                  (entry.type === 'up' || entry.type === 'down' || entry.type === 'info') && 'text-amber/70',
                )}>
                  {entry.type === 'up' && <TrendingUp size={10} className="inline mr-1" />}
                  {entry.type === 'down' && <TrendingDown size={10} className="inline mr-1" />}
                  {entry.msg}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
