import React, { useState, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Accordion from '@radix-ui/react-accordion'
import * as Tabs from '@radix-ui/react-tabs'
import * as RadioGroup from '@radix-ui/react-radio-group'
import { X, Download, Upload, Eye, EyeOff, ChevronDown, Check, AlertTriangle, Wifi, WifiOff } from 'lucide-react'
import { useStore } from '@/store'
import { PROVIDER_GROUPS, DEFAULT_PROVIDERS, STT_PROVIDERS, TTS_PROVIDERS } from '@/lib/providers'
import type { LLMProviderId, SearchProviderId } from '@/types'
import { cn } from '@/lib/utils'

// ─── Masked API Key Input ─────────────────────────────────
function ApiKeyInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative flex items-center">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'sk-…'}
        className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm font-mono text-text placeholder-text/30 focus:outline-none focus:border-cyan/40 pr-10"
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 text-text/40 hover:text-text/70 transition-colors"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}

// ─── Provider Row ─────────────────────────────────────────
function ProviderRow({ providerId }: { providerId: LLMProviderId }) {
  const config = useStore(s => s.providers[providerId])
  const setProvider = useStore(s => s.setProvider)
  const activeProvider = useStore(s => s.activeProvider)
  const setActiveProvider = useStore(s => s.setActiveProvider)

  const isActive = activeProvider === providerId
  const isLocal = config.isLocal

  return (
    <div className={cn(
      'rounded-xl border p-4 transition-all',
      isActive ? 'border-cyan/30 bg-cyan-dim' : 'border-border bg-surface-2/50'
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isLocal ? <WifiOff size={12} className="text-green-400" /> : <Wifi size={12} className="text-text/40" />}
          <span className="font-medium text-sm">{config.name}</span>
          {config.tags.map(t => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-3 text-text/50 uppercase tracking-wide">
              {t}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {isActive && <span className="text-[10px] text-cyan font-medium">ACTIVE</span>}
          <button
            onClick={() => setActiveProvider(providerId)}
            className={cn(
              'text-xs px-3 py-1 rounded-full border transition-all',
              isActive
                ? 'bg-cyan text-void border-cyan font-semibold'
                : 'border-border text-text/60 hover:border-cyan/30 hover:text-text'
            )}
          >
            {isActive ? <><Check size={10} className="inline mr-1" />Active</> : 'Use'}
          </button>
        </div>
      </div>

      {/* API Key — skip for local providers */}
      {!isLocal && (
        <div className="mb-3">
          <label className="text-[11px] text-text/50 mb-1 block">
            API Key {providerId === 'azure-openai' && <span className="text-amber">*required</span>}
          </label>
          <ApiKeyInput
            value={config.apiKey ?? ''}
            onChange={v => setProvider(providerId, { apiKey: v, isEnabled: v.length > 0 })}
            placeholder={getKeyPlaceholder(providerId)}
          />
        </div>
      )}

      {/* Endpoint */}
      <div className="mb-3">
        <label className="text-[11px] text-text/50 mb-1 block">
          Endpoint URL {isLocal && <span className="text-green-400 text-[10px]">(local)</span>}
        </label>
        <input
          type="text"
          value={config.endpoint ?? ''}
          onChange={e => setProvider(providerId, { endpoint: e.target.value })}
          placeholder={config.endpoint || 'https://…'}
          className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2 text-xs font-mono text-text/70 focus:outline-none focus:border-cyan/30"
        />
      </div>

      {/* Azure-specific */}
      {providerId === 'azure-openai' && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-[11px] text-amber mb-1 block">Deployment Name *</label>
            <input
              type="text"
              value={config.deploymentName ?? ''}
              onChange={e => setProvider(providerId, { deploymentName: e.target.value })}
              placeholder="my-gpt4o-deployment"
              className="w-full bg-surface-3 border border-amber/20 rounded-lg px-3 py-2 text-xs font-mono text-text/70 focus:outline-none focus:border-amber/40"
            />
          </div>
          <div>
            <label className="text-[11px] text-amber mb-1 block">Region *</label>
            <input
              type="text"
              value={config.region ?? ''}
              onChange={e => setProvider(providerId, { region: e.target.value })}
              placeholder="eastus"
              className="w-full bg-surface-3 border border-amber/20 rounded-lg px-3 py-2 text-xs font-mono text-text/70 focus:outline-none focus:border-amber/40"
            />
          </div>
        </div>
      )}

      {/* Model selector */}
      <div>
        <label className="text-[11px] text-text/50 mb-1 block">Model</label>
        {config.models.length > 0 ? (
          <select
            value={config.model}
            onChange={e => setProvider(providerId, { model: e.target.value })}
            className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2 text-xs font-mono text-text/70 focus:outline-none"
          >
            {config.models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        ) : (
          <input
            type="text"
            value={config.model}
            onChange={e => setProvider(providerId, { model: e.target.value })}
            placeholder="model-name"
            className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2 text-xs font-mono text-text/70 focus:outline-none"
          />
        )}
      </div>
    </div>
  )
}

// ─── Quick Config Guide ───────────────────────────────────
function QuickGuide() {
  const hasAnyKey = useStore(s =>
    Object.values(s.providers).some(p => p.apiKey && p.apiKey.length > 0) ||
    Object.values(s.providers).some(p => p.isLocal)
  )

  if (hasAnyKey) return null

  return (
    <Accordion.Root type="single" defaultValue="guide" className="mb-6">
      <Accordion.Item value="guide" className="border border-amber/30 rounded-xl overflow-hidden">
        <Accordion.Trigger className="w-full flex items-center justify-between p-4 bg-amber-dim text-amber text-sm font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} />
            Quick Setup Guide — No provider configured yet
          </div>
          <ChevronDown size={14} className="transition-transform data-[state=open]:rotate-180" />
        </Accordion.Trigger>
        <Accordion.Content className="overflow-hidden data-[state=open]:animate-slide-up">
          <div className="p-4 border-t border-amber/20 bg-surface-2 space-y-4">
            {[
              { step: '1', title: 'Pick a Provider', desc: 'Start with Anthropic Claude or OpenAI for the best experience. Use Ollama for 100% offline, no key needed.' },
              { step: '2', title: 'Paste Your API Key', desc: 'Keys are stored only in your browser\'s localStorage. They never leave your device or touch our servers.' },
              { step: '3', title: 'Select a Model', desc: 'Choose from the dropdown or enter a custom model ID. The default model is a safe starting point.' },
              { step: '4', title: 'Click "Use"', desc: 'Activate the provider and start learning. You can switch providers at any time.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-amber text-void text-xs font-bold flex items-center justify-center flex-shrink-0">{step}</span>
                <div>
                  <div className="text-sm font-medium text-text">{title}</div>
                  <div className="text-xs text-text/60 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  )
}

// ─── Main Settings Sheet ──────────────────────────────────
export function SettingsSheet() {
  const open = useStore(s => s.settingsOpen)
  const close = useStore(s => s.closeSettings)
  const exportConfig = useStore(s => s.exportConfig)
  const importConfig = useStore(s => s.importConfig)
  const sttConfig = useStore(s => s.sttConfig)
  const ttsConfig = useStore(s => s.ttsConfig)
  const setSTT = useStore(s => s.setSTTConfig)
  const setTTS = useStore(s => s.setTTSConfig)
  const backend = useStore(s => s.backend)
  const setBackend = useStore(s => s.setBackend)
  const searchProviders = useStore(s => s.searchProviders)
  const setSearchProvider = useStore(s => s.setSearchProvider)
  const activeSearch = useStore(s => s.activeSearch)
  const setActiveSearch = useStore(s => s.setActiveSearch)

  const fileRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const json = exportConfig()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `intoit-config-${Date.now()}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => importConfig(ev.target?.result as string)
    reader.readAsText(file)
  }

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in" />
        <Dialog.Content className="fixed top-0 right-0 h-full w-full max-w-2xl bg-deep border-l border-border z-50 flex flex-col animate-slide-right overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
            <div>
              <Dialog.Title className="text-lg font-semibold text-text font-serif">Configuration</Dialog.Title>
              <p className="text-xs text-text/50 mt-0.5">
                🔒 All keys stored locally in your browser — zero server access
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExport} className="flex items-center gap-1.5 text-xs text-text/60 hover:text-text border border-border hover:border-border-2 rounded-lg px-3 py-1.5 transition-all">
                <Download size={12} />Export
              </button>
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-xs text-text/60 hover:text-text border border-border hover:border-border-2 rounded-lg px-3 py-1.5 transition-all">
                <Upload size={12} />Import
              </button>
              <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              <Dialog.Close className="p-2 rounded-lg text-text/50 hover:text-text hover:bg-surface-2 transition-all">
                <X size={16} />
              </Dialog.Close>
            </div>
          </div>

          {/* Tabs */}
          <Tabs.Root defaultValue="providers" className="flex-1 overflow-hidden flex flex-col">
            <Tabs.List className="flex border-b border-border px-6 flex-shrink-0 gap-1">
              {['providers', 'speech', 'search', 'backend'].map(tab => (
                <Tabs.Trigger
                  key={tab}
                  value={tab}
                  className="px-4 py-3 text-xs font-medium capitalize text-text/50 border-b-2 border-transparent data-[state=active]:border-cyan data-[state=active]:text-cyan transition-all"
                >
                  {{ providers: '🤖 LLM Providers', speech: '🎤 Speech', search: '🔍 Search', backend: '⚙️ Backend' }[tab]}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <div className="flex-1 overflow-y-auto">

              {/* ── LLM Providers Tab ── */}
              <Tabs.Content value="providers" className="p-6">
                <QuickGuide />
                <Accordion.Root type="multiple" className="space-y-3">
                  {PROVIDER_GROUPS.map(group => (
                    <Accordion.Item key={group.label} value={group.label} className="border border-border rounded-xl overflow-hidden">
                      <Accordion.Trigger className="w-full flex items-center justify-between p-4 bg-surface-2/50 text-sm font-medium text-text/80 hover:bg-surface-2">
                        <span>{group.label}</span>
                        <ChevronDown size={14} className="text-text/40 transition-transform data-[state=open]:rotate-180" />
                      </Accordion.Trigger>
                      <Accordion.Content className="data-[state=open]:animate-slide-up overflow-hidden">
                        <div className="p-4 space-y-3 border-t border-border">
                          {group.providers.map(id => (
                            <ProviderRow key={id} providerId={id as LLMProviderId} />
                          ))}
                        </div>
                      </Accordion.Content>
                    </Accordion.Item>
                  ))}
                </Accordion.Root>
              </Tabs.Content>

              {/* ── Speech Tab ── */}
              <Tabs.Content value="speech" className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-text mb-3">🎙️ Speech-to-Text (STT)</h3>
                  <RadioGroup.Root
                    value={sttConfig.provider}
                    onValueChange={v => setSTT({ provider: v as typeof sttConfig.provider })}
                    className="space-y-2"
                  >
                    {STT_PROVIDERS.map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface-2/50 hover:border-border-2 transition-all">
                        <RadioGroup.Item
                          value={p.id}
                          className="w-4 h-4 rounded-full border-2 border-border data-[state=checked]:border-cyan data-[state=checked]:bg-cyan transition-all"
                        >
                          <RadioGroup.Indicator className="flex items-center justify-center w-full h-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-void" />
                          </RadioGroup.Indicator>
                        </RadioGroup.Item>
                        <label className="flex-1 text-sm text-text/80 cursor-pointer">{p.name}</label>
                        {!p.requiresKey && <span className="text-[10px] text-green-400 font-medium">FREE</span>}
                        {p.requiresKey && sttConfig.provider === p.id && (
                          <ApiKeyInput
                            value={(sttConfig as Record<string, string>).apiKey ?? ''}
                            onChange={v => setSTT({ apiKey: v } as Parameters<typeof setSTT>[0])}
                          />
                        )}
                      </div>
                    ))}
                  </RadioGroup.Root>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-text mb-3">🔊 Text-to-Speech (TTS)</h3>
                  <RadioGroup.Root
                    value={ttsConfig.provider}
                    onValueChange={v => setTTS({ provider: v as typeof ttsConfig.provider })}
                    className="space-y-2"
                  >
                    {TTS_PROVIDERS.map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface-2/50 hover:border-border-2 transition-all">
                        <RadioGroup.Item
                          value={p.id}
                          className="w-4 h-4 rounded-full border-2 border-border data-[state=checked]:border-cyan data-[state=checked]:bg-cyan transition-all"
                        >
                          <RadioGroup.Indicator className="flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-void" />
                          </RadioGroup.Indicator>
                        </RadioGroup.Item>
                        <label className="flex-1 text-sm text-text/80 cursor-pointer">{p.name}</label>
                        {!p.requiresKey && <span className="text-[10px] text-green-400 font-medium">FREE</span>}
                      </div>
                    ))}
                  </RadioGroup.Root>
                </div>
              </Tabs.Content>

              {/* ── Search Tab ── */}
              <Tabs.Content value="search" className="p-6">
                <p className="text-xs text-text/50 mb-4">
                  Select a search provider to ground AI answers in real-time web results.
                </p>
                <div className="space-y-2">
                  {Object.values(searchProviders).map(sp => (
                    <div
                      key={sp.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border transition-all',
                        activeSearch === sp.id ? 'border-cyan/30 bg-cyan-dim' : 'border-border bg-surface-2/50'
                      )}
                    >
                      <button
                        onClick={() => setActiveSearch(sp.id as SearchProviderId)}
                        className={cn(
                          'w-4 h-4 rounded-full border-2 transition-all flex-shrink-0',
                          activeSearch === sp.id ? 'border-cyan bg-cyan' : 'border-border'
                        )}
                      />
                      <span className="flex-1 text-sm text-text/80">{sp.name}</span>
                      {sp.region && sp.region !== 'global' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-3 text-text/40 uppercase">{sp.region}</span>
                      )}
                      {sp.requiresKey && (
                        <div className="w-48">
                          <ApiKeyInput
                            value={sp.apiKey ?? ''}
                            onChange={v => setSearchProvider(sp.id as SearchProviderId, { apiKey: v, isEnabled: v.length > 0 })}
                          />
                        </div>
                      )}
                      {sp.id === 'searxng' && (
                        <input
                          type="text"
                          value={sp.endpoint ?? ''}
                          onChange={e => setSearchProvider(sp.id as SearchProviderId, { endpoint: e.target.value })}
                          placeholder="http://localhost:8888"
                          className="w-48 bg-surface-3 border border-border rounded px-2 py-1 text-xs font-mono text-text/60"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </Tabs.Content>

              {/* ── Backend Tab ── */}
              <Tabs.Content value="backend" className="p-6 space-y-4">
                <div className="p-3 rounded-xl bg-violet-dim border border-violet/20 text-xs text-text/70">
                  Override these to connect to your own self-hosted INTOIT backend. Leave blank to use the default hosted service.
                </div>
                {[
                  { key: 'supabaseUrl', label: 'Supabase URL', placeholder: 'https://xxxx.supabase.co' },
                  { key: 'supabaseAnonKey', label: 'Supabase Anon Key', placeholder: 'eyJhbGc…' },
                  { key: 'coreApiUrl', label: 'Core API URL', placeholder: 'https://api.intoit.app' },
                  { key: 'orchestratorUrl', label: 'Orchestrator URL', placeholder: 'https://orchestrator.intoit.app' },
                  { key: 'knowledgeServiceUrl', label: 'Knowledge Service URL', placeholder: 'https://knowledge.intoit.app' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-[11px] text-text/50 mb-1 block">{label}</label>
                    <input
                      type="text"
                      value={(backend as Record<string, string>)[key] ?? ''}
                      onChange={e => setBackend({ [key]: e.target.value } as Parameters<typeof setBackend>[0])}
                      placeholder={placeholder}
                      className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs font-mono text-text/70 focus:outline-none focus:border-cyan/30"
                    />
                  </div>
                ))}
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ─── Helpers ──────────────────────────────────────────────
function getKeyPlaceholder(id: LLMProviderId): string {
  const map: Partial<Record<LLMProviderId, string>> = {
    anthropic: 'sk-ant-…', openai: 'sk-…', gemini: 'AIzaSy…',
    deepseek: 'sk-…', zhipu: 'your-api-key', mistral: 'your-api-key',
    huggingface: 'hf_…', openrouter: 'sk-or-…',
  }
  return map[id] ?? 'your-api-key'
}

function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
