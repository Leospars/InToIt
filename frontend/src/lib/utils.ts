import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { FlashCard } from '@/types'
import { SM2_DEFAULT_EASE, SM2_MIN_EASE, SM2_INITIAL_INTERVALS } from '@/lib/providers'

// ─── className helper ─────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── XP formatter ─────────────────────────────────────────
export function formatXP(xp: number): string {
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`
  if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}K`
  return String(xp)
}

// ─── Relative time ────────────────────────────────────────
export function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60_000)
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}

// ─── SM-2 Spaced Repetition Algorithm ────────────────────
// grade: 0=complete_blackout, 1=wrong, 2=wrong_but_recalled,
//        3=correct_hard, 4=correct, 5=correct_easy
export function sm2Update(card: FlashCard, grade: 0 | 1 | 2 | 3 | 4 | 5): FlashCard {
  let { easeFactor, repetitions, interval } = card
  const now = Date.now()

  if (grade >= 3) {
    // Correct
    if (repetitions === 0) interval = SM2_INITIAL_INTERVALS[0]
    else if (repetitions === 1) interval = SM2_INITIAL_INTERVALS[1]
    else interval = Math.round(interval * easeFactor)

    repetitions += 1
    easeFactor = Math.max(SM2_MIN_EASE, easeFactor + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  } else {
    // Wrong — reset to beginning
    repetitions = 0
    interval = 1
  }

  return {
    ...card,
    easeFactor,
    repetitions,
    interval,
    nextReview: now + interval * 86_400_000,
  }
}

export function isDue(card: FlashCard): boolean {
  return card.nextReview <= Date.now()
}

// ─── Shuffle array ────────────────────────────────────────
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Truncate text ────────────────────────────────────────
export function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen - 3) + '…' : text
}

// ─── Parse streamed JSON partial ─────────────────────────
export function extractJSON(text: string): string {
  const match = text.match(/```json\n?([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
  return match ? match[1].trim() : text.trim()
}

// ─── Debounce ─────────────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: unknown[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

// ─── Copy to clipboard ────────────────────────────────────
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// ─── Theme CSS vars injector ─────────────────────────────
export function applyTheme(themeId: string) {
  document.documentElement.setAttribute('data-theme', themeId)
}

// ─── Detect reduced motion ────────────────────────────────
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
