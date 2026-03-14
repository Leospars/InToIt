// ═══════════════════════════════════════════════════════════
// INTOIT LEARNING — Core Type Definitions
// ═══════════════════════════════════════════════════════════

// ─── LLM Providers ────────────────────────────────────────

export type LLMProviderId =
  | 'anthropic' | 'openai' | 'azure-openai' | 'gemini'
  | 'huggingface' | 'openrouter' | 'custom'
  | 'ollama' | 'lmstudio'
  | 'deepseek' | 'zhipu' | 'qwen' | 'moonshot' | 'volcano'
  | 'mistral' | 'sarvam' | 'bharatgen'

export interface LLMProviderConfig {
  id: LLMProviderId
  name: string
  apiKey?: string
  endpoint?: string
  model: string
  defaultModel: string
  models: string[]
  region?: string         // Azure
  deploymentName?: string // Azure
  isLocal?: boolean       // Ollama / LM Studio
  isEnabled: boolean
  tags: Array<'cloud' | 'local' | 'china' | 'india' | 'europe' | 'free'>
}

export interface ProviderGroup {
  label: string
  providers: LLMProviderConfig[]
}

// ─── Speech Services ──────────────────────────────────────

export type STTProviderId =
  | 'webspeech' | 'whisper-wasm'
  | 'openai-whisper' | 'azure-speech' | 'deepgram'
  | 'google-stt' | 'aws-transcribe'

export type TTSProviderId =
  | 'browser-tts'
  | 'openai-tts' | 'openai-audio' | 'azure-tts'
  | 'elevenlabs' | 'google-tts' | 'aws-polly'

export interface STTConfig {
  provider: STTProviderId
  apiKey?: string
  region?: string
  language: string
  continuous: boolean
}

export interface TTSConfig {
  provider: TTSProviderId
  apiKey?: string
  voice: string
  speed: number
  volume: number
  language: string
}

// ─── Search Providers ────────────────────────────────────

export type SearchProviderId =
  | 'tavily' | 'exa' | 'you' | 'brave' | 'google' | 'bing'
  | 'serpapi' | 'kagi' | 'mojeek' | 'yandex' | 'baidu'
  | 'naver' | 'searxng'

export interface SearchProviderConfig {
  id: SearchProviderId
  name: string
  apiKey?: string
  endpoint?: string
  isEnabled: boolean
  requiresKey: boolean
  region?: 'global' | 'china' | 'korea'
}

// ─── Backend / Self-Hosted ────────────────────────────────

export interface BackendConfig {
  coreApiUrl: string
  orchestratorUrl: string
  knowledgeServiceUrl: string
  supabaseUrl: string
  supabaseAnonKey: string
}

// ─── Learning System ──────────────────────────────────────

export type TrackId =
  | 'foundations' | 'architecture' | 'protocols'
  | 'production' | 'advanced' | 'applied'

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export interface LearningTrack {
  id: TrackId
  title: string
  description: string
  icon: string
  color: string
  conceptIds: string[]
  prerequisites: TrackId[]
  estimatedHours: number
}

export type CapsuleStage = 'learn' | 'quiz' | 'apply' | 'reflect' | 'expand'

export interface Capsule {
  id: string
  conceptId: string
  stage: CapsuleStage
  content: string
  duration: number // seconds
  xpReward: number
}

export interface Concept {
  id: string
  title: string
  category: ConceptCategory
  track: TrackId
  difficulty: DifficultyLevel
  tags: string[]
  summary: string
  capsules: Capsule[]
  agentPatterns?: string[]
  codeExamples?: CodeExample[]
  relatedIds: string[]
}

export type ConceptCategory =
  | 'foundations' | 'architecture' | 'protocols' | 'production'
  | 'advanced' | 'applied' | 'enterprise' | 'beginner'
  | 'security' | 'evaluation' | 'cognitive' | 'specialized'

export interface CodeExample {
  language: 'python' | 'typescript'
  title: string
  code: string
  runnable: boolean
}

// ─── Flashcards ───────────────────────────────────────────

export type CardType = 'definition' | 'logic' | 'mini-pattern' | 'learning-loop' | 'real-world'

export interface FlashCard {
  id: string
  conceptId: string
  type: CardType
  front: string
  back: string
  xpReward: number
  nextReview: number // timestamp
  interval: number  // days (spaced repetition)
  easeFactor: number
  repetitions: number
}

// ─── Quiz ─────────────────────────────────────────────────

export interface QuizQuestion {
  id: string
  conceptId: string
  category: ConceptCategory
  difficulty: DifficultyLevel
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  misconception: string
  aiInsight: string
  tags: string[]
}

// ─── Forge (Socratic Defense, Prompt Autopsies, etc.) ─────

export type ForgeDiscipline =
  | 'socratic-defense' | 'prompt-autopsy'
  | 'epistemic-gym' | 'trust-calibration'

export interface ForgeSession {
  id: string
  discipline: ForgeDiscipline
  startedAt: number
  completedAt?: number
  score: number
  maxScore: number
  answers: ForgeAnswer[]
}

export interface ForgeAnswer {
  questionId: string
  response: string
  score: number
  feedback: string
  bloomLevel: BloomLevel
}

export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'

// ─── Lab (Neuro-Learning Paradigms) ──────────────────────

export type LabParadigm =
  | 'burst-grafting' | 'void-mapping' | 'glitch-resolution'
  | 'hemispheric-weaving' | 'glyph-cognition' | 'ephemeral-sparks'

export interface LabSession {
  id: string
  paradigm: LabParadigm
  conceptId: string
  completed: boolean
  score: number
  timestamp: number
}

// ─── Agent Patterns ───────────────────────────────────────

export interface AgentPattern {
  id: string
  name: string
  category: string
  description: string
  useCase: string
  pythonCode: string
  typescriptCode: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  complexity: 'simple' | 'moderate' | 'complex'
}

export interface FlowNode {
  id: string
  type: 'agent' | 'tool' | 'memory' | 'router' | 'human' | 'llm' | 'output'
  position: { x: number; y: number }
  data: { label: string; description?: string; icon?: string }
}

export interface FlowEdge {
  id: string
  source: string
  target: string
  label?: string
  animated?: boolean
  type?: 'default' | 'conditional' | 'loop'
}

// ─── User Progress / Gamification ─────────────────────────

export interface UserProfile {
  id: string
  displayName: string
  avatarUrl?: string
  level: number
  xp: number
  streak: number
  lastActiveDate: string
  completedConcepts: string[]
  completedCards: string[]
  masteredTopics: string[]
  forgeScore: number
  labScore: number
  badges: Badge[]
  selectedTrack: TrackId
  difficultyPreference: DifficultyLevel
  theme: ThemeId
  reducedMotion: boolean
  photosensitivityMode: boolean
}

export interface Badge {
  id: string
  name: string
  icon: string
  earnedAt: number
  description: string
}

// ─── Themes ───────────────────────────────────────────────

export type ThemeId =
  | 'void' | 'nebula' | 'matrix' | 'aurora' | 'obsidian'
  | 'midnight' | 'deep-sea' | 'carbon' | 'crimson' | 'forest'
  | 'copper' | 'moonstone'      // 12 dark
  | 'paper' | 'daybreak' | 'chalk' | 'parchment' | 'cloud' // 5 light

export interface Theme {
  id: ThemeId
  name: string
  isDark: boolean
  colors: {
    bg: string; surface: string; border: string
    primary: string; accent: string; text: string; textMuted: string
  }
}

// ─── Narration / Voice ────────────────────────────────────

export interface NarrationConfig {
  enabled: boolean
  level: 'beginner' | 'intermediate' | 'advanced'
  language: string
  voiceId: string
  speed: number
  volume: number
  autoPlay: boolean
  showSubtitles: boolean
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' }, { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' }, { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' }, { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' }, { code: 'ru', name: 'Russian' },
  { code: 'hi', name: 'Hindi' }, { code: 'bn', name: 'Bengali' },
  { code: 'ta', name: 'Tamil' }, { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' }, { code: 'ur', name: 'Urdu' },
  { code: 'vi', name: 'Vietnamese' }, { code: 'th', name: 'Thai' },
  { code: 'id', name: 'Indonesian' }, { code: 'ms', name: 'Malay' },
  { code: 'tr', name: 'Turkish' }, { code: 'pl', name: 'Polish' },
  { code: 'nl', name: 'Dutch' }, { code: 'it', name: 'Italian' },
  { code: 'sv', name: 'Swedish' }, { code: 'no', name: 'Norwegian' },
  { code: 'da', name: 'Danish' }, { code: 'fi', name: 'Finnish' },
  { code: 'he', name: 'Hebrew' },
] as const

// ─── App State ────────────────────────────────────────────

export interface AppState {
  providers: Record<LLMProviderId, LLMProviderConfig>
  activeProvider: LLMProviderId
  sttConfig: STTConfig
  ttsConfig: TTSConfig
  searchProviders: Record<SearchProviderId, SearchProviderConfig>
  activeSearch: SearchProviderId
  backend: BackendConfig
  narration: NarrationConfig
  user: UserProfile
  settingsOpen: boolean
  currentSection: SectionId
}

export type SectionId =
  | 'home' | 'learn' | 'atlas' | 'flashcards'
  | 'quiz' | 'patterns' | 'forge' | 'lab' | 'settings'
