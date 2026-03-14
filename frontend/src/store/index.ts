import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type {
  AppState, LLMProviderId, LLMProviderConfig,
  SearchProviderId, SearchProviderConfig,
  UserProfile, TrackId, ThemeId, SectionId,
  STTConfig, TTSConfig, NarrationConfig, BackendConfig,
  FlashCard, QuizQuestion,
} from '@/types'
import { DEFAULT_PROVIDERS, DEFAULT_SEARCH_PROVIDERS, XP_PER_LEVEL } from '@/lib/providers'

// ─── Default User Profile ─────────────────────────────────
const defaultUser: UserProfile = {
  id: crypto.randomUUID(),
  displayName: 'Learner',
  level: 1, xp: 0, streak: 0,
  lastActiveDate: '',
  completedConcepts: [], completedCards: [],
  masteredTopics: [], badges: [],
  selectedTrack: 'foundations',
  difficultyPreference: 'beginner',
  theme: 'void',
  reducedMotion: false,
  photosensitivityMode: false,
  forgeScore: 0, labScore: 0,
}

// ─── Store Interface ──────────────────────────────────────
interface Store extends AppState {
  // Provider actions
  setProvider: (id: LLMProviderId, config: Partial<LLMProviderConfig>) => void
  setActiveProvider: (id: LLMProviderId) => void
  setSearchProvider: (id: SearchProviderId, config: Partial<SearchProviderConfig>) => void
  setActiveSearch: (id: SearchProviderId) => void
  setBackend: (config: Partial<BackendConfig>) => void
  setSTTConfig: (config: Partial<STTConfig>) => void
  setTTSConfig: (config: Partial<TTSConfig>) => void
  setNarration: (config: Partial<NarrationConfig>) => void

  // User actions
  setTheme: (theme: ThemeId) => void
  setTrack: (track: TrackId) => void
  addXP: (amount: number) => void
  incrementStreak: () => void
  resetStreak: () => void
  markConceptComplete: (id: string) => void
  markCardComplete: (id: string) => void
  updateForgeScore: (score: number) => void
  updateLabScore: (score: number) => void
  setReducedMotion: (v: boolean) => void
  setPhotosensitivity: (v: boolean) => void

  // UI
  setSection: (section: SectionId) => void
  openSettings: () => void
  closeSettings: () => void

  // Export / Import
  exportConfig: () => string
  importConfig: (json: string) => void

  // Spaced repetition queue
  dueCards: string[]
  enqueueDueCards: (cards: FlashCard[]) => void

  // Quiz state (ephemeral, not persisted)
  quizDifficulty: number
  quizStreak: number
  quizConsecCorrect: number
  quizConsecWrong: number
  recordQuizAnswer: (correct: boolean) => void
  resetQuiz: () => void
}

export const useStore = create<Store>()(
  persist(
    immer((set, get) => ({
      // ── Initial state ──────────────────────────────────
      providers: DEFAULT_PROVIDERS,
      activeProvider: 'anthropic' as LLMProviderId,
      sttConfig: {
        provider: 'webspeech', language: 'en',
        continuous: false,
      } as STTConfig,
      ttsConfig: {
        provider: 'browser-tts', voice: '', speed: 1, volume: 0.9, language: 'en',
      } as TTSConfig,
      searchProviders: DEFAULT_SEARCH_PROVIDERS,
      activeSearch: 'tavily' as SearchProviderId,
      backend: {
        coreApiUrl: '', orchestratorUrl: '',
        knowledgeServiceUrl: '', supabaseUrl: '', supabaseAnonKey: '',
      },
      narration: {
        enabled: false, level: 'intermediate', language: 'en',
        voiceId: '', speed: 1, volume: 0.85, autoPlay: false, showSubtitles: true,
      },
      user: defaultUser,
      settingsOpen: false,
      currentSection: 'home' as SectionId,
      dueCards: [],
      quizDifficulty: 1,
      quizStreak: 0,
      quizConsecCorrect: 0,
      quizConsecWrong: 0,

      // ── Provider actions ───────────────────────────────
      setProvider: (id, config) => set(s => {
        Object.assign(s.providers[id], config)
      }),
      setActiveProvider: (id) => set(s => { s.activeProvider = id }),
      setSearchProvider: (id, config) => set(s => {
        Object.assign(s.searchProviders[id], config)
      }),
      setActiveSearch: (id) => set(s => { s.activeSearch = id }),
      setBackend: (config) => set(s => { Object.assign(s.backend, config) }),
      setSTTConfig: (config) => set(s => { Object.assign(s.sttConfig, config) }),
      setTTSConfig: (config) => set(s => { Object.assign(s.ttsConfig, config) }),
      setNarration: (config) => set(s => { Object.assign(s.narration, config) }),

      // ── User actions ───────────────────────────────────
      setTheme: (theme) => set(s => { s.user.theme = theme }),
      setTrack: (track) => set(s => { s.user.selectedTrack = track }),

      addXP: (amount) => set(s => {
        s.user.xp += amount
        const newLevel = Math.floor(s.user.xp / XP_PER_LEVEL) + 1
        if (newLevel > s.user.level) s.user.level = newLevel
      }),

      incrementStreak: () => set(s => {
        const today = new Date().toDateString()
        if (s.user.lastActiveDate !== today) {
          const yesterday = new Date(Date.now() - 86400000).toDateString()
          s.user.streak = s.user.lastActiveDate === yesterday ? s.user.streak + 1 : 1
          s.user.lastActiveDate = today
        }
      }),

      resetStreak: () => set(s => { s.user.streak = 0 }),

      markConceptComplete: (id) => set(s => {
        if (!s.user.completedConcepts.includes(id)) {
          s.user.completedConcepts.push(id)
        }
      }),

      markCardComplete: (id) => set(s => {
        if (!s.user.completedCards.includes(id)) {
          s.user.completedCards.push(id)
        }
      }),

      updateForgeScore: (score) => set(s => {
        s.user.forgeScore = Math.max(s.user.forgeScore, score)
      }),

      updateLabScore: (score) => set(s => {
        s.user.labScore = Math.max(s.user.labScore, score)
      }),

      setReducedMotion: (v) => set(s => { s.user.reducedMotion = v }),
      setPhotosensitivity: (v) => set(s => { s.user.photosensitivityMode = v }),

      // ── UI ─────────────────────────────────────────────
      setSection: (section) => set(s => { s.currentSection = section }),
      openSettings: () => set(s => { s.settingsOpen = true }),
      closeSettings: () => set(s => { s.settingsOpen = false }),

      // ── Export / Import ────────────────────────────────
      exportConfig: () => {
        const { providers, activeProvider, sttConfig, ttsConfig,
                searchProviders, activeSearch, backend, narration } = get()
        return JSON.stringify({
          version: '1.0', exported: new Date().toISOString(),
          providers, activeProvider, sttConfig, ttsConfig,
          searchProviders, activeSearch, backend, narration,
        }, null, 2)
      },

      importConfig: (json) => {
        try {
          const cfg = JSON.parse(json)
          set(s => {
            if (cfg.providers) Object.assign(s.providers, cfg.providers)
            if (cfg.activeProvider) s.activeProvider = cfg.activeProvider
            if (cfg.sttConfig) Object.assign(s.sttConfig, cfg.sttConfig)
            if (cfg.ttsConfig) Object.assign(s.ttsConfig, cfg.ttsConfig)
            if (cfg.searchProviders) Object.assign(s.searchProviders, cfg.searchProviders)
            if (cfg.activeSearch) s.activeSearch = cfg.activeSearch
            if (cfg.backend) Object.assign(s.backend, cfg.backend)
            if (cfg.narration) Object.assign(s.narration, cfg.narration)
          })
        } catch {
          console.error('Invalid config JSON')
        }
      },

      // ── Spaced repetition ─────────────────────────────
      enqueueDueCards: (cards) => set(s => {
        const now = Date.now()
        s.dueCards = cards
          .filter(c => c.nextReview <= now)
          .map(c => c.id)
      }),

      // ── Adaptive quiz ─────────────────────────────────
      recordQuizAnswer: (correct) => set(s => {
        if (correct) {
          s.quizConsecCorrect++
          s.quizConsecWrong = 0
          s.quizStreak++
          if (s.quizConsecCorrect >= 2 && s.quizDifficulty < 5) {
            s.quizDifficulty++
            s.quizConsecCorrect = 0
          }
        } else {
          s.quizConsecWrong++
          s.quizConsecCorrect = 0
          s.quizStreak = 0
          if (s.quizConsecWrong >= 2 && s.quizDifficulty > 1) {
            s.quizDifficulty--
            s.quizConsecWrong = 0
          }
        }
      }),

      resetQuiz: () => set(s => {
        s.quizDifficulty = 1
        s.quizStreak = 0
        s.quizConsecCorrect = 0
        s.quizConsecWrong = 0
      }),
    })),
    {
      name: 'intoit-store-v1',
      storage: createJSONStorage(() => localStorage),
      // Only persist config + user, NOT ephemeral quiz state
      partialize: (s) => ({
        providers: s.providers,
        activeProvider: s.activeProvider,
        sttConfig: s.sttConfig,
        ttsConfig: s.ttsConfig,
        searchProviders: s.searchProviders,
        activeSearch: s.activeSearch,
        backend: s.backend,
        narration: s.narration,
        user: s.user,
      }),
    }
  )
)

// ─── Typed selectors ─────────────────────────────────────
export const useActiveProvider = () => useStore(s => s.providers[s.activeProvider])
export const useUser = () => useStore(s => s.user)
export const useXP = () => useStore(s => ({ xp: s.user.xp, level: s.user.level }))
export const useStreak = () => useStore(s => s.user.streak)
export const useTheme = () => useStore(s => s.user.theme)
export const useSection = () => useStore(s => s.currentSection)
export const useAdaptiveDifficulty = () => useStore(s => s.quizDifficulty)
