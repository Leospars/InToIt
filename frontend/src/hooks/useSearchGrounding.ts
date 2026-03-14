import { useState, useCallback } from 'react'
import { useStore } from '@/store'

// ═══════════════════════════════════════════════════════════
// useSearchGrounding — Live web search grounding for LLM answers
// Supports all 13 providers via backend proxy or direct client calls
// ═══════════════════════════════════════════════════════════

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

export interface GroundedAnswer {
  answer: string
  sources: SearchResult[]
  searchQuery: string
}

export function useSearchGrounding() {
  const provider = useStore(s => s.providers[s.activeProvider])
  const searchProviders = useStore(s => s.searchProviders)
  const activeSearch = useStore(s => s.activeSearch)
  const backend = useStore(s => s.backend)

  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])

  const search = useCallback(async (query: string): Promise<SearchResult[]> => {
    const sp = searchProviders[activeSearch]
    if (!sp.isEnabled && sp.requiresKey) return []

    try {
      // Try backend proxy first, fall back to direct if configured
      const backendUrl = backend.coreApiUrl || ''
      if (backendUrl) {
        const res = await fetch(`${backendUrl}/api/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            provider: activeSearch,
            api_key: sp.apiKey ?? '',
            endpoint: sp.endpoint ?? '',
            max_results: 5,
          }),
        })
        const data = await res.json()
        return data.results ?? []
      }

      // Client-side Tavily direct call (CORS-friendly)
      if (activeSearch === 'tavily' && sp.apiKey) {
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: sp.apiKey, query, max_results: 5 }),
        })
        const data = await res.json()
        return (data.results ?? []).map((r: Record<string, string>) => ({
          title: r.title, url: r.url, snippet: (r.content ?? '').slice(0, 300),
        }))
      }

      return []
    } catch {
      return []
    }
  }, [activeSearch, searchProviders, backend.coreApiUrl])

  const groundedAnswer = useCallback(async (question: string): Promise<GroundedAnswer> => {
    setLoading(true)
    try {
      const searchResults = await search(question)
      setResults(searchResults)

      if (!provider.isEnabled && !provider.isLocal) {
        return { answer: 'Configure an LLM provider to get grounded answers.', sources: [], searchQuery: question }
      }

      const { callLLM } = await import('@/lib/llmClient')

      let context = ''
      if (searchResults.length > 0) {
        context = '\n\nWeb search results:\n' + searchResults
          .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`)
          .join('\n\n')
      }

      const answer = await callLLM(provider, [
        { role: 'user', content: question + context }
      ], {
        systemPrompt: searchResults.length > 0
          ? 'You are an expert on AI agents. Answer the question using the provided web search results. Cite sources with [1], [2] etc. Keep answers concise and accurate.'
          : 'You are an expert on AI agents. Answer the question concisely and accurately.',
        maxTokens: 600,
        temperature: 0.3,
      })

      return { answer, sources: searchResults, searchQuery: question }
    } finally {
      setLoading(false)
    }
  }, [provider, search])

  return { loading, results, search, groundedAnswer }
}
