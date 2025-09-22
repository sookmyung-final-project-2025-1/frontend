'use client';

import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client'; // http/https용만 사용됨

type ConnStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type WsPacket =
  | {
      transactionCount?: number;
      virtualTime?: string;
      timestamp?: string;
      transactions?: any[];
      data?: any[];
      [k: string]: any;
    }
  | any[]
  | null
  | undefined;

/* 패킷에서 거래 배열 추출 */
function extractTransactions(packet: WsPacket): any[] {
  let list: any[] = [];
  if (!packet) return list;
  if (Array.isArray(packet)) list = packet;
  else if (Array.isArray((packet as any).transactions))
    list = (packet as any).transactions;
  else if (Array.isArray((packet as any).data)) list = (packet as any).data;
  else if (typeof packet === 'object') list = [packet];
  return list;
}

export function useGetWebsocket() {
  const [data, setData] = useState<{
    transactions: any[];
    virtualTime?: string;
    transactionCount?: number;
  }>({ transactions: [] });

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

    const RAW_URL = (process.env.NEXT_PUBLIC_API_WS_URL || '').trim();
    const proxyUrl =
      (process.env.NEXT_PUBLIC_WS_PROXY_URL || '/proxy/ws').trim() ||
      '/proxy/ws';

    const isWsScheme = RAW_URL ? /^wss?:\/\//i.test(RAW_URL) : false;
    const isHttpScheme = RAW_URL ? /^https?:\/\//i.test(RAW_URL) : false;

    const forceSockJs = process.env.NEXT_PUBLIC_WS_FORCE_SOCKJS === '1';

    let mode: 'native' | 'sockjs' = !forceSockJs && isWsScheme ? 'native' : 'sockjs';
    let finalUrl = mode === 'native'
      ? RAW_URL
      : isHttpScheme
        ? RAW_URL
        : proxyUrl;

    if (!RAW_URL && mode === 'sockjs') {
      finalUrl = proxyUrl;
    }

    if (!finalUrl) {
      console.error('WebSocket endpoint is missing');
      return;
    }

    if (mode === 'native' && !/^wss?:\/\//i.test(finalUrl)) {
      console.error('Native WebSocket mode requires ws/wss URL:', finalUrl);
      mode = 'sockjs';
      finalUrl = proxyUrl;
    }

    if (mode === 'sockjs' && !/^https?:\/\//i.test(finalUrl)) {
      // SockJS는 http/https 혹은 현재 오리진 상대경로 사용
      if (finalUrl.startsWith('/')) {
        finalUrl = finalUrl; // 상대 경로 허용
      } else if (isWsScheme) {
        try {
          const url = new URL(RAW_URL);
          url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
          finalUrl = url.toString();
        } catch {
          finalUrl = proxyUrl;
        }
      } else {
        finalUrl = proxyUrl;
      }
    }

    console.log(`[WS] URL=${finalUrl} MODE=${mode}`);
    setConnectionStatus('connecting');

    const client = new Client({
      reconnectDelay: 3000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      debug: (msg) => {
        if (process.env.NODE_ENV === 'development') console.log('[STOMP]', msg);
      },
      onConnect: () => {
        setConnectionStatus('connected');

        transactionSubRef.current = client.subscribe(
          '/topic/realtime-transactions',
          (msg: IMessage) => {
            try {
              const raw = msg.body ?? '';
              const parsed: WsPacket = raw ? JSON.parse(raw) : null;

              const list = extractTransactions(parsed);
              const vtRaw =
                (parsed && (parsed as any).virtualTime) ||
                (parsed && (parsed as any).timestamp) ||
                undefined;
              setData((prev) => {
                const prevTx = Array.isArray(prev.transactions)
                  ? prev.transactions
                  : [];

                const nextTransactions = list.length
                  ? [...prevTx, ...list].slice(-5000)
                  : prevTx;

                const parsedCount =
                  parsed && typeof parsed === 'object'
                    ? (parsed as any).transactionCount
                    : undefined;
                const nextCount =
                  typeof parsedCount === 'number'
                    ? parsedCount
                    : nextTransactions.length;

                return {
                  transactions: nextTransactions,
                  transactionCount: nextCount,
                  virtualTime: vtRaw ?? prev.virtualTime,
                };
              });

              console.log('[WS RX transactions]', {
                raw,
                parsed,
                listLength: list.length,
                firstItem: list[0],
                virtualTime: vtRaw ?? null,
              });
            } catch (e) {
              console.error('parse transaction failed:', e, msg.body);
            }
          }
        );
        console.log('[WS] subscribed /topic/realtime-transactions');

        statusSubRef.current = client.subscribe(
          '/topic/streaming-status',
          (msg: IMessage) => {
            try {
              const raw = msg.body ?? '';
              const parsed = raw ? JSON.parse(raw) : null;

              console.log('[WS RX status]', { raw, parsed });

              setStatusData(parsed);
            } catch (e) {
              console.error('parse status failed:', e, msg.body);
            }
          }
        );
        console.log('[WS] subscribed /topic/streaming-status');
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
        setConnectionStatus('error');
      },
      onWebSocketError: (error) => {
        console.error('WebSocket error (likely TLS/handshake):', error);
        setConnectionStatus('error');
      },
      onWebSocketClose: (evt?: CloseEvent) => {
        console.log(
          'WebSocket closed',
          evt
            ? { code: evt.code, reason: evt.reason, wasClean: evt.wasClean }
            : {}
        );
        setConnectionStatus('disconnected');
      },
      onDisconnect: () => {
        console.log('STOMP disconnected');
        setConnectionStatus('disconnected');
      },
    });

    if (mode === 'native') {
      client.brokerURL = finalUrl; // wss://host/ws
    } else {
      client.webSocketFactory = () =>
        new SockJS(finalUrl, undefined, {
          transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
          timeout: 10000,
        }) as unknown as WebSocket;
    }

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
    data,
    transactions: data.transactions ?? [],
    virtualTime: data.virtualTime,
    transactionCount: data.transactionCount ?? 0,
    statusData,
    connectionStatus,
    reconnect,
  };
}
