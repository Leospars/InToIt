import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, BookOpen, Map, Layers, HelpCircle,
  GitBranch, Hammer, FlaskConical, Settings,
  Zap, Flame, Star, Menu, X, ChevronUp,
} from 'lucide-react'
import { useStore, useUser, useXP, useStreak, useSection, useTheme } from '@/store'
import { SettingsSheet } from '@/components/settings/SettingsSheet'
import { QuizEngine } from '@/components/quiz/QuizEngine'
import { FlashCards } from '@/components/learning/flashcards/FlashCards'
import { ForgeSection } from '@/components/forge/ForgeSection'
import { NeuroLab } from '@/components/lab/NeuroLab'
import { LearningTracks } from '@/components/learning/tracks/LearningTracks'
import { LearningAtlas } from '@/components/atlas/LearningAtlas'
import { AgentPatterns } from '@/components/visualization/AgentPatterns'
import { formatXP, applyTheme, cn } from '@/lib/utils'
import type { SectionId, ThemeId } from '@/types'
import { XP_PER_LEVEL } from '@/lib/providers'

// ─── Theme definitions ────────────────────────────────────
const THEMES: Array<{ id: ThemeId; name: string; isDark: boolean; preview: string }> = [
  { id: 'void',      name: 'Void',       isDark: true,  preview: 'bg-[#050508]' },
  { id: 'nebula',    name: 'Nebula',     isDark: true,  preview: 'bg-[#0d0a1e]' },
  { id: 'matrix',    name: 'Matrix',     isDark: true,  preview: 'bg-[#050e05]' },
  { id: 'aurora',    name: 'Aurora',     isDark: true,  preview: 'bg-[#050d12]' },
  { id: 'obsidian',  name: 'Obsidian',   isDark: true,  preview: 'bg-[#0c0c0e]' },
  { id: 'midnight',  name: 'Midnight',   isDark: true,  preview: 'bg-[#080c18]' },
  { id: 'deep-sea',  name: 'Deep Sea',   isDark: true,  preview: 'bg-[#030e12]' },
  { id: 'carbon',    name: 'Carbon',     isDark: true,  preview: 'bg-[#111214]' },
  { id: 'crimson',   name: 'Crimson',    isDark: true,  preview: 'bg-[#120508]' },
  { id: 'forest',    name: 'Forest',     isDark: true,  preview: 'bg-[#060e06]' },
  { id: 'copper',    name: 'Copper',     isDark: true,  preview: 'bg-[#120c05]' },
  { id: 'moonstone', name: 'Moonstone',  isDark: true,  preview: 'bg-[#0b0c12]' },
  { id: 'paper',     name: 'Paper',      isDark: false, preview: 'bg-[#f8f6f0]' },
  { id: 'daybreak',  name: 'Daybreak',   isDark: false, preview: 'bg-[#f0f4ff]' },
  { id: 'chalk',     name: 'Chalk',      isDark: false, preview: 'bg-[#fafafa]' },
  { id: 'parchment', name: 'Parchment',  isDark: false, preview: 'bg-[#f5f0e8]' },
  { id: 'cloud',     name: 'Cloud',      isDark: false, preview: 'bg-[#f0f6ff]' },
]

// ─── Nav items ────────────────────────────────────────────
const NAV_ITEMS: Array<{ id: SectionId; label: string; icon: React.ReactNode }> = [
  { id: 'home',      label: 'Home',      icon: <Home size={16} /> },
  { id: 'learn',     label: 'Learn',     icon: <BookOpen size={16} /> },
  { id: 'atlas',     label: 'Atlas',     icon: <Map size={16} /> },
  { id: 'flashcards',label: 'Cards',     icon: <Layers size={16} /> },
  { id: 'quiz',      label: 'Quiz',      icon: <HelpCircle size={16} /> },
  { id: 'patterns',  label: 'Patterns',  icon: <GitBranch size={16} /> },
  { id: 'forge',     label: 'Forge',     icon: <Hammer size={16} /> },
  { id: 'lab',       label: 'Lab',       icon: <FlaskConical size={16} /> },
]

// ─── XP Toast ─────────────────────────────────────────────
function XPToast({ xp, onDone }: { xp: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.95 }}
      className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-cyan/90 text-void px-4 py-2 rounded-full text-sm font-bold shadow-glow-cyan"
    >
      <Zap size={14} />+{xp} XP
    </motion.div>
  )
}

// ─── Home Dashboard ───────────────────────────────────────
function HomeDashboard() {
  const user = useUser()
  const { xp, level } = useXP()
  const streak = useStreak()
  const setSection = useStore(s => s.setSection)
  const openSettings = useStore(s => s.openSettings)
  const activeProvider = useStore(s => s.providers[s.activeProvider])
  const xpInLevel = xp % XP_PER_LEVEL
  const xpPct = (xpInLevel / XP_PER_LEVEL) * 100

  const hasProvider = activeProvider.isEnabled || activeProvider.isLocal

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-8">
        <div className="absolute inset-0 bg-glow-cyan opacity-50 pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40 pointer-events-none" />
        <div className="relative">
          <div className="text-xs text-cyan font-semibold uppercase tracking-widest mb-2">INTOIT Learning</div>
          <h1 className="font-serif text-4xl text-text mb-3">
            AI Agent Intelligence<br />
            <span className="text-cyan">Platform</span>
          </h1>
          <p className="text-text/60 text-sm max-w-lg leading-relaxed">
            59 core concepts. 67+ agent patterns. 6 neuro-learning paradigms.
            Adaptive quizzing, spaced repetition, and the Forge — all powered by your own LLM.
          </p>
          {!hasProvider && (
            <button
              onClick={openSettings}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber text-void font-semibold text-sm hover:bg-amber/90 transition-all"
            >
              ⚡ Configure LLM Provider to Start
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Level', value: level, icon: <Star size={14} className="text-amber" />, sub: `${formatXP(xpInLevel)}/${formatXP(XP_PER_LEVEL)} XP` },
          { label: 'Streak', value: `${streak}d`, icon: <Flame size={14} className="text-orange-400" />, sub: 'current streak' },
          { label: 'Total XP', value: formatXP(xp), icon: <Zap size={14} className="text-cyan" />, sub: user.completedConcepts.length + ' concepts' },
          { label: 'Forge', value: user.forgeScore, icon: <Hammer size={14} className="text-violet" />, sub: 'forge score' },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-border rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-xs text-text/50 mb-2">{s.icon}{s.label}</div>
            <div className="font-semibold text-xl text-text">{s.value}</div>
            <div className="text-xs text-text/30 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* XP bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-text/40">
          <span>Level {level}</span>
          <span>Level {level + 1}</span>
        </div>
        <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan to-violet rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Quick launch */}
      <div>
        <div className="text-xs text-text/50 uppercase tracking-wider mb-4">Jump in</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'quiz' as SectionId,       label: 'Adaptive Quiz',   icon: '🧠', desc: 'AI-generated questions' },
            { id: 'flashcards' as SectionId, label: 'Flash Cards',     icon: '🃏', desc: 'SM-2 spaced repetition' },
            { id: 'patterns' as SectionId,   label: 'Agent Patterns',  icon: '⚙️', desc: '67+ with flow diagrams' },
            { id: 'forge' as SectionId,      label: 'The Forge',       icon: '🔨', desc: '4 advanced challenges' },
            { id: 'lab' as SectionId,        label: 'Neuro Lab',       icon: '🧪', desc: '6 cognitive paradigms' },
            { id: 'atlas' as SectionId,      label: 'Learning Atlas',  icon: '🗺️', desc: 'D3 concept taxonomy' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className="group p-4 rounded-2xl border border-border bg-surface hover:border-border-2 hover:bg-surface-2 transition-all text-left"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-sm font-medium text-text mb-0.5">{item.label}</div>
              <div className="text-xs text-text/40">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Theme selector */}
      <div>
        <div className="text-xs text-text/50 uppercase tracking-wider mb-3">Theme — 17 options</div>
        <div className="flex flex-wrap gap-2">
          {THEMES.map(t => (
            <ThemeButton key={t.id} theme={t} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ThemeButton({ theme }: { theme: typeof THEMES[0] }) {
  const current = useTheme()
  const setTheme = useStore(s => s.setTheme)
  return (
    <button
      onClick={() => { setTheme(theme.id); applyTheme(theme.id) }}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all',
        current === theme.id ? 'border-cyan/40 text-cyan' : 'border-border text-text/50 hover:border-border-2 hover:text-text/70'
      )}
    >
      <div className={cn('w-3 h-3 rounded-full border border-white/20', theme.preview)} />
      {theme.name}
    </button>
  )
}

// ─── Learning Section (Capsule tracks) ────────────────────
function LearnSection() {
  const provider = useStore(s => s.providers[s.activeProvider])
  const [topic, setTopic] = useState('ReAct Agent Pattern')
  const [stage, setStage] = useState<'learn' | 'quiz' | 'apply' | 'reflect' | 'expand'>('learn')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const addXP = useStore(s => s.addXP)
  const { callLLM } = require('@/lib/llmClient') // dynamic import trick for brevity

  const STAGES = ['learn', 'quiz', 'apply', 'reflect', 'expand'] as const
  const STAGE_PROMPTS: Record<typeof stage, string> = {
    learn:   `Explain "${topic}" in AI agents in 3-4 clear paragraphs. Use concrete examples. Markdown OK.`,
    quiz:    `Give me 3 short-answer quiz questions about "${topic}". Number them 1-3.`,
    apply:   `Give me a hands-on application challenge for "${topic}". Include a starter code snippet.`,
    reflect: `What are the key insights, tradeoffs, and mental models to retain about "${topic}"? Use bullet points.`,
    expand:  `What adjacent concepts, advanced topics, and open research questions relate to "${topic}"?`,
  }

  const loadStage = async (s: typeof stage) => {
    if (!provider.isEnabled && !provider.isLocal) return
    setStage(s); setLoading(true); setContent('')
    try {
      const { callLLM } = await import('@/lib/llmClient')
      const resp = await callLLM(provider, [{ role: 'user', content: STAGE_PROMPTS[s] }], { maxTokens: 800 })
      setContent(resp)
      addXP(15)
    } catch { setContent('Error loading content — check your provider configuration.') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="Enter any AI agents topic…"
          className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-cyan/40"
        />
        <button
          onClick={() => loadStage('learn')}
          disabled={!topic.trim() || !provider.isEnabled && !provider.isLocal}
          className="px-5 py-2.5 rounded-xl bg-cyan text-void font-semibold text-sm hover:bg-cyan/90 disabled:opacity-40 transition-all"
        >
          Start Learning
        </button>
      </div>

      {/* 5-stage capsule nav */}
      <div className="flex gap-1 bg-surface-2 p-1 rounded-xl overflow-x-auto">
        {STAGES.map((s, i) => (
          <button
            key={s}
            onClick={() => loadStage(s)}
            className={cn(
              'flex-1 min-w-0 px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap',
              stage === s ? 'bg-surface text-text shadow-sm' : 'text-text/40 hover:text-text/70',
            )}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-64">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[100, 80, 90, 70, 85].map((w, i) => (
              <div key={i} className="h-3 bg-surface-3 rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : content ? (
          <div
            className="prose prose-invert prose-sm max-w-none text-text/85 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code class="bg-surface-3 px-1 rounded text-cyan text-xs">$1</code>') }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <BookOpen size={32} className="text-text/20" />
            <p className="text-text/40 text-sm">Enter a topic and click Start Learning</p>
          </div>
        )}
      </div>

      {/* 8 Exploration modes */}
      {content && (
        <div>
          <div className="text-xs text-text/40 mb-3">8 ways to explore this topic</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: '🗣️ Explain Simply', prompt: `Explain "${topic}" like I'm 10 years old` },
              { label: '🎯 Quiz Me', prompt: `Quiz me on "${topic}" with 5 MCQ questions` },
              { label: '🌐 Related Ideas', prompt: `What concepts connect to "${topic}"?` },
              { label: '⚡ Debate Mode', prompt: `What are the strongest arguments for AND against "${topic}"?` },
              { label: '📰 Latest Research', prompt: `What are the latest developments in "${topic}"?` },
              { label: '🧩 Analogies', prompt: `Explain "${topic}" using 3 creative analogies` },
              { label: '💻 Show Code', prompt: `Show working code implementing "${topic}" in Python` },
              { label: '❓ Ask Anything', prompt: topic },
            ].map(({ label, prompt }) => (
              <button
                key={label}
                onClick={async () => {
                  if (!provider.isEnabled && !provider.isLocal) return
                  setLoading(true); setContent('')
                  const { callLLM } = await import('@/lib/llmClient')
                  const resp = await callLLM(provider, [{ role: 'user', content: prompt }], { maxTokens: 600 })
                  setContent(resp); setLoading(false)
                }}
                className="p-2 rounded-lg border border-border bg-surface-2 hover:border-border-2 text-xs text-text/60 hover:text-text transition-all text-left"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Root App ─────────────────────────────────────────────
export default function App() {
  const section = useSection()
  const setSection = useStore(s => s.setSection)
  const openSettings = useStore(s => s.openSettings)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [xpToast, setXpToast] = useState<number | null>(null)

  // Track XP changes for toast
  const xp = useStore(s => s.user.xp)
  const prevXP = React.useRef(xp)
  useEffect(() => {
    if (xp > prevXP.current) {
      setXpToast(xp - prevXP.current)
    }
    prevXP.current = xp
  }, [xp])

  const renderSection = () => {
    switch (section) {
      case 'home':       return <HomeDashboard />
      case 'learn':      return <LearningTracks />
      case 'atlas':      return <LearningAtlas />
      case 'flashcards': return <FlashCards />
      case 'quiz':       return <QuizEngine topicTitle="AI Agents" category="foundations" />
      case 'patterns':   return <AgentPatterns />
      case 'forge':      return <ForgeSection />
      case 'lab':        return <NeuroLab />
      default:           return <HomeDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-void text-text font-sans" data-theme="void">
      {/* Global background */}
      <div className="fixed inset-0 bg-glow-cyan pointer-events-none z-0" />
      <div className="fixed inset-0 bg-glow-amber pointer-events-none z-0" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-deep/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">
          <button onClick={() => setSection('home')} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan text-sm font-bold">I</div>
            <span className="font-serif text-lg text-text">INTOIT</span>
            <span className="hidden sm:block text-xs text-text/30 font-sans">Learning</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  section === item.id ? 'bg-cyan/10 text-cyan' : 'text-text/50 hover:text-text hover:bg-surface-2',
                )}
              >
                {item.icon}{item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <XPBar />
            <button onClick={openSettings} className="p-2 rounded-lg text-text/50 hover:text-text hover:bg-surface-2 transition-all">
              <Settings size={16} />
            </button>
            <button onClick={() => setMobileNavOpen(m => !m)} className="lg:hidden p-2 rounded-lg text-text/50 hover:text-text hover:bg-surface-2 transition-all">
              {mobileNavOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-border overflow-hidden"
            >
              <div className="grid grid-cols-4 gap-1 p-3">
                {NAV_ITEMS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setSection(item.id); setMobileNavOpen(false) }}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-all',
                      section === item.id ? 'bg-cyan/10 text-cyan' : 'text-text/50 hover:text-text hover:bg-surface-2',
                    )}
                  >
                    {item.icon}{item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main content */}
      <main className="relative z-10 px-4 sm:px-6 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {renderSection()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modals & overlays */}
      <SettingsSheet />

      {/* XP toast */}
      <AnimatePresence>
        {xpToast !== null && (
          <XPToast xp={xpToast} onDone={() => setXpToast(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── XP Bar widget ────────────────────────────────────────
function XPBar() {
  const { xp, level } = useXP()
  const xpPct = ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100
  return (
    <div className="hidden sm:flex items-center gap-2 bg-surface border border-border rounded-full px-3 py-1.5">
      <Zap size={11} className="text-cyan" />
      <span className="text-xs text-text/70">Lv{level}</span>
      <div className="w-16 h-1.5 bg-surface-3 rounded-full overflow-hidden">
        <div className="h-full bg-cyan rounded-full transition-all duration-500" style={{ width: `${xpPct}%` }} />
      </div>
      <span className="text-xs text-text/40 font-mono">{formatXP(xp)}</span>
    </div>
  )
}
