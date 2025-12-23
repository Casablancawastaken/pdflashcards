import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface StatusEvent {
  upload_id: number;
  status: 'uploaded' | 'generating' | 'done' | 'error';
  type: 'initial' | 'status_update' | 'final' | 'error';
  finished?: boolean;
  error?: string;
}

interface UseUploadsStatusProps {
  onStatusUpdate?: (event: StatusEvent) => void;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

let globalConnectionId = 0;

export const useUploadsStatus = (props?: UseUploadsStatusProps) => {
  const { token } = useAuth();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const connectionIdRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log(`Закрываем SSE соединение [${connectionIdRef.current}]`);
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current !== null) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
    props?.onDisconnect?.();
  }, [props]);

  const connect = useCallback(() => {
    if (!token || !isMountedRef.current) return;
    
    disconnect();

    globalConnectionId++;
    connectionIdRef.current = globalConnectionId;

    const url = new URL(`http://127.0.0.1:8000/events/uploads-status`);
    url.searchParams.append('token', token);
    url.searchParams.append('connection_id', String(connectionIdRef.current));
    
    console.log(`Создаем SSE соединение [${connectionIdRef.current}]:`, url.toString());
    const eventSource = new EventSource(url.toString());

    eventSource.onopen = () => {
      if (!isMountedRef.current) {
        eventSource.close();
        return;
      }
      console.log(`SSE подключено [${connectionIdRef.current}] для отслеживания статусов`);
      setIsConnected(true);
      props?.onConnect?.();
    };

    eventSource.onmessage = (event) => {
      if (!isMountedRef.current) return;
      
      if (event.data.trim() === '' || event.data.startsWith(':')) {
        return;
      }
      
      try {
        const data: StatusEvent = JSON.parse(event.data);
        console.log(`SSE событие [${connectionIdRef.current}]:`, data);
        props?.onStatusUpdate?.(data);
      } catch (e) {
        console.error('Ошибка парсинга SSE данных:', e);
      }
    };

    eventSource.onerror = (error) => {
      if (!isMountedRef.current) return;
      
      console.error(`SSE ошибка [${connectionIdRef.current}]:`, error);
      setIsConnected(false);
      
      disconnect();
      
      if (!reconnectTimeoutRef.current && isMountedRef.current) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log(`Попытка переподключения SSE [${connectionIdRef.current}]...`);
          reconnectTimeoutRef.current = null;
          if (isMountedRef.current) {
            connect();
          }
        }, 10000);
      }
    };

    eventSourceRef.current = eventSource;
  }, [token, props, disconnect]);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (token && isMountedRef.current) {
      const timeoutId = window.setTimeout(() => {
        if (isMountedRef.current) {
          connect();
        }
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
      };
    }
    
    return () => {};
  }, [connect, token]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    isConnected
  };
};