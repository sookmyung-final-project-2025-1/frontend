// useLiveTransactions.ts
'use client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';

type Tx = {
  id: number;
  amount: number;
  merchant: string;
  time: string; // ISO
  isFraud: boolean;
  // 서버가 주면: score/confidence/models...
};

export function useLiveTransactions() {
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const clientRef = useRef<Client | null>(null);
  const subRef = useRef<StompSubscription | null>(null);
  const startedRef = useRef(false); // dev 중복 연결 방지

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // 백엔드 SockJS 엔드포인트(프록시 경유)
    const sock = new SockJS('/proxy/ws');
    const client = new Client({
      webSocketFactory: () => sock as any,
      reconnectDelay: 3000,
      onConnect: () => {
        // ✅ 여기서 토픽 구독
        subRef.current = client.subscribe(
          '/topic/realtime-transactions',
          (msg: IMessage) => {
            try {
              const body = JSON.parse(msg.body);
              const items: Tx[] = (body.transactions ?? []).map((t: any) => ({
                id: t.id,
                amount: t.amount,
                merchant: t.merchant,
                time: t.time,
                isFraud: !!t.isFraud,
              }));
              if (items.length) {
                // 최신 N개만 유지(예: 5000)
                setTransactions((prev) => [...prev, ...items].slice(-5000));
              }
            } catch {
              /* ignore */
            }
          }
        );
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      try {
        subRef.current?.unsubscribe();
      } catch {}
      client.deactivate();
      clientRef.current = null;
      startedRef.current = false;
    };
  }, []);

  return transactions;
}
