import { useRef, useState } from 'react';
import { MediaHandler } from '../utils/live/media-handler';

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

  const [isConnected, setIsConnected] = useState(false);

  const attemptConnect = async () => {
    if (isConnected) return;

    await mediaHandler.current.initializeAudio();

    setIsConnected(true);

    // Initialize WebSocket
    const ws = new WebSocket('ws://localhost:8000/api/live-chat/ws');
    ws.binaryType = 'arraybuffer'; // Receive binary data as ArrayBuffer
    wsRef.current = ws;

    // Handle incoming messages
    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        // Handle text messages (e.g., JSON responses)
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'text') {
            console.log('Received text:', message.content);
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
      try {
        await mediaHandler.current.startAudio((data) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
          }
        });
      } catch (e) {
        alert("Could not start audio capture");
      }
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
    <div>
      <h1>Live Chat</h1>
      <button onClick={attemptConnect}>Connect</button>
      {/* Add UI for chat messages, input, etc. */}
      {/* Example: <button onClick={() => sendAudio(userAudioBuffer)}>Send Audio</button> */}
    </div>
  );
}