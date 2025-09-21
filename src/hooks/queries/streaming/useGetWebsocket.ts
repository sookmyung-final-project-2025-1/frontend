'use client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';

export function useGetWebsocket() {
  const [data, setData] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('disconnected');

  const clientRef = useRef<Client | null>(null);
  const subRef = useRef<StompSubscription | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // 백엔드 WebSocket 서버에 직접 연결
    const backendUrl =
      process.env.NEXT_PUBLIC_WS_URL || 'https://211.110.155.54';
    const wsUrl = `${backendUrl}/ws`;

    console.log('Connecting to WebSocket:', wsUrl);
    setConnectionStatus('connecting');

    // SockJS 옵션 설정
    const sock = new SockJS(wsUrl, undefined, {
      transports: ['xhr-streaming', 'xhr-polling', 'websocket'],
      timeout: 10000,
    });

    const client = new Client({
      webSocketFactory: () => sock as unknown as WebSocket,
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      // 디버그 로그
      debug: (msg) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[STOMP]', msg);
        }
      },

      onConnect: (frame) => {
        console.log('STOMP connected:', frame);
        setConnectionStatus('connected');

        // 실시간 거래 데이터 구독
        subRef.current = client.subscribe(
          '/topic/realtime-transactions',
          (msg: IMessage) => {
            try {
              const parsedData = JSON.parse(msg.body);
              console.log('Received data:', parsedData);
              setData(parsedData);
            } catch (e) {
              console.error('Failed to parse WebSocket message:', e);
            }
          }
        );

        // 스트리밍 상태 구독 (추가)
        client.subscribe('/topic/streaming-status', (msg: IMessage) => {
          try {
            const statusData = JSON.parse(msg.body);
            console.log('Streaming status update:', statusData);
            // 상태 업데이트 로직 추가 가능
          } catch (e) {
            console.error('Failed to parse status message:', e);
          }
        });
      },

      onWebSocketClose: (evt) => {
        console.log('WebSocket closed:', evt.code, evt.reason);
        setConnectionStatus('disconnected');
      },

      onWebSocketError: (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      },

      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
        setConnectionStatus('error');
      },

      onDisconnect: () => {
        console.log('STOMP disconnected');
        setConnectionStatus('disconnected');
      },
    });

    // 연결 활성화
    client.activate();
    clientRef.current = client;

    // 정리 함수
    return () => {
      console.log('Cleaning up WebSocket connection');
      try {
        subRef.current?.unsubscribe();
      } catch (e) {
        console.error('Error unsubscribing:', e);
      }

      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }

      startedRef.current = false;
      setConnectionStatus('disconnected');
    };
  }, []);

  // 수동 재연결 함수
  const reconnect = () => {
    if (clientRef.current) {
      clientRef.current.forceDisconnect();
      setTimeout(() => {
        clientRef.current?.activate();
      }, 1000);
    }
  };

  return {
    data,
    transactions: data?.transactions ?? [],
    virtualTime: data?.virtualTime,
    transactionCount: data?.transactionCount ?? 0,
    connectionStatus,
    reconnect,
  };
}
