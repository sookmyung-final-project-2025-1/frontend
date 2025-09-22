'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import StreamingDetectionChart from './StreamingDetectionChart';
import StreamingTopBar from './StreamingTopBar';

import { useChangeSpeed } from '@/hooks/queries/streaming/useChangeSpeed';
import { useGetStreamingStatus } from '@/hooks/queries/streaming/useGetStreamingStatus';
import { useGetWebsocket } from '@/hooks/queries/streaming/useGetWebsocket';
import { useJumpStreaming } from '@/hooks/queries/streaming/useJumpStreaming';
import { usePauseStreaming } from '@/hooks/queries/streaming/usePauseStreaming';
import { useResumeStreaming } from '@/hooks/queries/streaming/useResumeStreaming';
import { useSetStreamingTimemachine } from '@/hooks/queries/streaming/useSetStreamingTimemachine';
import { useStartStreamingRealtime } from '@/hooks/queries/streaming/useStartStreamingRealtime';
import { useStopStreaming } from '@/hooks/queries/streaming/useStopStreaming';
import StreamingDataTable from './StreamingDataTable';

import type { DetectionResult, TimeRange } from './types';

export const RANGE_MS: Record<TimeRange, number> = {
  '24h': 24 * 3600_000,
  '7d': 7 * 24 * 3600_000,
  '30d': 30 * 24 * 3600_000,
};

// ---------- 유틸 ----------
function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
function toIsoStringSafe(input: unknown): string {
  if (typeof input === 'number') {
    const d = new Date(input);
    return Number.isFinite(d.getTime())
      ? d.toISOString()
      : new Date().toISOString();
  }
  if (typeof input === 'string') {
    const t = Date.parse(input);
    if (Number.isFinite(t)) return new Date(t).toISOString();
    return new Date().toISOString();
  }
  return new Date().toISOString();
}
function pctToIso(pct: number, range: TimeRange, refIso?: string) {
  const clamped = clamp(pct, 0, 100);
  const span = RANGE_MS[range];
  const end = refIso ? Date.parse(refIso) : Date.now();
  const endMs = Number.isFinite(end) ? end : Date.now();
  const start = endMs - span;
  return new Date(start + (span * clamped) / 100).toISOString();
}
function buildVisibleData(
  all: DetectionResult[],
  range: TimeRange,
  pct: number,
  refIso?: string
) {
  if (!all?.length) return [];
  const sorted = [...all].sort(
    (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
  );

  const lastTs = Date.parse(sorted[sorted.length - 1].timestamp);
  const fallbackEnd = Number.isFinite(lastTs) ? lastTs : Date.now();
  const end = refIso ? Date.parse(refIso) : fallbackEnd;
  const endMs = Number.isFinite(end) ? end : fallbackEnd;
  const startMs = endMs - RANGE_MS[range];

  const inRange = sorted.filter((d) => {
    const t = Date.parse(d.timestamp);
    return Number.isFinite(t) && t >= startMs && t <= endMs;
  });

  const pos = Math.min(100, Math.max(0, pct));
  const base = inRange.length ? inRange : sorted;
  const endIdx = Math.floor((pos * base.length) / 100);
  return base.slice(0, Math.max(1, endIdx));
}

// ---------- 컴포넌트 ----------
export default function StreamingDashboard() {
  const { data: status, refetch, isFetching } = useGetStreamingStatus();
  const {
    transactions,
    statusData: wsStatusData,
    connectionStatus,
    virtualTime: wsVirtualTime,
  } = useGetWebsocket();

  const startRealtime = useStartStreamingRealtime();
  const startTimemachine = useSetStreamingTimemachine();
  const jump = useJumpStreaming();
  const pause = usePauseStreaming();
  const resume = useResumeStreaming();
  const stop = useStopStreaming();
  const changeSpeed = useChangeSpeed();

  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualPosition, setManualPosition] = useState<number | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const handleMouseDown = () => (isDraggingRef.current = true);
    const handleMouseUp = () => (isDraggingRef.current = false);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const referenceIso = useMemo<string>(() => {
    const s: any = wsStatusData || status || {};
    return (
      s.currentVirtualTime ??
      s.currentTime ??
      wsVirtualTime ??
      new Date().toISOString()
    );
  }, [wsStatusData, status, wsVirtualTime]);

  const currentPosition = useMemo(() => {
    if (manualPosition !== null) return clamp(manualPosition, 0, 100);

    const s: any = wsStatusData || status || {};
    if (typeof s.progress === 'number') return clamp(s.progress * 100, 0, 100);

    const currentTime = s.currentVirtualTime ?? s.currentTime ?? wsVirtualTime;
    if (currentTime) {
      const end = Date.parse(currentTime);
      const endMs = Number.isFinite(end) ? end : Date.now();
      const span = RANGE_MS[timeRange];
      const start = endMs - span;
      return clamp(((endMs - start) / span) * 100, 0, 100);
    }
    return 0;
  }, [manualPosition, wsStatusData, status, timeRange, wsVirtualTime]);

  const playing = useMemo(() => {
    const s: any = status || {};
    return !!s.isStreaming && !s.isPaused;
  }, [status]);

  const speed = useMemo(() => {
    const s: any = status || {};
    return s.speedMultiplier ?? s.speed ?? 1;
  }, [status]);

  const virtualTime = useMemo(() => {
    const s: any = status || {};
    return s.currentVirtualTime ?? s.currentTime ?? wsVirtualTime ?? '';
  }, [status, wsVirtualTime]);

  const online = connectionStatus === 'connected';

  // WS 연결되면 1회 자동 Realtime 시작
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStartedRef.current) return;
    if (!online) return;

    const s: any = status || {};
    if (s?.isStreaming && !s?.isPaused) {
      autoStartedRef.current = true;
      return;
    }
    autoStartedRef.current = true;
    startRealtime.mutate();
  }, [online, status, startRealtime]);

  const normalizedData = useMemo<DetectionResult[]>(() => {
    const rows = (transactions ?? []).map((t: any) => {
      const pred: DetectionResult['prediction'] = t.isFraud
        ? 'fraud'
        : 'normal';
      return {
        timestamp: toIsoStringSafe(
          t.time ?? t.timestamp ?? t.eventTime ?? t.createdAt ?? Date.now()
        ),
        score: Number(
          t.score ?? t.amount ?? t.probability ?? t.fraudScore ?? t.risk ?? 0
        ),
        prediction: pred,
        confidence: Number(t.confidence ?? t.conf ?? t.prob ?? t.p ?? 0.8),
        models: {
          lgbm: Number(
            t.models?.lgbm ?? t.models?.lgb ?? t.models?.lightgbm ?? 0.33
          ),
          xgb: Number(t.models?.xgb ?? t.models?.xgboost ?? 0.33),
          cat: Number(t.models?.cat ?? t.models?.catboost ?? 0.34),
        },
      };
    });
    rows.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    return rows;
  }, [transactions]);

  const visibleData = useMemo<DetectionResult[]>(() => {
    return buildVisibleData(
      normalizedData,
      timeRange,
      currentPosition,
      referenceIso
    );
  }, [normalizedData, timeRange, currentPosition, referenceIso]);

  const safeApiCall = async (apiCall: () => Promise<any>) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await apiCall();
      await refetch();
    } finally {
      setIsProcessing(false);
    }
  };

  const onPlay = async () => {
    const s: any = status || {};
    const isPaused = !!s.isPaused;
    const isStreaming = !!s.isStreaming;
    const mode = s?.mode;

    if (isStreaming && isPaused) {
      await safeApiCall(() => resume.mutateAsync());
    } else if (!isStreaming) {
      if (currentPosition >= 99.9) {
        await safeApiCall(() => startRealtime.mutateAsync());
      } else {
        const targetTime = pctToIso(currentPosition, timeRange, referenceIso);
        await safeApiCall(() =>
          startTimemachine.mutateAsync({
            startTime: targetTime,
            speedMultiplier: speed,
          })
        );
      }
    } else {
      if (mode === 'TIMEMACHINE' || mode === 'REALTIME') return;
    }
  };

  const onPause = async () => {
    await safeApiCall(() => pause.mutateAsync());
  };

  const onSpeedChange = async (newSpeed: number) => {
    await safeApiCall(() => changeSpeed.mutateAsync(newSpeed));
  };

  const onSeek = async (iso: string) => {
    setManualPosition(null);
    const s: any = status || {};
    const mode = s?.mode;
    const isStreaming = !!s?.isStreaming;

    if (mode === 'TIMEMACHINE' && isStreaming && !s?.isPaused) {
      await safeApiCall(() => jump.mutateAsync(iso));
    } else {
      await safeApiCall(() =>
        startTimemachine.mutateAsync({ startTime: iso, speedMultiplier: speed })
      );
    }
  };

  const onPositionChange = async (pct: number) => {
    const clamped = clamp(pct, 0, 100);
    setManualPosition(clamped);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      async () => {
        const s: any = status || {};
        if (clamped >= 99.9) {
          await safeApiCall(() => startRealtime.mutateAsync());
          setManualPosition(null);
        } else {
          const targetTime = pctToIso(clamped, timeRange, referenceIso);
          if (s?.mode === 'TIMEMACHINE' && s?.isStreaming && !s?.isPaused) {
            await safeApiCall(() => jump.mutateAsync(targetTime));
          } else {
            await safeApiCall(() =>
              startTimemachine.mutateAsync({
                startTime: targetTime,
                speedMultiplier: speed,
              })
            );
          }
          setManualPosition(null);
        }
      },
      isDraggingRef.current ? 200 : 0
    );
  };

  const loading =
    isProcessing ||
    isFetching ||
    startRealtime.isPending ||
    startTimemachine.isPending ||
    pause.isPending ||
    resume.isPending ||
    changeSpeed.isPending ||
    jump.isPending ||
    stop.isPending;

  const streamMeta = useMemo(() => {
    const s: any = status || {};
    return {
      currentVirtualTime: virtualTime,
      isPaused: !!s.isPaused,
      isStreaming: !!s.isStreaming,
      mode:
        s.mode === 'TIMEMACHINE' || s.mode === 'REALTIME' ? s.mode : 'REALTIME',
      progress:
        typeof s.progress === 'number' ? s.progress : currentPosition / 100,
      speedMultiplier: speed,
      updatedAt: s.updatedAt ?? new Date().toISOString(),
    };
  }, [status, speed, virtualTime, currentPosition]);

  return (
    <div className='space-y-6'>
      <StreamingTopBar
        playing={playing}
        speed={speed}
        online={online}
        onPlay={onPlay}
        onPause={onPause}
        onSpeedChange={onSpeedChange}
        onSeek={onSeek}
        virtualTime={virtualTime}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        currentPosition={currentPosition}
        onPositionChange={onPositionChange}
        totalDuration={Math.floor(RANGE_MS[timeRange] / 3600_000)}
        onRefresh={() => refetch()}
        loading={loading}
        streamMeta={streamMeta}
      />

      {/* 그래프 카드에만 상태 배지 표시 (WS 연결 중/끊김/에러일 때만) */}
      <StreamingDetectionChart
        data={visibleData}
        threshold={0.5}
        playing={playing}
        currentPosition={currentPosition}
        timeRange={timeRange}
        virtualTime={virtualTime}
        streamMeta={streamMeta}
        connectionStatus={connectionStatus}
      />

      <StreamingDataTable data={visibleData} />
    </div>
  );
}
