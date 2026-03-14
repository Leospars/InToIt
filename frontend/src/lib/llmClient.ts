import type { LLMProviderConfig, LLMProviderId } from '@/types'

// ═══════════════════════════════════════════════════════════
// Unified LLM Client
// Normalizes all providers to a single chat interface.
// Keys are stored in localStorage (BYOK — zero server).
// ═══════════════════════════════════════════════════════════

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatOptions {
  maxTokens?: number
  temperature?: number
  stream?: boolean
  systemPrompt?: string
  signal?: AbortSignal
}

export interface StreamChunk {
  delta: string
  done: boolean
}

// ─── Main caller ──────────────────────────────────────────
export async function callLLM(
  provider: LLMProviderConfig,
  messages: ChatMessage[],
  options: ChatOptions = {},
): Promise<string> {
  const { maxTokens = 1024, temperature = 0.7, systemPrompt } = options

  const allMessages: ChatMessage[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages

  switch (provider.id) {
    case 'anthropic':     return callAnthropic(provider, allMessages, maxTokens, temperature)
    case 'openai':        return callOpenAI(provider, allMessages, maxTokens, temperature, 'openai')
    case 'azure-openai':  return callAzureOpenAI(provider, allMessages, maxTokens, temperature)
    case 'gemini':        return callGemini(provider, allMessages, maxTokens, temperature)
    case 'huggingface':   return callHuggingFace(provider, allMessages, maxTokens, temperature)
    case 'ollama':        return callOllama(provider, allMessages, maxTokens, temperature)
    case 'lmstudio':      return callOpenAI(provider, allMessages, maxTokens, temperature, 'openai-compat')
    case 'openrouter':    return callOpenAI(provider, allMessages, maxTokens, temperature, 'openrouter')
    case 'custom':        return callOpenAI(provider, allMessages, maxTokens, temperature, 'openai-compat')
    // All OpenAI-compatible China/Europe/India providers
    case 'deepseek': case 'zhipu': case 'qwen': case 'moonshot':
    case 'volcano':  case 'mistral': case 'sarvam': case 'bharatgen':
      return callOpenAI(provider, allMessages, maxTokens, temperature, 'openai-compat')
    default:
      throw new Error(`Provider ${provider.id} not implemented`)
  }
}

// ─── Streaming caller ─────────────────────────────────────
export async function* streamLLM(
  provider: LLMProviderConfig,
  messages: ChatMessage[],
  options: ChatOptions = {},
): AsyncGenerator<StreamChunk> {
  // Anthropic streaming example — add others as needed
  if (provider.id === 'anthropic') {
    yield* streamAnthropic(provider, messages, options)
    return
  }
  // Fallback: batch call, yield full result as one chunk
  const result = await callLLM(provider, messages, options)
  yield { delta: result, done: false }
  yield { delta: '', done: true }
}

// ─── Anthropic ─────────────────────────────────────────────
async function callAnthropic(
  p: LLMProviderConfig, messages: ChatMessage[],
  maxTokens: number, temperature: number,
): Promise<string> {
  const systemMsg = messages.find(m => m.role === 'system')
  const userMessages = messages.filter(m => m.role !== 'system')

  const res = await fetch(`${p.endpoint}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': p.apiKey ?? '',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: p.model,
      max_tokens: maxTokens,
      temperature,
      ...(systemMsg && { system: systemMsg.content }),
      messages: userMessages.map(m => ({ role: m.role, content: m.content })),
    }),
  })
  if (!res.ok) throw new Error(`Anthropic error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

async function* streamAnthropic(
  p: LLMProviderConfig, messages: ChatMessage[], options: ChatOptions,
): AsyncGenerator<StreamChunk> {
  const systemMsg = messages.find(m => m.role === 'system')
  const userMessages = messages.filter(m => m.role !== 'system')

  const res = await fetch(`${p.endpoint}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': p.apiKey ?? '',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: p.model,
      max_tokens: options.maxTokens ?? 1024,
      temperature: options.temperature ?? 0.7,
      stream: true,
      ...(systemMsg && { system: systemMsg.content }),
      messages: userMessages.map(m => ({ role: m.role, content: m.content })),
    }),
    signal: options.signal,
  })

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    const lines = decoder.decode(value).split('\n')
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const ev = JSON.parse(line.slice(6))
        if (ev.type === 'content_block_delta' && ev.delta?.text) {
          yield { delta: ev.delta.text, done: false }
        }
        if (ev.type === 'message_stop') {
          yield { delta: '', done: true }
        }
      } catch { /* skip malformed */ }
    }
  }
}

// ─── OpenAI-compatible (covers openai, openrouter, local, custom, china, etc.) ──
async function callOpenAI(
  p: LLMProviderConfig, messages: ChatMessage[],
  maxTokens: number, temperature: number, mode: string,
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${p.apiKey ?? ''}`,
  }
  if (mode === 'openrouter') {
    headers['HTTP-Referer'] = 'https://intoit.app'
    headers['X-Title'] = 'INTOIT Learning'
  }

  const url = `${p.endpoint}/chat/completions`
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: p.model,
      max_tokens: maxTokens,
      temperature,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  })
  if (!res.ok) throw new Error(`${p.name} error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

// ─── Azure OpenAI ─────────────────────────────────────────
async function callAzureOpenAI(
  p: LLMProviderConfig, messages: ChatMessage[],
  maxTokens: number, temperature: number,
): Promise<string> {
  const url = `${p.endpoint}/openai/deployments/${p.deploymentName}/chat/completions?api-version=2024-02-01`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': p.apiKey ?? '',
    },
    body: JSON.stringify({ messages, max_tokens: maxTokens, temperature }),
  })
  if (!res.ok) throw new Error(`Azure error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

// ─── Google Gemini ────────────────────────────────────────
async function callGemini(
  p: LLMProviderConfig, messages: ChatMessage[],
  maxTokens: number, temperature: number,
): Promise<string> {
  const url = `${p.endpoint}/v1beta/models/${p.model}:generateContent?key=${p.apiKey}`
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: maxTokens, temperature } }),
  })
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

// ─── HuggingFace ──────────────────────────────────────────
async function callHuggingFace(
  p: LLMProviderConfig, messages: ChatMessage[],
  maxTokens: number, temperature: number,
): Promise<string> {
  const url = `${p.endpoint}/models/${p.model}`
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n') + '\nassistant:'
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${p.apiKey}`,
    },
    body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: maxTokens, temperature } }),
  })
  if (!res.ok) throw new Error(`HuggingFace error: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data[0]?.generated_text ?? '' : data.generated_text ?? ''
}

// ─── Ollama ───────────────────────────────────────────────
async function callOllama(
  p: LLMProviderConfig, messages: ChatMessage[],
  maxTokens: number, temperature: number,
): Promise<string> {
  const res = await fetch(`${p.endpoint}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: p.model, stream: false,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      options: { num_predict: maxTokens, temperature },
    }),
  })
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`)
  const data = await res.json()
  return data.message?.content ?? ''
}

// ─── JSON-mode helper (used everywhere in learning system) ─
export async function callLLMJson<T>(
  provider: LLMProviderConfig,
  prompt: string,
  schema?: string,
): Promise<T> {
  const systemPrompt = schema
    ? `You are a JSON generator. Return ONLY valid JSON matching this schema:\n${schema}\nNo markdown, no explanation.`
    : 'You are a JSON generator. Return ONLY valid JSON. No markdown, no explanation, no preamble.'

  const raw = await callLLM(provider, [{ role: 'user', content: prompt }], {
    systemPrompt, maxTokens: 2048, temperature: 0.4,
  })
  const clean = raw.replace(/```json\n?|```/g, '').trim()
  return JSON.parse(clean) as T
}
