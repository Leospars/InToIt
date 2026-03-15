import { useStore } from '@/store';
import { cn } from '@/utils/cn';
import { Mic, MicOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// ═══════════════════════════════════════════════════════════
// useVoiceInput — Web Speech API with cloud STT fallback
// ═══════════════════════════════════════════════════════════

export interface VoiceInputState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
}

export interface VoiceInputActions {
  startListening: () => void;
  stopListening: () => void;
  clearTranscript: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function useVoiceInput(): VoiceInputState & VoiceInputActions {
  const sttConfig = useStore(s => s.sttConfig);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const isSupported = !!SpeechRecognition || sttConfig.provider !== 'webspeech';

  const startListening = useCallback(async () => {
    setError(null);
    setInterimTranscript('');

    if (sttConfig.provider === 'webspeech') {
      // ── Web Speech API ────────────────────────────────
      if (!SpeechRecognition) {
        setError('Web Speech API not supported in this browser');
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = sttConfig.language || 'en-US';
      recognition.continuous = sttConfig.continuous ?? false;
      recognition.interimResults = true;

      recognition.onresult = (e: SpeechRecognitionEvent) => {
        let final = '', interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const result = e.results[i];
          if (result.isFinal) final += result[0].transcript;
          else interim += result[0].transcript;
        }
        if (final) setTranscript(prev => prev + final);
        setInterimTranscript(interim);
      };

      recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
        setError(`Speech error: ${e.error}`);
        setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);

    } else if (sttConfig.provider === 'whisper-wasm') {
      // ── Whisper WASM (offline) ────────────────────────
      // The actual Whisper WASM integration requires @xenova/transformers
      // which ships as ESM — import dynamically at runtime
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        chunksRef.current = [];

        mediaRecorder.ondataavailable = e => chunksRef.current.push(e.data);
        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          // Lazy-load Whisper WASM pipeline
          try {
            const { pipeline } = await import('@xenova/transformers');
            const transcriber = await (pipeline as Function)('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
            const buffer = await blob.arrayBuffer();
            const result = await transcriber(buffer);
            setTranscript(result.text);
          } catch (e) {
            setError('Whisper WASM not available — install @xenova/transformers');
          }
          stream.getTracks().forEach(t => t.stop());
          setIsListening(false);
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsListening(true);
      } catch (e) {
        setError('Microphone access denied');
      }

    } else {
      // ── Cloud STT (OpenAI Whisper, Azure, Deepgram, Google, AWS) ──
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        chunksRef.current = [];

        mediaRecorder.ondataavailable = e => chunksRef.current.push(e.data);
        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const text = await transcribeCloud(blob, sttConfig as STTCloudConfig);
          if (text) setTranscript(prev => prev + text);
          stream.getTracks().forEach(t => t.stop());
          setIsListening(false);
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsListening(true);
      } catch {
        setError('Microphone access denied');
      }
    }
  }, [sttConfig]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopListening(), [stopListening]);

  return {
    isListening, transcript, interimTranscript, error,
    isSupported, startListening, stopListening, clearTranscript,
  };
}

// ─── Cloud transcription dispatcher ──────────────────────
interface STTCloudConfig {
  provider: string; apiKey?: string; region?: string; language?: string;
}

async function transcribeCloud(blob: Blob, config: STTCloudConfig): Promise<string> {
  switch (config.provider) {
    case 'openai-whisper': {
      const fd = new FormData();
      fd.append('file', blob, 'audio.webm');
      fd.append('model', 'whisper-1');
      if (config.language) fd.append('language', config.language);
      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST', headers: { Authorization: `Bearer ${config.apiKey}` }, body: fd,
      });
      const d = await res.json();
      return d.text ?? '';
    }

    case 'deepgram': {
      const buf = await blob.arrayBuffer();
      const res = await fetch('https://api.deepgram.com/v1/listen?smart_format=true', {
        method: 'POST',
        headers: { Authorization: `Token ${config.apiKey}`, 'Content-Type': 'audio/webm' },
        body: buf,
      });
      const d = await res.json();
      return d.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '';
    }

    case 'azure-speech': {
      const region = config.region || 'eastus';
      const lang = config.language || 'en-US';
      const buf = await blob.arrayBuffer();
      const res = await fetch(
        `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${lang}`,
        {
          method: 'POST',
          headers: { 'Ocp-Apim-Subscription-Key': config.apiKey ?? '', 'Content-Type': 'audio/webm; codec=opus' },
          body: buf,
        }
      );
      const d = await res.json();
      return d.DisplayText ?? '';
    }

    default:
      return '';
  }
}

// ─── Voice Button Component ───────────────────────────────

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export function VoiceButton({ onTranscript, className }: VoiceButtonProps) {
  const { isListening, transcript, interimTranscript, error, isSupported, startListening, stopListening, clearTranscript } = useVoiceInput();

  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
      clearTranscript();
    }
  }, [transcript, onTranscript, clearTranscript]);

  if (!isSupported) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        onClick={isListening ? stopListening : startListening}
        className={cn(
          'p-2 rounded-lg border transition-all',
          isListening
            ? 'border-red-500/50 bg-red-500/10 text-red-400 animate-pulse-cyan'
            : 'border-border bg-surface-2 text-text/50 hover:text-text hover:border-border-2'
        )}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? <MicOff size={14} /> : <Mic size={14} />}
      </button>
      {interimTranscript && (
        <span className="text-xs text-text/40 italic truncate max-w-48">{interimTranscript}</span>
      )}
      {error && <span className="text-xs text-red-400 truncate max-w-48">{error}</span>}
    </div>
  );
}