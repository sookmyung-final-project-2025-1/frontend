// src/hooks/queries/streaming/useGetWebsocket.ts
'use client';

import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';

type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useGetWebsocket(options?: {
  /** STOMP CONNECT 프레임에 실을 헤더 (서버가 여기서 인증할 때 사용) */
  connectHeaders?: Record<string, string>;
}) {
  const [data, setData] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<WsStatus>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);

  const clientRef = useRef<Client | null>(null);
  const txSubRef = useRef<StompSubscription | null>(null);
  const statusSubRef = useRef<StompSubscription | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // ✅ 프론트는 무조건 동일 출처 프록시 경로로 접속 (Next 라우트가 백엔드로 프록시하며 TLS 우회)
    const sock = new SockJS('/proxy/ws', undefined, {
      transports: ['xhr-streaming', 'xhr-polling', 'websocket'],
      timeout: 10000,
    });

    setConnectionStatus('connecting');
    setLastError(null);

    const client = new Client({
      webSocketFactory: () => sock as unknown as WebSocket,
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: options?.connectHeaders, // 필요 시 토큰 등 추가

      debug: (msg) => {
        if (process.env.NODE_ENV === 'development') {
          // console.log('[STOMP]', msg);
        }
      },

      onConnect: (frame) => {
        setConnectionStatus('connected');
        setLastError(null);

        // 1) 실시간 거래 데이터
        txSubRef.current = client.subscribe(
          '/topic/realtime-transactions',
          (msg: IMessage) => {
            try {
              const parsed = JSON.parse(msg.body);
              setData(parsed);
            } catch (e: any) {
              setLastError(`parse error: ${e?.message ?? String(e)}`);
            }
          }
        );

        // 2) 스트리밍 상태
        statusSubRef.current = client.subscribe(
          '/topic/streaming-status',
          (msg: IMessage) => {
            try {
              const statusUpdate = JSON.parse(msg.body);
              // 원하면 여기서 setData에 합쳐서 관리하거나 별도 상태로 노출
              // console.log('status', statusUpdate);
            } catch (e: any) {
              setLastError(`parse error: ${e?.message ?? String(e)}`);
            }
          }
        );
      },

      onWebSocketClose: (evt) => {
        setConnectionStatus('disconnected');
      },

      onWebSocketError: (error) => {
        setConnectionStatus('error');
        setLastError('WebSocket error');
      },

      onStompError: (frame) => {
        setConnectionStatus('error');
        setLastError(frame.headers['message'] || 'STOMP error');
      },

      onDisconnect: () => {
        setConnectionStatus('disconnected');
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      try {
        txSubRef.current?.unsubscribe();
      } catch {}
      try {
        statusSubRef.current?.unsubscribe();
      } catch {}
      try {
        clientRef.current?.deactivate();
      } catch {}
      clientRef.current = null;
      txSubRef.current = null;
      statusSubRef.current = null;
      startedRef.current = false;
      setConnectionStatus('disconnected');
    };
    // options?.connectHeaders가 바뀌면 재연결하고 싶다면 의존성에 추가
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reconnect = () => {
    const c = clientRef.current;
    if (!c) return;
    try {
      c.forceDisconnect();
    } catch {}
    setTimeout(() => c.activate(), 1000);
  };

  return {
    data,
    transactions: data?.transactions ?? [],
    virtualTime: data?.virtualTime,
    transactionCount: data?.transactionCount ?? 0,
    connectionStatus,
    lastError,
    reconnect,
  };
}
