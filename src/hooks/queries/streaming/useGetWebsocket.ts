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

/* 날짜 연도만 현재로 시프트 (월/일/시분초 유지) */
function shiftYearToNow(input: unknown): unknown {
  if (typeof input !== 'string') return input;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const now = new Date();
  d.setFullYear(now.getFullYear());
  return d.toISOString();
}

/* 단일 트랜잭션 시간 필드 시프트 */
function normalizeAndShiftItem(t: any): any {
  if (!t || typeof t !== 'object') return t;
  const out: any = { ...t };
  const TS_KEYS = ['time', 'timestamp', 'eventTime', 'createdAt', 'updatedAt'];
  for (const k of TS_KEYS) if (out[k] != null) out[k] = shiftYearToNow(out[k]);
  return out;
}

/* 패킷에서 거래 배열 추출 + 시프트 */
function extractTransactions(packet: WsPacket): any[] {
  let list: any[] = [];
  if (!packet) return list;
  if (Array.isArray(packet)) list = packet;
  else if (Array.isArray((packet as any).transactions))
    list = (packet as any).transactions;
  else if (Array.isArray((packet as any).data)) list = (packet as any).data;
  else if (typeof packet === 'object') list = [packet];
  return list.map(normalizeAndShiftItem);
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
    if (!RAW_URL) {
      console.error('NEXT_PUBLIC_API_WS_URL is empty');
      return;
    }

    const isWsScheme = /^wss?:\/\//i.test(RAW_URL);
    const isHttpScheme = /^https?:\/\//i.test(RAW_URL);
    if (!isWsScheme && !isHttpScheme) {
      console.error('Invalid WS URL scheme:', RAW_URL);
      return;
    }

    // 경로 보정 없이 그대로 사용 (ex. wss://host/ws)
    const finalUrl = RAW_URL;

    console.log(
      `[WS] URL=${finalUrl} MODE=${isWsScheme ? 'native' : 'sockjs'}`
    );
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
              const vtShifted = vtRaw
                ? (shiftYearToNow(vtRaw) as string)
                : undefined;

              setData({
                transactions: list,
                transactionCount:
                  (parsed &&
                  typeof (parsed as any).transactionCount === 'number'
                    ? (parsed as any).transactionCount
                    : list.length) ?? 0,
                virtualTime: vtShifted,
              });

              if (process.env.NODE_ENV === 'development') {
                console.log(
                  '[WS RX] tx.len=',
                  list.length,
                  'virtualTime=',
                  vtShifted ?? '(none)',
                  'sample=',
                  list[0]
                );
              }
            } catch (e) {
              console.error('parse transaction failed:', e, msg.body);
            }
          }
        );

        statusSubRef.current = client.subscribe(
          '/topic/streaming-status',
          (msg: IMessage) => {
            try {
              const raw = msg.body ?? '';
              const parsed = raw ? JSON.parse(raw) : null;

              const shifted =
                parsed && typeof parsed === 'object'
                  ? (() => {
                      const out: any = { ...parsed };
                      const keys = [
                        'currentVirtualTime',
                        'currentTime',
                        'updatedAt',
                        'startTime',
                        'endTime',
                      ];
                      for (const k of keys)
                        if (out[k] != null) out[k] = shiftYearToNow(out[k]);
                      return out;
                    })()
                  : parsed;

              setStatusData(shifted);
            } catch (e) {
              console.error('parse status failed:', e, msg.body);
            }
          }
        );
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

    if (isWsScheme) {
      client.brokerURL = finalUrl; // wss://host/ws
    } else {
      const sock = new SockJS(finalUrl, undefined, {
        transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
        timeout: 10000,
      });
      client.webSocketFactory = () => sock as unknown as WebSocket;
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
