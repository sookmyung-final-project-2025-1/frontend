'use client';

import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import SockJS from 'sockjs-client';

type TimeRange = '24h' | '7d' | '30d';

export type StreamingStatus = {
  isStreaming: boolean;
  isPaused: boolean;
  mode: 'REALTIME' | 'TIMEMACHINE' | '';
  speedMultiplier: number;
  currentVirtualTime: string;
  progress?: number; // 0..1
  updatedAt?: string;
};

export type DetectionResult = {
  timestamp: string;
  score: number;
  prediction: 'fraud' | 'normal';
  confidence: number;
  models: { lgbm: number; xgb: number; cat: number };
};

type Ctx = {
  status: StreamingStatus;
  data: DetectionResult[]; // 차트 데이터(WS push)
  startRealtime: () => Promise<void>;
  startTimemachine: (startIso: string, speed?: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  changeSpeed: (multiplier: number) => Promise<void>;
  jump: (targetIso: string) => Promise<void>;
  refresh: () => Promise<void>; // GET /status
  loading: boolean;
};

const StreamingContext = createContext<Ctx | null>(null);

const API = '/proxy'; // 프런트 프록시 경유

async function api(method: 'GET' | 'POST' | 'PUT', url: string) {
  const res = await fetch(url, { method, credentials: 'include' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${method} ${url} -> ${res.status} ${text}`);
  }
  return res.json().catch(() => ({}));
}

export function StreamingProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<StreamingStatus>({
    isStreaming: false,
    isPaused: false,
    mode: '',
    speedMultiplier: 1,
    currentVirtualTime: '',
  });
  const [data, setData] = useState<DetectionResult[]>([]);
  const [loading, setLoading] = useState(false);

  // --- WebSocket / STOMP ---
  const stompRef = useRef<Client | null>(null);
  const subTxRef = useRef<StompSubscription | null>(null);
  const subStatusRef = useRef<StompSubscription | null>(null);

  const connectWS = useCallback(() => {
    if (stompRef.current?.connected) return;

    // 백엔드 SockJS 엔드포인트 경로에 맞춰 수정 (예: /ws, /stomp, /socket)
    const sock = new SockJS('/proxy/ws'); // ← 서버의 SockJS 엔드포인트 프록시 경로
    const client = new Client({
      webSocketFactory: () => sock as any,
      reconnectDelay: 3000,
      onConnect: () => {
        subTxRef.current = client.subscribe(
          '/topic/realtime-transactions',
          (msg: IMessage) => {
            try {
              const body = JSON.parse(msg.body);
              // body.transactions 배열만 뽑아 차트 데이터로 적재
              const items: DetectionResult[] = (body.transactions ?? []).map(
                (t: any) => ({
                  timestamp: t.time || body.timestamp,
                  score: t.score ?? t.amount ?? 0, // 서버 포맷에 맞추세요(예시로 score 혹은 amount)
                  prediction: t.isFraud ? 'fraud' : 'normal',
                  confidence:
                    typeof t.confidence === 'number' ? t.confidence : 0.8,
                  models: {
                    lgbm: t.models?.lgbm ?? 0.33,
                    xgb: t.models?.xgb ?? 0.33,
                    cat: t.models?.cat ?? 0.34,
                  },
                })
              );
              if (items.length) {
                setData((prev) => {
                  const merged = [...prev, ...items];
                  // 메모리 보호: 최근 N개만 유지 (예: 5000)
                  return merged.slice(-5000);
                });
              }
            } catch {}
          }
        );

        subStatusRef.current = client.subscribe(
          '/topic/streaming-status',
          (msg: IMessage) => {
            try {
              const s = JSON.parse(msg.body);
              setStatus({
                isStreaming: !!s.isStreaming,
                isPaused: !!s.isPaused,
                mode: s.mode || '',
                speedMultiplier: Number(s.speedMultiplier ?? 1),
                currentVirtualTime: s.currentVirtualTime || '',
                progress:
                  typeof s.progress === 'number' ? s.progress : undefined,
                updatedAt: s.updatedAt,
              });
            } catch {}
          }
        );
      },
      onStompError: () => {},
      onWebSocketClose: () => {},
    });
    client.activate();
    stompRef.current = client;
  }, []);

  useEffect(() => {
    connectWS();
    // 언마운트 시 정리
    return () => {
      try {
        subTxRef.current?.unsubscribe();
      } catch {}
      try {
        subStatusRef.current?.unsubscribe();
      } catch {}
      stompRef.current?.deactivate();
      stompRef.current = null;
    };
  }, [connectWS]);

  // --- REST 제어 ---
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const s = await api('GET', `${API}/streaming/status`);
      setStatus({
        isStreaming: !!s.isStreaming,
        isPaused: !!s.isPaused,
        mode: s.mode || '',
        speedMultiplier: Number(s.speedMultiplier ?? 1),
        currentVirtualTime: s.currentVirtualTime || '',
        progress: typeof s.progress === 'number' ? s.progress : undefined,
        updatedAt: s.updatedAt,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const startRealtime = useCallback(async () => {
    setLoading(true);
    try {
      await api('POST', `${API}/streaming/start/realtime`);
      await refresh();
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const startTimemachine = useCallback(
    async (startIso: string, speed?: number) => {
      const u = new URL(
        `${API}/streaming/start/timemachine`,
        window.location.origin
      );
      u.searchParams.set('startTime', startIso);
      if (speed != null) u.searchParams.set('speedMultiplier', String(speed));
      setLoading(true);
      try {
        await api('POST', u.pathname + u.search);
        await refresh();
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  const pause = useCallback(async () => {
    await api('POST', `${API}/streaming/pause`);
    await refresh();
  }, [refresh]);
  const resume = useCallback(async () => {
    await api('POST', `${API}/streaming/resume`);
    await refresh();
  }, [refresh]);
  const stop = useCallback(async () => {
    await api('POST', `${API}/streaming/stop`);
    setData([]);
    await refresh();
  }, [refresh]);

  const changeSpeed = useCallback(
    async (multiplier: number) => {
      const u = new URL(`${API}/streaming/speed`, window.location.origin);
      u.searchParams.set('speedMultiplier', String(multiplier));
      await api('PUT', u.pathname + u.search);
      await refresh();
    },
    [refresh]
  );

  const jump = useCallback(
    async (targetIso: string) => {
      const u = new URL(`${API}/streaming/jump`, window.location.origin);
      u.searchParams.set('targetTime', targetIso);
      await api('POST', u.pathname + u.search);
      await refresh();
    },
    [refresh]
  );

  // 초기 상태 동기화
  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const value = useMemo<Ctx>(
    () => ({
      status,
      data,
      startRealtime,
      startTimemachine,
      pause,
      resume,
      stop,
      changeSpeed,
      jump,
      refresh,
      loading,
    }),
    [
      status,
      data,
      startRealtime,
      startTimemachine,
      pause,
      resume,
      stop,
      changeSpeed,
      jump,
      refresh,
      loading,
    ]
  );

  return (
    <StreamingContext.Provider value={value}>
      {children}
    </StreamingContext.Provider>
  );
}

export const useStreaming = () => {
  const ctx = useContext(StreamingContext);
  if (!ctx)
    throw new Error('useStreaming must be used within StreamingProvider');
  return ctx;
};
