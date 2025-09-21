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
  data: DetectionResult[];
  startRealtime: () => Promise<void>;
  startTimemachine: (startIso: string, speed?: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  changeSpeed: (multiplier: number) => Promise<void>;
  jump: (targetIso: string) => Promise<void>;
  refresh: () => Promise<void>;
  loading: boolean;
};

const StreamingContext = createContext<Ctx | null>(null);

const API = '/proxy'; // 프런트 프록시 경유

async function api(method: 'GET' | 'POST' | 'PUT', url: string) {
  const res = await fetch(url, { method, credentials: 'include' });
  if (!res.ok) {
    // 이미 실행중일 때 등은 조용히 무시하고 상태만 동기화하고 싶다면 여기에서 허용
    // if (res.status === 409 || res.status === 400) return {};
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

  // ---- WS 싱글톤 가드 ----
  const stompRef = useRef<Client | null>(null);
  const subTxRef = useRef<StompSubscription | null>(null);
  const subStatusRef = useRef<StompSubscription | null>(null);
  const wsStartedRef = useRef(false); // ✅ dev 중복연결 방지

  // ---- refresh 중복 방지 락 ----
  const refreshingRef = useRef(false);
  const firstRefreshDoneRef = useRef(false);

  const connectWS = useCallback(() => {
    if (wsStartedRef.current) return; // ✅ 이미 시작했으면 무시
    wsStartedRef.current = true;

    const sock = new SockJS('/proxy/ws');
    const client = new Client({
      webSocketFactory: () => sock as any,
      reconnectDelay: 3000,
      debug: (msg) => {
        if (process.env.NODE_ENV === 'development') {
          // console.log('[STOMP]', msg);
        }
      },
      onConnect: () => {
        subTxRef.current = client.subscribe(
          '/topic/realtime-transactions',
          (msg: IMessage) => {
            try {
              const body = JSON.parse(msg.body);
              const items: DetectionResult[] = (body.transactions ?? []).map(
                (t: any) => ({
                  timestamp: t.time || body.timestamp,
                  score: t.score ?? t.amount ?? 0,
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
                setData((prev) => [...prev, ...items].slice(-5000));
              }
            } catch {
              /* noop */
            }
          }
        );

        subStatusRef.current = client.subscribe(
          '/topic/streaming-status',
          (msg: IMessage) => {
            try {
              const s = JSON.parse(msg.body);
              setStatus((prev) => ({
                ...prev,
                isStreaming: !!s.isStreaming,
                isPaused: !!s.isPaused,
                mode: s.mode || '',
                speedMultiplier: Number(s.speedMultiplier ?? 1),
                currentVirtualTime: s.currentVirtualTime || '',
                progress:
                  typeof s.progress === 'number' ? s.progress : undefined,
                updatedAt: s.updatedAt,
              }));
            } catch {
              /* noop */
            }
          }
        );
      },
      onWebSocketClose: () => {},
      onStompError: () => {},
    });

    client.activate();
    stompRef.current = client;
  }, []);

  useEffect(() => {
    connectWS();
    return () => {
      try {
        subTxRef.current?.unsubscribe();
      } catch {}
      try {
        subStatusRef.current?.unsubscribe();
      } catch {}
      try {
        stompRef.current?.deactivate();
      } catch {}
      stompRef.current = null;
      wsStartedRef.current = false; // 정리 시 초기화
    };
  }, [connectWS]);

  // ---- REST 제어 ----
  const refresh = useCallback(async () => {
    if (refreshingRef.current) return; // ✅ 동시중복 방지
    refreshingRef.current = true;
    setLoading(true);
    try {
      const s = await api('GET', `${API}/streaming/status`);
      setStatus((prev) => ({
        ...prev,
        isStreaming: !!s.isStreaming,
        isPaused: !!s.isPaused,
        mode: s.mode || '',
        speedMultiplier: Number(s.speedMultiplier ?? 1),
        currentVirtualTime: s.currentVirtualTime || '',
        progress: typeof s.progress === 'number' ? s.progress : undefined,
        updatedAt: s.updatedAt,
      }));
    } finally {
      refreshingRef.current = false;
      setLoading(false);
    }
  }, []);

  // 초기 동기화도 딱 1번
  useEffect(() => {
    if (firstRefreshDoneRef.current) return;
    firstRefreshDoneRef.current = true; // ✅ 한 번만
    refresh().catch(() => {});
  }, [refresh]);

  const startRealtime = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      await api('POST', `${API}/streaming/start/realtime`);
      await refresh();
    } finally {
      setLoading(false);
    }
  }, [refresh, loading]);

  const startTimemachine = useCallback(
    async (startIso: string, speed?: number) => {
      if (loading) return;
      setLoading(true);
      try {
        const u = new URL(
          `${API}/streaming/start/timemachine`,
          window.location.origin
        );
        u.searchParams.set('startTime', startIso);
        if (speed != null) u.searchParams.set('speedMultiplier', String(speed));
        await api('POST', u.pathname + u.search);
        await refresh();
      } finally {
        setLoading(false);
      }
    },
    [refresh, loading]
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
