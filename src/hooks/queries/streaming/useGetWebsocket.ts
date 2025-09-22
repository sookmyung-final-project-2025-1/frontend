// src/hooks/ws/useGetWebsocket.ts
'use client';

import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';

type ConnStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function useGetWebsocket() {
  const [data, setData] = useState<any>(null);
  const [statusData, setStatusData] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnStatus>('disconnected');

  const clientRef = useRef<Client | null>(null);
  const transactionSubRef = useRef<StompSubscription | null>(null);
  const statusSubRef = useRef<StompSubscription | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    /**
     * 핵심: 프록시 엔드포인트는 동일 오리진 상대경로로 사용
     * - 서버(Nginx 등)에서 /proxy/ws → 백엔드 /ws 로 업그레이드 프록시되어 있어야 함
     */
    const base = process.env.NEXT_PUBLIC_API_WS_BASE?.replace(/\/+$/, '') || '';
    // base가 비어있으면 현재 오리진 사용 → '/proxy/ws'
    const wsUrl = `${base}/ws`;

    console.log('WebSocket connecting to:', wsUrl);
    setConnectionStatus('connecting');

    // SockJS 인스턴스 (상대/절대 URL 모두 허용)
    const sock = new SockJS(wsUrl, undefined, {
      transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
      timeout: 10000,
    });

    const client = new Client({
      webSocketFactory: () => sock as unknown as WebSocket,
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (msg) => {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('[STOMP]', msg);
        }
      },
      onConnect: (frame) => {
        console.log('STOMP connected:', frame);
        setConnectionStatus('connected');

        // 실시간 거래 데이터
        transactionSubRef.current = client.subscribe(
          '/topic/realtime-transactions',
          (msg: IMessage) => {
            try {
              const parsed = JSON.parse(msg.body);
              setData(parsed);
            } catch (e) {
              console.error('parse transaction msg failed:', e, msg.body);
            }
          }
        );

        // 스트리밍 상태
        statusSubRef.current = client.subscribe(
          '/topic/streaming-status',
          (msg: IMessage) => {
            try {
              const parsed = JSON.parse(msg.body);
              setStatusData(parsed);
            } catch (e) {
              console.error('parse status msg failed:', e, msg.body);
            }
          }
        );
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
        setConnectionStatus('error');
      },
      onWebSocketError: (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      },
      onWebSocketClose: () => {
        console.log('WebSocket closed');
        setConnectionStatus('disconnected');
      },
      onDisconnect: () => {
        console.log('STOMP disconnected');
        setConnectionStatus('disconnected');
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      try {
        transactionSubRef.current?.unsubscribe();
        statusSubRef.current?.unsubscribe();
      } catch {}
      clientRef.current?.deactivate();
      clientRef.current = null;
      startedRef.current = false;
      setConnectionStatus('disconnected');
    };
  }, []);

  const reconnect = () => {
    if (!clientRef.current) return;
    clientRef.current.forceDisconnect();
    setTimeout(() => clientRef.current?.activate(), 800);
  };

  return {
    // 거래 데이터
    data,
    transactions: data?.transactions ?? [],
    virtualTime: data?.virtualTime,
    transactionCount: data?.transactionCount ?? 0,

    // 상태 데이터
    statusData,

    // 연결 상태
    connectionStatus,
    reconnect,
  };
}
