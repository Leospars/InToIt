import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useRef, useState } from 'react';
import { MediaHandler } from '../utils/live/media-handler';
import { useAuth } from '@/context/auth-context';

export function RootChat() {
  return (
    <div>
      <Chat />
    </div>
  );
}

function Chat() {
  const wsRef = useRef<WebSocket | null>(null);
  const mediaHandler = useRef(new MediaHandler());
  const { session } = useAuth();

  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [messages, setMessages] = useState<{ type: string, text: string; }[]>([]);

  const userMessages: { type: string, text: string; }[] = [];
  let currentMessage: string[] = [], author: string | null = null;

  for (const message of messages) {
    if (message.type === "user" || message.type == "gemini") {
      if (!author || author === message.type) {
        currentMessage.push(message.text);
      } else {
        userMessages.push({ type: author, text: currentMessage.join(" ") });
        currentMessage = [message.text];
      }
      author = message.type;
    } else {
      if (author) {
        userMessages.push({ type: author, text: currentMessage.join(" ") });
        currentMessage = [];
        author = null;
      }
    }
  }

  async function toggleMicrophone() {
    if (!wsRef.current || !mediaHandler.current) {
      return;
    }

    if (!isMicOn) {
      try {
        await mediaHandler.current.startAudio((data) => {
          if (wsRef.current!.readyState === WebSocket.OPEN) {
            wsRef.current!.send(data);
          }
        });

        setIsMicOn(true);
      } catch (e) {
        alert("Could not start audio capture");
      }
    } else {
      mediaHandler.current.stopAudio();
      setIsMicOn(false);
    }
  }

  const attemptConnect = async () => {
    if (isConnected) return;

    await mediaHandler.current.initializeAudio();

    setIsConnected(true);

    // Initialize WebSocket
    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    const wsUrl = new URL('/api/live-chat/ws', baseUrl);
    wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';

    const ws = new WebSocket(wsUrl.href, `token.${session?.access_token}`);
    ws.binaryType = 'arraybuffer'; // Receive binary data as ArrayBuffer
    wsRef.current = ws;

    // Handle incoming messages
    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        // Handle text messages (e.g., JSON responses)
        try {
          const message = JSON.parse(event.data); // as { type: "user" | "gemini", text: string };
          if (message.text) {
            setMessages(prev => [...prev, message]);
            // console.log('Received text:', message.content);
            // Display text in UI (e.g., append to chat log)

          } else if (message.type === 'error') {
            console.error('WebSocket error:', message.message);
          }
        } catch (e) {
          console.error('Failed to parse text message:', e);
        }
      } else if (event.data instanceof ArrayBuffer) {
        // Handle audio data
        mediaHandler.current.playAudio(event.data);
      }
    };

    ws.onopen = async () => {
      toggleMicrophone();
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  return (
    <div className='flex flex-col'>
      {!isConnected && (
        <Button variant="default" onClick={attemptConnect}>Connect</Button>
      )}
      <div className='flex flex-col flex-1 justify-end overflow-y-auto gap-2'>
        {userMessages.map(({ type, text }) => {
          const isUser = type === "user";

          return (
            <div className={`w-full flex ${isUser ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`max-w-[6/10] p-1 ${isUser ? "bg-blue-500" : "bg-neutral-200"}`}>
                {text}
              </div>
            </div>
          );
        })}
      </div>
      {isConnected && (

        <div className='w-full flex justify-center'>
          <Button onClick={toggleMicrophone}>
            {isMicOn ?
              <Mic />
              : <MicOff />
            }
          </Button>
        </div>
      )}
    </div>
  );
}