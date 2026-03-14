import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Bug, Brain, Sliders, ChevronRight, Timer, Send, Star, AlertTriangle } from 'lucide-react'
import { useStore } from '@/store'
import { callLLM, callLLMJson, streamLLM } from '@/lib/llmClient'
import { cn } from '@/lib/utils'
import type { ForgeDiscipline, BloomLevel } from '@/types'

// ═══════════════════════════════════════════════════════════
// THE FORGE — 4 Advanced Assessment Disciplines
// ═══════════════════════════════════════════════════════════

const DISCIPLINES: Array<{
  id: ForgeDiscipline; name: string; tagline: string
  icon: React.ReactNode; color: string; xp: number
}> = [
  {
    id: 'socratic-defense',
    name: 'Socratic Defense',
    tagline: 'Defend your AI architecture under Bloom\'s taxonomy examination',
    icon: <Shield size={22} />, color: 'text-cyan', xp: 100,
  },
  {
    id: 'prompt-autopsy',
    name: 'Prompt Autopsy',
    tagline: 'Find embedded errors in flawed AI output before the timer runs out',
    icon: <Bug size={22} />, color: 'text-amber', xp: 80,
  },
  {
    id: 'epistemic-gym',
    name: 'Epistemic Gym',
    tagline: 'AI-free timed reasoning — prove you understand fundamentals without tools',
    icon: <Brain size={22} />, color: 'text-violet', xp: 60,
  },
  {
    id: 'trust-calibration',
    name: 'Trust Calibration Lab',
    tagline: 'Configure agent autonomy for risk scenarios against expert consensus',
    icon: <Sliders size={22} />, color: 'text-pink', xp: 90,
  },
]

const BLOOM_LEVELS: BloomLevel[] = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']
const BLOOM_COLORS: Record<BloomLevel, string> = {
  remember: 'text-green-400', understand: 'text-teal-400', apply: 'text-cyan',
  analyze: 'text-amber', evaluate: 'text-orange-400', create: 'text-pink',
}

// ─── Socratic Defense ─────────────────────────────────────
function SocraticDefense() {
  const provider = useStore(s => s.providers[s.activeProvider])
  const addXP = useStore(s => s.addXP)
  const updateForge = useStore(s => s.updateForgeScore)

  const [topic, setTopic] = useState('Design a multi-agent customer support system')
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; text: string; bloom?: BloomLevel; score?: number }>>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionScore, setSessionScore] = useState(0)
  const [started, setStarted] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)

  const SYSTEM = `You are a rigorous Socratic examiner testing a student's understanding of AI agent architecture.
Topic under examination: "${topic}"
You probe understanding using Bloom's taxonomy levels: remember → understand → apply → analyze → evaluate → create.
After each student response, provide:
1. A JSON evaluation block: {"bloom":"<level>","score":<0-100>,"feedback":"<2 sentences>","nextQuestion":"<probing follow-up>"}
Then naturally continue the conversation with your next question.
Start at 'understand' level and escalate based on answer quality.`

  const startSession = async () => {
    setStarted(true)
    setLoading(true)
    setStreamingText('')
    const opening = await callLLM(provider, [
      { role: 'user', content: `Begin the Socratic examination on: "${topic}". Ask your opening question at the 'understand' level.` }
    ], { systemPrompt: SYSTEM, maxTokens: 400 })
    setMessages([{ role: 'ai', text: opening }])
    setLoading(false)
    setTimeout(() => chatRef.current?.scrollTo(0, 99999), 100)
  }

  const sendAnswer = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)
    setStreamingText('')

    const history = messages.map(m => ({ role: m.role === 'ai' ? 'assistant' as const : 'user' as const, content: m.text }))
    history.push({ role: 'user', content: userMsg })

    let full = ''
    for await (const chunk of streamLLM(provider, history, { systemPrompt: SYSTEM, maxTokens: 600 })) {
      full += chunk.delta
      setStreamingText(full)
      chatRef.current?.scrollTo(0, 99999)
    }

    // Extract JSON eval block if present
    const jsonMatch = full.match(/\{[^}]*"bloom"[^}]*\}/s)
    let bloom: BloomLevel | undefined
    let score = 0
    if (jsonMatch) {
      try {
        const ev = JSON.parse(jsonMatch[0])
        bloom = ev.bloom as BloomLevel
        score = ev.score as number
        setSessionScore(s => s + score)
        addXP(Math.round(score / 10))
      } catch { /* ignore */ }
    }

    setMessages(prev => [...prev, { role: 'ai', text: full.replace(/\{[^}]*"bloom"[^}]*\}/s, '').trim(), bloom, score }])
    setStreamingText('')
    setLoading(false)
    updateForge(sessionScore + score)
    setTimeout(() => chatRef.current?.scrollTo(0, 99999), 100)
  }

  if (!started) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <label className="text-xs text-text/50 mb-2 block">Architecture challenge to defend</label>
          <textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            rows={3}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-cyan/40 resize-none"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['Design a RAG pipeline', 'Build a code review agent', 'Multi-agent orchestration'].map(t => (
            <button key={t} onClick={() => setTopic(t)} className="p-2 rounded-lg border border-border bg-surface-2 hover:border-cyan/30 text-xs text-text/60 transition-all text-left">
              {t}
            </button>
          ))}
        </div>
        <button onClick={startSession} disabled={!topic.trim() || !provider.isEnabled && !provider.isLocal} className="w-full py-3 rounded-xl bg-cyan text-void font-semibold text-sm hover:bg-cyan/90 transition-all disabled:opacity-40">
          Begin Examination →
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 max-h-[70vh]">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text/40">{topic}</span>
        <span className="text-amber font-semibold">Score: {sessionScore}</span>
      </div>

      <div ref={chatRef} className="flex-1 overflow-y-auto space-y-4 bg-surface border border-border rounded-2xl p-5 min-h-64 max-h-96">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}
          >
            <div className={cn(
              'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
              msg.role === 'ai' ? 'bg-surface-2 border border-border text-text/90' : 'bg-cyan/10 border border-cyan/20 text-text',
            )}>
              {msg.text}
              {msg.bloom && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className={cn('font-semibold capitalize', BLOOM_COLORS[msg.bloom])}>
                    Bloom: {msg.bloom}
                  </span>
                  {msg.score !== undefined && (
                    <span className="text-text/40">Score: {msg.score}/100</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {streamingText && (
          <div className="bg-surface-2 border border-border rounded-2xl px-4 py-3 text-sm text-text/80 leading-relaxed max-w-[85%]">
            {streamingText}<span className="animate-pulse">▌</span>
          </div>
        )}
        {loading && !streamingText && (
          <div className="flex gap-2 items-center text-text/40 text-xs">
            <div className="w-2 h-2 rounded-full bg-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendAnswer()}
          placeholder="Defend your answer…"
          disabled={loading}
          className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-cyan/40 disabled:opacity-50"
        />
        <button onClick={sendAnswer} disabled={loading || !input.trim()} className="p-2.5 rounded-xl bg-cyan text-void disabled:opacity-40 transition-all hover:bg-cyan/90">
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

// ─── Prompt Autopsy ───────────────────────────────────────
function PromptAutopsy() {
  const provider = useStore(s => s.providers[s.activeProvider])
  const addXP = useStore(s => s.addXP)
  const [scenario, setScenario] = useState<{
    context: string; flawedOutput: string
    errors: Array<{ id: string; description: string; severity: 'critical' | 'moderate' | 'minor' }>
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedErrors, setSelectedErrors] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(120)
  const [timerActive, setTimerActive] = useState(false)

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return
    const t = setInterval(() => setTimeLeft(n => { if (n <= 1) { setTimerActive(false); setSubmitted(true); return 0 } return n - 1 }), 1000)
    return () => clearInterval(t)
  }, [timerActive, timeLeft])

  const generate = async () => {
    setLoading(true)
    setSubmitted(false)
    setSelectedErrors([])
    setTimeLeft(120)

    const data = await callLLMJson<typeof scenario>(
      provider,
      `Generate a Prompt Autopsy challenge for an AI practitioner.
Create a realistic AI-generated output that contains exactly 3–5 embedded errors.
These errors can be: hallucinated facts, incorrect reasoning, security vulnerabilities, 
biased conclusions, capability overstatements, or flawed agent logic.

Return JSON with:
- context: the original user request that produced the output (1 sentence)
- flawedOutput: the full AI-generated response with errors embedded (200-300 words, realistic-looking)
- errors: array of {id, description, severity} — but DON'T reference the errors in the output text itself`,
      `{
  "context": "string",
  "flawedOutput": "string",
  "errors": [{"id":"string","description":"string","severity":"critical|moderate|minor"}]
}`
    )
    setScenario(data)
    setLoading(false)
    setTimerActive(true)
  }

  const toggleError = (id: string) => {
    if (submitted) return
    setSelectedErrors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSubmit = () => {
    setSubmitted(true)
    setTimerActive(false)
    if (!scenario) return
    const found = selectedErrors.filter(id => scenario.errors.some(e => e.id === id))
    const precision = selectedErrors.length > 0 ? found.length / selectedErrors.length : 0
    const recall = scenario.errors.length > 0 ? found.length / scenario.errors.length : 0
    const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0
    addXP(Math.round(f1 * 80))
  }

  const timerColor = timeLeft > 60 ? 'text-green-400' : timeLeft > 30 ? 'text-amber' : 'text-red-400'

  return (
    <div className="space-y-4">
      {!scenario ? (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">🔬</div>
          <p className="text-text/50 text-sm mb-6">An AI-generated output with hidden errors will appear. Find them all before time runs out.</p>
          <button onClick={generate} disabled={loading || !provider.isEnabled && !provider.isLocal} className="px-6 py-3 rounded-xl bg-amber text-void font-semibold text-sm hover:bg-amber/90 transition-all disabled:opacity-40">
            {loading ? 'Generating scenario…' : 'Start Autopsy'}
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="text-xs text-text/40">Context: <span className="text-text/70">{scenario.context}</span></div>
            <span className={cn('font-mono font-semibold text-sm flex items-center gap-1', timerColor)}>
              <Timer size={12} />{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
          </div>

          <div className="bg-surface-2 border border-amber/20 rounded-2xl p-5 text-sm text-text/80 leading-relaxed font-mono whitespace-pre-wrap">
            {scenario.flawedOutput}
          </div>

          <div className="space-y-2">
            <div className="text-xs text-text/50">Check all errors you identified in the output above:</div>
            {scenario.errors.map(err => {
              const selected = selectedErrors.includes(err.id)
              const isReal = true // all are real; we're checking which ones user finds
              const showResult = submitted
              return (
                <button
                  key={err.id}
                  onClick={() => toggleError(err.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition-all',
                    !showResult && selected && 'border-amber/40 bg-amber-dim',
                    !showResult && !selected && 'border-border bg-surface-2 hover:border-border-2',
                    showResult && selected && 'border-green-500/50 bg-green-500/10 text-green-300',
                    showResult && !selected && 'border-red-500/30 bg-red-500/5 text-red-400/70',
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                    selected ? 'border-amber bg-amber' : 'border-border',
                  )}>
                    {selected && <span className="text-void text-[9px] font-bold">✓</span>}
                  </div>
                  <span className="flex-1">{submitted ? err.description : `Error ${err.id}`}</span>
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded font-medium',
                    err.severity === 'critical' && 'bg-red-500/20 text-red-400',
                    err.severity === 'moderate' && 'bg-amber/20 text-amber',
                    err.severity === 'minor' && 'bg-surface-3 text-text/40',
                  )}>
                    {err.severity}
                  </span>
                </button>
              )
            })}
          </div>

          {!submitted && (
            <button onClick={handleSubmit} className="w-full py-2.5 rounded-xl bg-amber text-void font-semibold text-sm hover:bg-amber/90 transition-all">
              Submit Autopsy
            </button>
          )}
          {submitted && (
            <div className="text-center space-y-3 animate-slide-up">
              <div className="text-3xl">{selectedErrors.length === scenario.errors.length ? '🎯' : '🔍'}</div>
              <p className="text-sm text-text/70">
                Found {selectedErrors.filter(id => scenario.errors.some(e => e.id === id)).length} of {scenario.errors.length} errors
              </p>
              <button onClick={generate} className="px-4 py-2 rounded-xl border border-border text-sm text-text/60 hover:text-text transition-all">
                New Autopsy
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Epistemic Gym ────────────────────────────────────────
function EpistemicGym() {
  const [challenge, setChallenge] = useState<{
    question: string; hint: string; modelAnswer: string; timeLimit: number
  } | null>(null)
  const [answer, setAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [evaluation, setEvaluation] = useState('')
  const provider = useStore(s => s.providers[s.activeProvider])
  const addXP = useStore(s => s.addXP)

  useEffect(() => {
    if (!challenge || timeLeft <= 0 || submitted) return
    const t = setInterval(() => setTimeLeft(n => { if (n <= 1) { setSubmitted(true); return 0 } return n - 1 }), 1000)
    return () => clearInterval(t)
  }, [challenge, timeLeft, submitted])

  const generate = async () => {
    setSubmitted(false); setAnswer(''); setEvaluation('')
    const data = await callLLMJson<typeof challenge>(
      provider,
      `Create an Epistemic Gym challenge — a fundamental AI/agents question that requires genuine reasoning.
No lookup needed. Tests core understanding. No code. No tool use.
Return: {question, hint (subtle nudge), modelAnswer (ideal answer), timeLimit (seconds, 60-180)}`,
      `{"question":"string","hint":"string","modelAnswer":"string","timeLimit":90}`
    )
    setChallenge(data)
    setTimeLeft(data?.timeLimit ?? 90)
  }

  const submit = async () => {
    setSubmitted(true)
    if (!challenge) return
    const ev = await callLLM(provider, [{ role: 'user', content: `Model answer: "${challenge.modelAnswer}"\nStudent answer: "${answer}"\nEvaluate in 2 sentences: what they got right and wrong.` }], { maxTokens: 200 })
    setEvaluation(ev)
    addXP(answer.length > 30 ? 40 : 15)
  }

  if (!challenge) return (
    <div className="text-center py-8 space-y-4">
      <div className="text-5xl">🧠</div>
      <p className="text-text/50 text-sm max-w-sm mx-auto">No AI assistance. No search. Pure reasoning. Prove you understand the fundamentals.</p>
      <button onClick={generate} disabled={!provider.isEnabled && !provider.isLocal} className="px-6 py-3 rounded-xl bg-violet text-white font-semibold text-sm hover:bg-violet/90 transition-all disabled:opacity-40">
        Start Challenge
      </button>
    </div>
  )

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <span className="text-xs text-violet font-semibold uppercase tracking-wider">🧠 AI-Free Zone</span>
        <span className={cn('font-mono font-semibold', timeLeft > 30 ? 'text-green-400' : 'text-red-400')}>
          {timeLeft}s
        </span>
      </div>
      <div className="p-5 rounded-2xl border border-violet/30 bg-violet-dim">
        <p className="font-serif text-lg text-text leading-relaxed">{challenge.question}</p>
      </div>
      {!submitted && <p className="text-xs text-text/30 italic">Hint: {challenge.hint}</p>}
      <textarea
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        disabled={submitted}
        placeholder="Write your answer from memory…"
        rows={5}
        className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-violet/40 resize-none"
      />
      {!submitted ? (
        <button onClick={submit} disabled={!answer.trim()} className="w-full py-2.5 rounded-xl bg-violet text-white font-semibold text-sm hover:bg-violet/90 disabled:opacity-40 transition-all">
          Submit Answer
        </button>
      ) : (
        <div className="space-y-3 animate-slide-up">
          <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/8 text-sm text-text/80">
            <div className="text-xs text-green-400 font-semibold mb-1">Model Answer</div>
            {challenge.modelAnswer}
          </div>
          {evaluation && (
            <div className="p-3 rounded-xl border border-violet/20 bg-violet-dim text-xs text-text/70">{evaluation}</div>
          )}
          <button onClick={generate} className="w-full py-2 rounded-xl border border-border text-sm text-text/60 hover:text-text transition-all">
            Next Challenge
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Trust Calibration Lab ────────────────────────────────
function TrustCalibration() {
  const provider = useStore(s => s.providers[s.activeProvider])
  const addXP = useStore(s => s.addXP)
  const [scenario, setScenario] = useState<{
    description: string; riskLevel: 'low' | 'medium' | 'high' | 'critical'
    expertAutonomy: number; rationale: string
  } | null>(null)
  const [autonomy, setAutonomy] = useState(50)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true); setSubmitted(false); setAutonomy(50)
    const data = await callLLMJson<typeof scenario>(
      provider,
      `Create a Trust Calibration scenario for AI agent autonomy.
Describe a real-world task an AI agent might perform. Include risk level.
Expert consensus on appropriate autonomy (0=full human control, 100=full AI autonomy).
Return JSON with: description, riskLevel (low/medium/high/critical), expertAutonomy (0-100), rationale`,
      `{"description":"string","riskLevel":"low|medium|high|critical","expertAutonomy":50,"rationale":"string"}`
    )
    setScenario(data)
    setLoading(false)
  }

  const riskColors = { low: 'text-green-400', medium: 'text-amber', high: 'text-orange-400', critical: 'text-red-400' }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {!scenario ? (
        <div className="text-center py-8 space-y-4">
          <div className="text-5xl">⚖️</div>
          <p className="text-text/50 text-sm max-w-xs mx-auto">Set the right level of AI autonomy for risk scenarios. Scored against expert consensus.</p>
          <button onClick={generate} disabled={loading || !provider.isEnabled && !provider.isLocal} className="px-6 py-3 rounded-xl bg-pink text-white font-semibold text-sm hover:bg-pink/90 disabled:opacity-40 transition-all">
            {loading ? 'Generating…' : 'New Scenario'}
          </button>
        </div>
      ) : (
        <>
          <div className="p-5 rounded-2xl border border-border bg-surface">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} className={scenario.riskLevel ? riskColors[scenario.riskLevel] : ''} />
              <span className={cn('text-xs font-semibold uppercase tracking-wider', riskColors[scenario.riskLevel ?? 'low'])}>
                {scenario.riskLevel} risk
              </span>
            </div>
            <p className="text-sm text-text leading-relaxed">{scenario.description}</p>
          </div>

          <div className="space-y-3">
            <label className="text-xs text-text/50">Agent Autonomy Level: <span className="text-text font-semibold">{autonomy}%</span></label>
            <div className="flex items-center gap-3 text-xs text-text/40">
              <span>Full Human Control</span>
              <input type="range" min={0} max={100} value={autonomy} onChange={e => setAutonomy(Number(e.target.value))} disabled={submitted} className="flex-1" />
              <span>Full AI Autonomy</span>
            </div>
            <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
              <div className="h-full bg-pink rounded-full transition-all" style={{ width: `${autonomy}%` }} />
            </div>
          </div>

          {!submitted ? (
            <button onClick={() => {
              setSubmitted(true)
              const diff = Math.abs(autonomy - (scenario?.expertAutonomy ?? 50))
              const score = Math.max(0, 100 - diff)
              addXP(Math.round(score / 2))
            }} className="w-full py-2.5 rounded-xl bg-pink text-white font-semibold text-sm hover:bg-pink/90 transition-all">
              Submit Calibration
            </button>
          ) : (
            <div className="space-y-3 animate-slide-up">
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-border">
                <div>
                  <div className="text-xs text-text/40 mb-1">Your answer</div>
                  <div className="font-semibold text-lg text-text">{autonomy}%</div>
                </div>
                <div className="text-2xl">vs</div>
                <div className="text-right">
                  <div className="text-xs text-text/40 mb-1">Expert consensus</div>
                  <div className="font-semibold text-lg text-cyan">{scenario.expertAutonomy}%</div>
                </div>
              </div>
              <div className="p-3 rounded-xl border border-cyan/20 bg-cyan-dim text-xs text-text/70">
                <span className="text-cyan font-semibold">Rationale: </span>{scenario.rationale}
              </div>
              <div className="text-center text-sm font-semibold">
                {Math.abs(autonomy - scenario.expertAutonomy) <= 10 ? '🎯 Excellent calibration!' :
                 Math.abs(autonomy - scenario.expertAutonomy) <= 25 ? '👍 Close — review the rationale' :
                 '📚 Study the human-AI delegation spectrum'}
              </div>
              <button onClick={generate} className="w-full py-2 rounded-xl border border-border text-sm text-text/60 hover:text-text transition-all">
                Next Scenario
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Main Forge Page ──────────────────────────────────────
export function ForgeSection() {
  const [active, setActive] = useState<ForgeDiscipline | null>(null)
  const forgeScore = useStore(s => s.user.forgeScore)

  const renderDiscipline = () => {
    switch (active) {
      case 'socratic-defense': return <SocraticDefense />
      case 'prompt-autopsy':   return <PromptAutopsy />
      case 'epistemic-gym':    return <EpistemicGym />
      case 'trust-calibration': return <TrustCalibration />
    }
  }

  if (active) {
    const meta = DISCIPLINES.find(d => d.id === active)!
    return (
      <div className="max-w-3xl mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setActive(null)} className="text-xs text-text/40 hover:text-text/70 transition-colors flex items-center gap-1">
            ← The Forge
          </button>
          <div className="flex items-center gap-2">
            <span className={cn('text-lg', meta.color)}>{meta.icon}</span>
            <span className="font-semibold text-sm text-text">{meta.name}</span>
          </div>
          <span className="text-xs text-amber">Forge Score: {forgeScore}</span>
        </div>
        {renderDiscipline()}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div>
        <h2 className="font-serif text-3xl text-text mb-1">The Forge</h2>
        <p className="text-text/50 text-sm">
          4 advanced assessment disciplines. Forge Score: <span className="text-amber font-semibold">{forgeScore}</span>/400
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DISCIPLINES.map(d => (
          <button
            key={d.id}
            onClick={() => setActive(d.id)}
            className="group p-6 rounded-2xl border border-border bg-surface hover:border-border-2 hover:bg-surface-2 transition-all text-left"
          >
            <div className={cn('mb-4 transition-transform group-hover:scale-110', d.color)}>{d.icon}</div>
            <div className="font-semibold text-text mb-2">{d.name}</div>
            <div className="text-xs text-text/50 leading-relaxed mb-4">{d.tagline}</div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber">+{d.xp} XP max</span>
              <ChevronRight size={14} className="text-text/30 group-hover:text-text/60 transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
