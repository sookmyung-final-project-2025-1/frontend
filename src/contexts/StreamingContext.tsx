'use client';

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useChangeSpeed } from '@/hooks/queries/streaming/useChangeSpeed';
import { useGetStreamingStatus } from '@/hooks/queries/streaming/useGetStreamingStatus';
import { useJumpStreaming } from '@/hooks/queries/streaming/useJumpStreaming';
import { usePauseStreaming } from '@/hooks/queries/streaming/usePauseStreaming';
import { useResumeStreaming } from '@/hooks/queries/streaming/useResumeStreaming';
import { useSetStreamingTimemachine } from '@/hooks/queries/streaming/useSetStreamingTimemachine';
import { useStartStreamingRealtime } from '@/hooks/queries/streaming/useStartStreamingRealtime';
import { useStopStreaming } from '@/hooks/queries/streaming/useStopStreaming';

export type DetectionResult = {
  timestamp: string;
  score: number;
  prediction: 'fraud' | 'normal';
  confidence: number;
  models: { lgbm: number; xgb: number; cat: number };
};

export type StreamingStatusData = {
  currentVirtualTime: string;
  isPaused: boolean;
  isStreaming: boolean;
  mode: 'TIMEMACHINE' | 'REALTIME';
  progress: number; // 0..1
  speedMultiplier: number;
  updatedAt: string;
};

type StreamingStatus = {
  currentVirtualTime?: string;
  isPaused: boolean;
  isStreaming: boolean;
  mode: 'TIMEMACHINE' | 'REALTIME';
  progress?: number;
  speedMultiplier: number;
  updatedAt?: string;

  // 레거시 호환
  playing: boolean;
  speed: number;
  virtualTime?: string;
};

type StreamingMode = 'realtime' | 'timemachine';

type Ctx = {
  mode: StreamingMode;
  status: StreamingStatus;
  data: DetectionResult[];
  streamingData: StreamingStatusData | null;
  loading: boolean;
  error: boolean;
  startRealtime: () => Promise<void>;
  startTimemachine: (iso: string, speedMultiplier?: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  jump: (iso: string) => Promise<void>;
  changeSpeed: (speed: number) => Promise<void>;
  refresh: () => Promise<void>;
};

const StreamingCtx = createContext<Ctx | null>(null);

// ...상단 import/타입 동일

function normalizeStatus(raw: any): StreamingStatus {
  const currentVirtualTime = raw?.currentVirtualTime ?? raw?.virtualTime ?? '';
  const rawMode: string = raw?.mode || '';
  const mode = rawMode === 'TIMEMACHINE' ? 'TIMEMACHINE' : 'REALTIME';

  const isPaused = Boolean(raw?.isPaused);
  const isStreaming = Boolean(raw?.isStreaming);
  const progress = typeof raw?.progress === 'number' ? raw.progress : undefined;
  const speedMultiplier = Number(raw?.speedMultiplier ?? 1);
  const updatedAt = raw?.updatedAt;

  return {
    currentVirtualTime,
    isPaused,
    isStreaming,
    mode, // 'REALTIME' | 'TIMEMACHINE'
    progress,
    speedMultiplier,
    updatedAt,
    playing: isStreaming && !isPaused,
    speed: speedMultiplier,
    virtualTime: currentVirtualTime,
  };
}

function extractStreamingData(raw: any): StreamingStatusData | null {
  if (!raw) return null;
  return {
    currentVirtualTime: raw.currentVirtualTime || '',
    isPaused: Boolean(raw.isPaused),
    isStreaming: Boolean(raw.isStreaming),
    mode: raw.mode === 'TIMEMACHINE' ? 'TIMEMACHINE' : 'REALTIME',
    progress: typeof raw.progress === 'number' ? raw.progress : 0,
    speedMultiplier: Number(raw.speedMultiplier ?? 1),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

function normalizeRecords(raw: any): DetectionResult[] {
  const arr =
    raw?.records ||
    raw?.items ||
    raw?.data ||
    (Array.isArray(raw) ? raw : []) ||
    [];
  return (arr as any[]).map((item) => {
    const score = Number(item.fraud_score ?? item.score ?? 0);
    return {
      timestamp: item.timestamp || item.created_at || new Date().toISOString(),
      score,
      prediction: (item.prediction ?? (score >= 0.5 ? 'fraud' : 'normal')) as
        | 'fraud'
        | 'normal',
      confidence: Number(item.confidence ?? 0.85),
      models: {
        lgbm: Number(item.lgbm_score ?? item.model_scores?.lgbm ?? 0.33),
        xgb: Number(item.xgb_score ?? item.model_scores?.xgb ?? 0.33),
        cat: Number(item.cat_score ?? item.model_scores?.cat ?? 0.34),
      },
    };
  });
}

export function StreamingProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<StreamingMode>('realtime');
  const [data, setData] = useState<DetectionResult[]>([]);
  const [status, setStatus] = useState<StreamingStatus>({
    isPaused: false,
    isStreaming: false,
    mode: 'REALTIME',
    speedMultiplier: 1,
    playing: false,
    speed: 1,
  });
  const [streamingData, setStreamingData] =
    useState<StreamingStatusData | null>(null);

  const statusQ = useGetStreamingStatus();

  const changeSpeedM = useChangeSpeed();
  const jumpM = useJumpStreaming();
  const pauseM = usePauseStreaming();
  const resumeM = useResumeStreaming();
  const startRealtimeM = useStartStreamingRealtime();
  const startTimemachineM = useSetStreamingTimemachine();
  const stopM = useStopStreaming();

  useEffect(() => {
    if (!statusQ.data) return;
    const raw = statusQ.data as any;

    const streamingInfo = extractStreamingData(raw);
    setStreamingData(streamingInfo);

    const normalizedStatus = normalizeStatus(raw);
    setStatus(normalizedStatus);

    const newMode =
      normalizedStatus.mode === 'TIMEMACHINE' ? 'timemachine' : 'realtime';
    setMode(newMode);

    if (newMode === 'realtime') {
      setData(normalizeRecords(raw));
    }
  }, [statusQ.data]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (mode !== 'realtime') {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    const tick = () => statusQ.refetch();
    tick();
    pollRef.current = setInterval(tick, status.playing ? 3000 : 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [mode, status.playing, statusQ]);

  const refresh = useCallback(async () => {
    await statusQ.refetch();
  }, [statusQ]);

  const startRealtime = useCallback(async () => {
    await startRealtimeM.mutateAsync(undefined);
    setMode('realtime');
    await refresh();
  }, [startRealtimeM, refresh]);

  const startTimemachine = useCallback(
    async (iso: string, speedMultiplier = 1) => {
      await startTimemachineM.mutateAsync({
        startTime: iso,
        speedMultiplier: String(speedMultiplier),
      });
      setMode('timemachine');
      const res = await statusQ.refetch();
      setData(normalizeRecords(res?.data));
    },
    [startTimemachineM, statusQ]
  );

  const pause = useCallback(async () => {
    await pauseM.mutateAsync(undefined);
    await refresh();
  }, [pauseM, refresh]);

  const resume = useCallback(async () => {
    await resumeM.mutateAsync(undefined);
    await refresh();
  }, [resumeM, refresh]);

  const stop = useCallback(async () => {
    await stopM.mutateAsync(undefined);
    setMode('realtime');
    await refresh();
  }, [stopM, refresh]);

  const jump = useCallback(
    async (iso: string) => {
      await jumpM.mutateAsync(iso);
      if (mode === 'timemachine') {
        const res = await statusQ.refetch();
        setData(normalizeRecords(res?.data));
      } else {
        await refresh();
      }
    },
    [jumpM, mode, refresh, statusQ]
  );

  const changeSpeed = useCallback(
    async (spd: number) => {
      await changeSpeedM.mutateAsync(spd);
      await refresh();
    },
    [changeSpeedM, refresh]
  );

  const value: Ctx = {
    mode,
    status,
    data,
    streamingData,
    loading: statusQ.isLoading,
    error: !!statusQ.error,
    startRealtime,
    startTimemachine,
    pause,
    resume,
    stop,
    jump,
    changeSpeed,
    refresh,
  };

  return (
    <StreamingCtx.Provider value={value}>{children}</StreamingCtx.Provider>
  );
}

export function useStreaming() {
  const ctx = useContext(StreamingCtx);
  if (!ctx)
    throw new Error('useStreaming must be used within StreamingProvider');
  return ctx;
}
