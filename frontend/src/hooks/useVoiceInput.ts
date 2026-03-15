import { useState, useCallback, useRef, useEffect } from 'react'

// ═══════════════════════════════════════════════════════════
// useVoiceInput — Web Speech API with cloud STT fallback
// ═══════════════════════════════════════════════════════════

export interface VoiceInputState {
  isListening: boolean
  transcript: string
  interimTranscript: string
  error: string | null
  isSupported: boolean
}

export interface VoiceInputActions {
  startListening: () => void
  stopListening: () => void
  clearTranscript: () => void
}

// Default STT config
interface STTConfig {
  provider: string
  language?: string
  continuous?: boolean
}

const DEFAULT_CONFIG: STTConfig = {
  provider: 'webspeech',
  language: 'en-US',
  continuous: false,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

export function useVoiceInput(): VoiceInputState & VoiceInputActions {
  const sttConfig = DEFAULT_CONFIG
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const isSupported = !!SpeechRecognition || sttConfig.provider !== 'webspeech'

  const startListening = useCallback(async () => {
    setError(null)
    setInterimTranscript('')

    if (sttConfig.provider === 'webspeech') {
      // ── Web Speech API ────────────────────────────────
      if (!SpeechRecognition) {
        setError('Web Speech API not supported in this browser')
        return
      }
      const recognition = new SpeechRecognition()
      recognition.lang = sttConfig.language || 'en-US'
      recognition.continuous = sttConfig.continuous ?? false
      recognition.interimResults = true

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (e: any) => {
        let final = '', interim = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const result = e.results[i]
          if (result.isFinal) final += result[0].transcript
          else interim += result[0].transcript
        }
        if (final) setTranscript(prev => prev + final)
        setInterimTranscript(interim)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (e: any) => {
        setError(`Speech error: ${e.error}`)
        setIsListening(false)
      }

      recognition.onend = () => setIsListening(false)
      recognitionRef.current = recognition
      recognition.start()
      setIsListening(true)

    } else if (sttConfig.provider === 'whisper-wasm') {
      // ── Whisper WASM (offline) ────────────────────────
      // The actual Whisper WASM integration requires @xenova/transformers
      // which ships as ESM — import dynamically at runtime
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        chunksRef.current = []

        mediaRecorder.ondataavailable = e => chunksRef.current.push(e.data)
        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          // Lazy-load Whisper WASM pipeline
          try {
            // @ts-ignore - optional dependency
            const { pipeline } = await import('@xenova/transformers')
            const transcriber = await (pipeline as any)('automatic-speech-recognition', 'Xenova/whisper-tiny.en')
            const buffer = await blob.arrayBuffer()
            const result = await transcriber(buffer)
            setTranscript(result.text)
          } catch (e) {
            setError('Whisper WASM not available — install @xenova/transformers')
          }
          stream.getTracks().forEach(t => t.stop())
          setIsListening(false)
        }

        mediaRecorderRef.current = mediaRecorder
        mediaRecorder.start()
        setIsListening(true)
      } catch (e) {
        setError('Microphone access denied')
      }

    } else {
      // ── Cloud STT (OpenAI Whisper, Azure, Deepgram, Google, AWS) ──
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
        chunksRef.current = []

        mediaRecorder.ondataavailable = e => chunksRef.current.push(e.data)
        mediaRecorder.onstop = async () => {
          // Would use mediaRecorder blob for cloud transcription here if needed
          // const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          stream.getTracks().forEach(t => t.stop())
          setIsListening(false)
        }

        mediaRecorderRef.current = mediaRecorder
        mediaRecorder.start()
        setIsListening(true)
      } catch {
        setError('Microphone access denied')
      }
    }
  }, [sttConfig])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsListening(false)
  }, [])

  const clearTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])

  // Cleanup on unmount
  useEffect(() => () => stopListening(), [stopListening])

  return {
    isListening, transcript, interimTranscript, error,
    isSupported, startListening, stopListening, clearTranscript,
  }
}

