import type { LLMProviderConfig, LLMProviderId, SearchProviderConfig, SearchProviderId } from '@/types'

// ═══════════════════════════════════════════════════════════
// DEFAULT PROVIDER CONFIGURATIONS
// ═══════════════════════════════════════════════════════════

export const DEFAULT_PROVIDERS: Record<LLMProviderId, LLMProviderConfig> = {
  // ── Cloud — Western ──────────────────────────────────────
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    defaultModel: 'claude-sonnet-4-20250514',
    model: 'claude-sonnet-4-20250514',
    models: [
      'claude-opus-4-5', 'claude-sonnet-4-20250514',
      'claude-haiku-4-5-20251001', 'claude-3-5-sonnet-20241022',
    ],
    endpoint: 'https://api.anthropic.com',
    isEnabled: false,
    tags: ['cloud'],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    defaultModel: 'gpt-4o',
    model: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1', 'o1-mini'],
    endpoint: 'https://api.openai.com/v1',
    isEnabled: false,
    tags: ['cloud'],
  },
  'azure-openai': {
    id: 'azure-openai',
    name: 'Azure OpenAI',
    defaultModel: 'gpt-4o',
    model: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-35-turbo'],
    endpoint: '',  // https://{resource}.openai.azure.com
    deploymentName: '',
    region: 'eastus',
    isEnabled: false,
    tags: ['cloud'],
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    defaultModel: 'gemini-1.5-pro',
    model: 'gemini-1.5-pro',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
    endpoint: 'https://generativelanguage.googleapis.com',
    isEnabled: false,
    tags: ['cloud'],
  },
  huggingface: {
    id: 'huggingface',
    name: 'Hugging Face',
    defaultModel: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
    model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
    models: [
      'meta-llama/Meta-Llama-3.1-8B-Instruct',
      'meta-llama/Meta-Llama-3.1-70B-Instruct',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
    ],
    endpoint: 'https://api-inference.huggingface.co',
    isEnabled: false,
    tags: ['cloud'],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    defaultModel: 'openai/gpt-4o',
    model: 'openai/gpt-4o',
    models: [
      'openai/gpt-4o', 'anthropic/claude-sonnet-4-5',
      'google/gemini-pro-1.5', 'meta-llama/llama-3.1-70b-instruct',
      'mistralai/mistral-7b-instruct',
    ],
    endpoint: 'https://openrouter.ai/api/v1',
    isEnabled: false,
    tags: ['cloud'],
  },
  custom: {
    id: 'custom',
    name: 'Custom (OpenAI-compatible)',
    defaultModel: 'custom-model',
    model: 'custom-model',
    models: [],
    endpoint: 'http://localhost:8080/v1',
    isEnabled: false,
    tags: ['cloud'],
  },

  // ── Local Runners ─────────────────────────────────────────
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    defaultModel: 'llama3.1',
    model: 'llama3.1',
    models: ['llama3.1', 'llama3.1:70b', 'mistral', 'codellama', 'phi3', 'qwen2', 'gemma2'],
    endpoint: 'http://localhost:11434',
    isLocal: true,
    isEnabled: false,
    tags: ['local', 'free'],
  },
  lmstudio: {
    id: 'lmstudio',
    name: 'LM Studio (Local)',
    defaultModel: 'local-model',
    model: 'local-model',
    models: ['local-model'],
    endpoint: 'http://localhost:1234/v1',
    isLocal: true,
    isEnabled: false,
    tags: ['local', 'free'],
  },

  // ── China Region ──────────────────────────────────────────
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    defaultModel: 'deepseek-chat',
    model: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
    endpoint: 'https://api.deepseek.com/v1',
    isEnabled: false,
    tags: ['cloud', 'china'],
  },
  zhipu: {
    id: 'zhipu',
    name: 'Zhipu AI (GLM)',
    defaultModel: 'glm-4',
    model: 'glm-4',
    models: ['glm-4', 'glm-4-flash', 'glm-3-turbo'],
    endpoint: 'https://open.bigmodel.cn/api/paas/v4',
    isEnabled: false,
    tags: ['cloud', 'china'],
  },
  qwen: {
    id: 'qwen',
    name: 'Alibaba Qwen',
    defaultModel: 'qwen-max',
    model: 'qwen-max',
    models: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen2-72b-instruct'],
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    isEnabled: false,
    tags: ['cloud', 'china'],
  },
  moonshot: {
    id: 'moonshot',
    name: 'Moonshot AI (Kimi)',
    defaultModel: 'moonshot-v1-8k',
    model: 'moonshot-v1-8k',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    endpoint: 'https://api.moonshot.cn/v1',
    isEnabled: false,
    tags: ['cloud', 'china'],
  },
  volcano: {
    id: 'volcano',
    name: 'Volcano Engine (ByteDance)',
    defaultModel: 'ep-xxxxxxxx',
    model: 'ep-xxxxxxxx',
    models: ['ep-xxxxxxxx'],
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3',
    isEnabled: false,
    tags: ['cloud', 'china'],
  },

  // ── Europe ────────────────────────────────────────────────
  mistral: {
    id: 'mistral',
    name: 'Mistral AI (France)',
    defaultModel: 'mistral-large-latest',
    model: 'mistral-large-latest',
    models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'open-mixtral-8x22b'],
    endpoint: 'https://api.mistral.ai/v1',
    isEnabled: false,
    tags: ['cloud', 'europe'],
  },

  // ── India ─────────────────────────────────────────────────
  sarvam: {
    id: 'sarvam',
    name: 'Sarvam AI (India)',
    defaultModel: 'sarvam-2b',
    model: 'sarvam-2b',
    models: ['sarvam-2b', 'sarvam-m'],
    endpoint: 'https://api.sarvam.ai/v1',
    isEnabled: false,
    tags: ['cloud', 'india'],
  },
  bharatgen: {
    id: 'bharatgen',
    name: 'BharatGen (India)',
    defaultModel: 'bharatgen-1',
    model: 'bharatgen-1',
    models: ['bharatgen-1'],
    endpoint: 'https://api.bharatgen.ai/v1',
    isEnabled: false,
    tags: ['cloud', 'india'],
  },
}

// ─── Provider Groups (for UI rendering) ───────────────────

export const PROVIDER_GROUPS = [
  {
    label: '☁️ Cloud — Western',
    providers: ['anthropic', 'openai', 'azure-openai', 'gemini', 'huggingface', 'openrouter', 'custom'],
  },
  {
    label: '💻 Local Runners (No API Key)',
    providers: ['ollama', 'lmstudio'],
  },
  {
    label: '🇨🇳 China Region',
    providers: ['deepseek', 'zhipu', 'qwen', 'moonshot', 'volcano'],
  },
  {
    label: '🇫🇷 Europe',
    providers: ['mistral'],
  },
  {
    label: '🇮🇳 India',
    providers: ['sarvam', 'bharatgen'],
  },
] as const

// ─── Search Providers ─────────────────────────────────────

export const DEFAULT_SEARCH_PROVIDERS: Record<SearchProviderId, SearchProviderConfig> = {
  tavily:   { id: 'tavily',  name: 'Tavily',  requiresKey: true,  isEnabled: false, region: 'global' },
  exa:      { id: 'exa',    name: 'Exa',     requiresKey: true,  isEnabled: false, region: 'global' },
  you:      { id: 'you',    name: 'You.com', requiresKey: true,  isEnabled: false, region: 'global' },
  brave:    { id: 'brave',  name: 'Brave',   requiresKey: true,  isEnabled: false, region: 'global' },
  google:   { id: 'google', name: 'Google',  requiresKey: true,  isEnabled: false, region: 'global' },
  bing:     { id: 'bing',   name: 'Bing',    requiresKey: true,  isEnabled: false, region: 'global' },
  serpapi:  { id: 'serpapi',name: 'SerpAPI', requiresKey: true,  isEnabled: false, region: 'global' },
  kagi:     { id: 'kagi',   name: 'Kagi',    requiresKey: true,  isEnabled: false, region: 'global' },
  mojeek:   { id: 'mojeek', name: 'Mojeek',  requiresKey: true,  isEnabled: false, region: 'global' },
  yandex:   { id: 'yandex', name: 'Yandex',  requiresKey: false, isEnabled: false, region: 'global' },
  baidu:    { id: 'baidu',  name: 'Baidu',   requiresKey: false, isEnabled: false, region: 'china' },
  naver:    { id: 'naver',  name: 'Naver',   requiresKey: true,  isEnabled: false, region: 'korea' },
  searxng:  { id: 'searxng',name: 'SearXNG (Self-hosted)', requiresKey: false, isEnabled: false, endpoint: 'http://localhost:8888', region: 'global' },
}

// ─── STT / TTS labels ─────────────────────────────────────

export const STT_PROVIDERS = [
  { id: 'webspeech',      name: 'Web Speech API (Free, Browser)',  requiresKey: false },
  { id: 'whisper-wasm',   name: 'Whisper WASM (Offline)',          requiresKey: false },
  { id: 'openai-whisper', name: 'OpenAI Whisper',                  requiresKey: true  },
  { id: 'azure-speech',   name: 'Azure Speech',                    requiresKey: true  },
  { id: 'deepgram',       name: 'Deepgram',                        requiresKey: true  },
  { id: 'google-stt',     name: 'Google Cloud STT',                requiresKey: true  },
  { id: 'aws-transcribe', name: 'AWS Transcribe',                  requiresKey: true  },
] as const

export const TTS_PROVIDERS = [
  { id: 'browser-tts',  name: 'Browser TTS (Free, Offline)',   requiresKey: false },
  { id: 'openai-tts',   name: 'OpenAI TTS',                    requiresKey: true  },
  { id: 'openai-audio', name: 'OpenAI Audio (Translate+Speak)',requiresKey: true  },
  { id: 'azure-tts',    name: 'Azure Speech',                  requiresKey: true  },
  { id: 'elevenlabs',   name: 'ElevenLabs',                    requiresKey: true  },
  { id: 'google-tts',   name: 'Google Cloud TTS',              requiresKey: true  },
  { id: 'aws-polly',    name: 'AWS Polly',                     requiresKey: true  },
] as const

// ─── XP thresholds ────────────────────────────────────────

export const XP_PER_LEVEL = 500
export const LEVELS = Array.from({ length: 50 }, (_, i) => ({
  level: i + 1,
  xpRequired: i * XP_PER_LEVEL,
  title: getLevelTitle(i + 1),
}))

function getLevelTitle(level: number): string {
  if (level < 5)  return 'Curious Novice'
  if (level < 10) return 'Pattern Seeker'
  if (level < 20) return 'Agent Architect'
  if (level < 30) return 'Systems Thinker'
  if (level < 40) return 'Protocol Master'
  return 'Intelligence Pioneer'
}

// ─── Spaced Repetition (SM-2 algorithm constants) ─────────
export const SM2_MIN_EASE = 1.3
export const SM2_DEFAULT_EASE = 2.5
export const SM2_INITIAL_INTERVALS = [1, 6] // days
