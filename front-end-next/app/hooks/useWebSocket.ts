import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '@/app/store/auth.store';

export const useWebSocket = (onMessage: (msg: any) => void) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { accessToken } = useAuthStore();
  
  // Use a ref for the callback to prevent reconnection loops when the callback changes
  const onMessageRef = useRef(onMessage);
  
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (!accessToken || (ws.current && ws.current.readyState === WebSocket.OPEN)) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/api/v1/ws'}?token=${accessToken}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WS Connected');
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch (err) {
        console.error('WS Parse Error:', err);
      }
    };

    ws.current.onclose = () => {
      console.log('WS Disconnected');
      setIsConnected(false);
      // Attempt to reconnect after 3 seconds
      setTimeout(connect, 3000);
    };

    ws.current.onerror = () => {
      setIsConnected(false);
    };
  }, [accessToken]);

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) {
        ws.current.onclose = null; // Prevent reconnect on manual close
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((msg: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    } else {
      console.warn('WS not open, cannot send message');
    }
  }, []);

  return { sendMessage, isConnected };
};
