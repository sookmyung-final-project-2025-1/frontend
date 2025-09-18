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

// /status 응답에서 받는 실제 데이터 구조
export type StreamingStatusData = {
  currentVirtualTime: string;
  isPaused: boolean;
  isStreaming: boolean;
  mode: 'TIMEMACHINE' | 'REALTIME';
  progress: number; // 0-1 범위
  speedMultiplier: number;
  updatedAt: string;
};

type StreamingStatus = {
  // 새로운 정규화된 필드들
  currentVirtualTime?: string;
  isPaused: boolean;
  isStreaming: boolean;
  mode: 'TIMEMACHINE' | 'REALTIME';
  progress?: number;
  speedMultiplier: number;
  updatedAt?: string;

  // 레거시 호환성을 위한 필드들
  playing: boolean;
  speed: number;
  virtualTime?: string;
};

type StreamingMode = 'realtime' | 'timemachine';

type Ctx = {
  // 상태
  mode: StreamingMode;
  status: StreamingStatus;
  data: DetectionResult[];

  // 원본 스트리밍 데이터 (UI에서 직접 사용 가능)
  streamingData: StreamingStatusData | null;

  // 로딩/에러
  loading: boolean;
  error: boolean;

  // 액션
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

// /status 응답을 정규화된 상태로 변환
function normalizeStatus(raw: any): StreamingStatus {
  // 실제 /status 응답 데이터 사용
  const currentVirtualTime = raw?.currentVirtualTime;
  const isPaused = Boolean(raw?.isPaused);
  const isStreaming = Boolean(raw?.isStreaming);
  const mode = raw?.mode === 'TIMEMACHINE' ? 'TIMEMACHINE' : 'REALTIME';
  const progress = typeof raw?.progress === 'number' ? raw.progress : undefined;
  const speedMultiplier = Number(raw?.speedMultiplier ?? 1);
  const updatedAt = raw?.updatedAt;

  // 레거시 호환성을 위한 변환
  const playing = isStreaming && !isPaused;
  const speed = speedMultiplier;
  const virtualTime = currentVirtualTime;

  return {
    currentVirtualTime,
    isPaused,
    isStreaming,
    mode,
    progress,
    speedMultiplier,
    updatedAt,
    // 레거시
    playing,
    speed,
    virtualTime,
  };
}

// 스트리밍 데이터 추출
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

// /status 응답 → 차트 데이터 정규화
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
  // 모드: 기본 실시간
  const [mode, setMode] = useState<StreamingMode>('realtime');

  // 현재 차트 데이터
  const [data, setData] = useState<DetectionResult[]>([]);

  // 상태
  const [status, setStatus] = useState<StreamingStatus>({
    isPaused: false,
    isStreaming: false,
    mode: 'REALTIME',
    speedMultiplier: 1,
    playing: false,
    speed: 1,
  });

  // 원본 스트리밍 데이터
  const [streamingData, setStreamingData] =
    useState<StreamingStatusData | null>(null);

  // /status 훅
  const statusQ = useGetStreamingStatus();

  // 제어 훅들
  const changeSpeedM = useChangeSpeed();
  const jumpM = useJumpStreaming();
  const pauseM = usePauseStreaming();
  const resumeM = useResumeStreaming();
  const startRealtimeM = useStartStreamingRealtime();
  const startTimemachineM = useSetStreamingTimemachine();
  const stopM = useStopStreaming();

  // status → 상태/데이터 반영
  useEffect(() => {
    if (!statusQ.data) return;

    const raw = statusQ.data as any;
    console.log('Raw status data:', raw); // 디버깅용

    // 원본 스트리밍 데이터 저장
    const streamingInfo = extractStreamingData(raw);
    setStreamingData(streamingInfo);

    // 상태 정규화
    const normalizedStatus = normalizeStatus(raw);
    setStatus(normalizedStatus);

    // 모드 동기화
    const newMode =
      normalizedStatus.mode === 'TIMEMACHINE' ? 'timemachine' : 'realtime';
    setMode(newMode);

    // 데이터: 실시간 모드일 때만 계속 덮어쓰기
    if (newMode === 'realtime') {
      setData(normalizeRecords(raw));
    }
  }, [statusQ.data]);

  // 실시간 폴링: realtime에서만 동작
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (mode !== 'realtime') {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    const tick = () => statusQ.refetch();
    tick(); // 즉시 1회
    pollRef.current = setInterval(tick, status.playing ? 3000 : 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [mode, status.playing, statusQ]);

  // 액션들
  const refresh = useCallback(async () => {
    await statusQ.refetch();
  }, [statusQ]);

  const startRealtime = useCallback(async () => {
    try {
      await startRealtimeM.mutateAsync(undefined);
      setMode('realtime');
      await refresh();
    } catch (error) {
      console.error('Failed to start realtime:', error);
    }
  }, [startRealtimeM, refresh]);

  const startTimemachine = useCallback(
    async (iso: string, speedMultiplier = 1) => {
      try {
        await startTimemachineM.mutateAsync({
          startTime: iso,
          speedMultiplier: String(speedMultiplier),
        });
        setMode('timemachine');
        // 타임머신 모드에서는 데이터를 스냅샷으로 고정
        const res = await statusQ.refetch();
        setData(normalizeRecords(res?.data));
      } catch (error) {
        console.error('Failed to start timemachine:', error);
      }
    },
    [startTimemachineM, statusQ]
  );

  const pause = useCallback(async () => {
    try {
      await pauseM.mutateAsync(undefined);
      await refresh();
    } catch (error) {
      console.error('Failed to pause:', error);
    }
  }, [pauseM, refresh]);

  const resume = useCallback(async () => {
    try {
      await resumeM.mutateAsync(undefined);
      await refresh();
    } catch (error) {
      console.error('Failed to resume:', error);
    }
  }, [resumeM, refresh]);

  const stop = useCallback(async () => {
    try {
      await stopM.mutateAsync(undefined);
      setMode('realtime');
      await refresh();
    } catch (error) {
      console.error('Failed to stop:', error);
    }
  }, [stopM, refresh]);

  const jump = useCallback(
    async (iso: string) => {
      try {
        await jumpM.mutateAsync(iso);
        // 타임머신 모드면 스냅샷 갱신, 실시간이면 상태만 갱신
        if (mode === 'timemachine') {
          const res = await statusQ.refetch();
          setData(normalizeRecords(res?.data));
        } else {
          await refresh();
        }
      } catch (error) {
        console.error('Failed to jump:', error);
      }
    },
    [jumpM, mode, refresh, statusQ]
  );

  const changeSpeed = useCallback(
    async (spd: number) => {
      try {
        await changeSpeedM.mutateAsync(spd);
        await refresh();
      } catch (error) {
        console.error('Failed to change speed:', error);
      }
    },
    [changeSpeedM, refresh]
  );

  const value: Ctx = {
    mode,
    status,
    data,
    streamingData, // 새로 추가
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
