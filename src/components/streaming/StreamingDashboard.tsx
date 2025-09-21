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

export type TimeRange = '24h' | '7d' | '30d';
export const RANGE_MS: Record<TimeRange, number> = {
  '24h': 24 * 3600_000,
  '7d': 7 * 24 * 3600_000,
  '30d': 30 * 24 * 3600_000,
};

export type DetectionResult = {
  timestamp: string;
  score: number;
  prediction: 'fraud' | 'normal';
  confidence: number;
  models: { lgbm: number; xgb: number; cat: number };
};

export default function StreamingDashboard() {
  // 1) 상태/WS
  const { data: status, refetch, isFetching } = useGetStreamingStatus();
  const { transactions, connectionStatus } = useGetWebsocket(); // WS에서 들어오는 원천 데이터

  // 2) 제어 훅
  const startRealtime = useStartStreamingRealtime();
  const startTimemachine = useSetStreamingTimemachine();
  const jump = useJumpStreaming();
  const pause = usePauseStreaming();
  const resume = useResumeStreaming();
  const stop = useStopStreaming();
  const changeSpeed = useChangeSpeed();

  // 3) UI 상태
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  // 4) 진행 위치(%): 서버 progress 우선, 없으면 virtualTime로 추정
  const currentPosition = useMemo(() => {
    const s: any = status || {};
    if (typeof s.progress === 'number') return clamp(s.progress * 100, 0, 100);

    const end = Date.now();
    const span = RANGE_MS[timeRange];
    const start = end - span;
    const vt = Date.parse(s.currentVirtualTime ?? s.currentTime ?? '');
    if (Number.isFinite(vt)) return clamp(((vt - start) / span) * 100, 0, 100);
    return 100;
  }, [status, timeRange]);

  // 5) 파생 상태
  const playing = !!(status as any)?.isStreaming && !(status as any)?.isPaused;
  const speed = (status as any)?.speedMultiplier ?? (status as any)?.speed ?? 1;
  const virtualTime =
    (status as any)?.currentVirtualTime ?? (status as any)?.currentTime ?? '';
  const online = connectionStatus === 'connected';

  // 6) WS → normalized
  const normalizedData = useMemo<DetectionResult[]>(
    () =>
      (transactions ?? []).map((t: any) => ({
        timestamp: t.time ?? t.timestamp ?? new Date().toISOString(),
        score: Number(t.score ?? t.amount ?? 0),
        prediction: t.isFraud ? 'fraud' : 'normal',
        confidence: Number(t.confidence ?? 0.8),
        models: {
          lgbm: Number(t.models?.lgbm ?? 0.33),
          xgb: Number(t.models?.xgb ?? 0.33),
          cat: Number(t.models?.cat ?? 0.34),
        },
      })),
    [transactions]
  );

  // 7) 화면에 “보이는” 데이터(기간 필터 + % 잘라내기)
  const visibleData = useMemo<DetectionResult[]>(
    () => buildVisibleData(normalizedData, timeRange, currentPosition),
    [normalizedData, timeRange, currentPosition]
  );

  // 8) 액션
  // helpers가 이미 아래에 있어요: clamp, pctToIso 등
  // onPlay만 아래 코드로 바꿔주세요.

  const onPlay = async () => {
    const s: any = status || {};
    const isPaused = !!s.isPaused;
    const isStreaming = !!s.isStreaming;

    // 1) 일시정지 → 재개
    if (isStreaming && isPaused) {
      await resume.mutateAsync();
      await refetch();
      return;
    }

    // 2) "거의 끝(현재에 매우 근접)" 여부 판단
    const nearEnd = currentPosition >= 99.9;

    if (nearEnd) {
      // 2-a) 현재 시점 → 실시간 모드
      await startRealtime.mutateAsync();
    } else {
      // 2-b) 과거 시점 → 타임머신 모드
      // startTime은 우선 서버가 알아온 virtualTime, 없으면 슬라이더 기준으로 계산
      const candidateIso =
        (s.currentVirtualTime ?? s.currentTime) &&
        Number.isFinite(Date.parse(s.currentVirtualTime ?? s.currentTime))
          ? (s.currentVirtualTime ?? s.currentTime)
          : pctToIso(currentPosition, timeRange);

      await startTimemachine.mutateAsync({
        startTime: candidateIso,
        speedMultiplier: speed,
      });
    }

    await refetch();
  };

  const onPause = async () => {
    await pause.mutateAsync();
    await refetch();
  };
  const onSpeedChange = async (v: number) => {
    await changeSpeed.mutateAsync(v);
    await refetch();
  };
  const onSeek = async (iso: string) => {
    const mode = (status as any)?.mode;
    const isStreaming = !!(status as any)?.isStreaming;
    if (mode === 'TIMEMACHINE' && isStreaming) {
      await jump.mutateAsync(iso);
    } else {
      await startTimemachine.mutateAsync({
        startTime: iso,
        speedMultiplier: speed,
      });
    }
    await refetch();
  };

  // 드래그/클릭으로 포지션 변경 → start|jump 분기
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);

  // 페이지 전체에서 드래그 상태 추적(간단)
  useEffect(() => {
    const down = () => (isDraggingRef.current = true);
    const up = () => (isDraggingRef.current = false);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
    };
  }, []);

  const onPositionChange = async (pct: number) => {
    const clamped = clamp(pct, 0, 100);
    const iso = pctToIso(clamped, timeRange);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      async () => {
        if (clamped >= 99.9) {
          await startRealtime.mutateAsync();
        } else {
          const mode = (status as any)?.mode;
          const isStreaming = !!(status as any)?.isStreaming;
          if (mode === 'TIMEMACHINE' && isStreaming) {
            await jump.mutateAsync(iso);
          } else {
            await startTimemachine.mutateAsync({
              startTime: iso,
              speedMultiplier: speed,
            });
          }
        }
        await refetch();
      },
      isDraggingRef.current ? 160 : 0
    );
  };

  const loading =
    isFetching ||
    startRealtime.isPending ||
    startTimemachine.isPending ||
    pause.isPending ||
    resume.isPending ||
    changeSpeed.isPending ||
    jump.isPending ||
    stop.isPending;

  // 9) 메타
  const streamMeta = useMemo(
    () => ({
      currentVirtualTime: virtualTime,
      isPaused: !!(status as any)?.isPaused,
      isStreaming: !!(status as any)?.isStreaming,
      mode:
        (status as any)?.mode === 'TIMEMACHINE' ||
        (status as any)?.mode === 'REALTIME'
          ? (status as any)?.mode
          : 'REALTIME',
      progress:
        typeof (status as any)?.progress === 'number'
          ? (status as any)?.progress
          : undefined,
      speedMultiplier: speed,
      updatedAt: (status as any)?.updatedAt ?? new Date().toISOString(),
    }),
    [status, speed, virtualTime]
  );

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

      <StreamingDetectionChart
        data={visibleData}
        threshold={0.5}
        playing={playing}
        currentPosition={currentPosition}
        timeRange={timeRange}
        virtualTime={virtualTime}
        streamMeta={streamMeta}
      />

      <StreamingDataTable data={visibleData} />
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function pctToIso(pct: number, range: TimeRange) {
  const clamped = clamp(pct, 0, 100);
  const span = RANGE_MS[range];
  const end = Date.now();
  const start = end - span;
  return new Date(start + (span * clamped) / 100).toISOString();
}

function buildVisibleData(
  all: DetectionResult[],
  range: TimeRange,
  pct: number
) {
  if (!all?.length) return [];
  const end = Date.now();
  const start = end - RANGE_MS[range];

  const inRange = all.filter((d) => {
    const t = Date.parse(d.timestamp);
    return Number.isFinite(t) && t >= start && t <= end;
  });

  inRange.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const endIdx = Math.floor((clamp(pct, 0, 100) * inRange.length) / 100);
  return inRange.slice(0, Math.max(1, endIdx));
}
