// src/components/streaming/TopBarContainer.tsx
'use client';

import StreamingDetectionChart, {
  DetectionResult,
  StreamMeta,
} from '@/components/streaming/StreamingDetectionChart';
import StreamingTopBar from '@/components/streaming/StreamingTopBar';

import { useChangeSpeed } from '@/hooks/queries/streaming/useChangeSpeed';
import { useGetStreamingStatus } from '@/hooks/queries/streaming/useGetStreamingStatus';
import { useGetWebsocket } from '@/hooks/queries/streaming/useGetWebsocket';
import { useJumpStreaming } from '@/hooks/queries/streaming/useJumpStreaming';
import { usePauseStreaming } from '@/hooks/queries/streaming/usePauseStreaming';
import { useResumeStreaming } from '@/hooks/queries/streaming/useResumeStreaming';
import { useSetStreamingTimemachine } from '@/hooks/queries/streaming/useSetStreamingTimemachine';
import { useStartStreamingRealtime } from '@/hooks/queries/streaming/useStartStreamingRealtime';
import { useStopStreaming } from '@/hooks/queries/streaming/useStopStreaming';

import { useMemo, useState } from 'react';

const RANGE_MS = {
  '24h': 24 * 3600_000,
  '7d': 7 * 24 * 3600_000,
  '30d': 30 * 24 * 3600_000,
} as const;
type TimeRange = keyof typeof RANGE_MS;

export default function TopBarContainer() {
  // 상태 조회 (백엔드 /streaming/status)
  const { data: status, refetch, isFetching } = useGetStreamingStatus();

  // REST 제어 훅
  const startRealtime = useStartStreamingRealtime();
  const startTimemachine = useSetStreamingTimemachine();
  const pause = usePauseStreaming();
  const resume = useResumeStreaming();
  const stop = useStopStreaming();
  const changeSpeed = useChangeSpeed();
  const jump = useJumpStreaming();

  // WS 구독 데이터 (서버가 push하는 거래들)
  const { transactions } = useGetWebsocket(); // [{ id, amount, merchant, time, isFraud, ...}]

  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  // 진행률 계산: 서버 progress 우선, 없으면 virtualTime으로 추정
  const currentPosition = useMemo(() => {
    if (typeof status?.progress === 'number') {
      return Math.max(0, Math.min(100, status.progress * 100));
    }
    const span = RANGE_MS[timeRange];
    const end = Date.now();
    const start = end - span;
    const vtStr =
      (status as any)?.currentVirtualTime ?? (status as any)?.currentTime ?? '';
    const vt = Date.parse(vtStr);
    if (Number.isFinite(vt)) {
      return Math.max(0, Math.min(100, ((vt - start) / span) * 100));
    }
    return 100;
  }, [
    status?.progress,
    (status as any)?.currentVirtualTime,
    (status as any)?.currentTime,
    timeRange,
  ]);

  // 재생/속도/가상시간 파생값
  const playing = !!(status as any)?.isStreaming && !(status as any)?.isPaused;
  const speed = (status as any)?.speedMultiplier ?? (status as any)?.speed ?? 1;
  const virtualTime =
    (status as any)?.currentVirtualTime ?? (status as any)?.currentTime ?? '';

  // 버튼 핸들러
  const onPlay = async () => {
    await startRealtime.mutateAsync();
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
    await jump.mutateAsync(iso);
    await refetch();
  };
  const onPositionChange = async (pct: number) => {
    const clamped = Math.max(0, Math.min(100, pct));
    if (clamped >= 99.9) {
      await startRealtime.mutateAsync();
      await refetch();
      return;
    }
    const span = RANGE_MS[timeRange];
    const end = Date.now();
    const start = end - span;
    const target = new Date(start + (span * clamped) / 100).toISOString();
    await startTimemachine.mutateAsync({
      startTime: target,
      speedMultiplier: speed,
    });
    await refetch();
  };

  // 🔧 차트 데이터 정규화 (타입 안전)
  const normalizedData: DetectionResult[] = useMemo(
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

  // 🔧 StreamMeta로 매핑 (progress는 옵셔널)
  const meta: StreamMeta | null = useMemo(() => {
    if (!status) return null;
    return {
      currentVirtualTime:
        (status as any).currentVirtualTime ?? (status as any).currentTime ?? '',
      isPaused: !!(status as any).isPaused,
      isStreaming: !!(status as any).isStreaming,
      mode:
        (status as any).mode === 'REALTIME' ||
        (status as any).mode === 'TIMEMACHINE'
          ? (status as any).mode
          : 'REALTIME',
      progress:
        typeof (status as any).progress === 'number'
          ? (status as any).progress
          : undefined,
      speedMultiplier:
        (status as any).speedMultiplier ?? (status as any).speed ?? 1,
      updatedAt: (status as any).updatedAt ?? new Date().toISOString(),
    };
  }, [status]);

  const loading =
    isFetching ||
    startRealtime.isPending ||
    startTimemachine.isPending ||
    pause.isPending ||
    resume.isPending ||
    changeSpeed.isPending ||
    jump.isPending ||
    stop.isPending;

  return (
    <div className='space-y-6'>
      <StreamingTopBar
        playing={playing}
        speed={speed}
        online={true}
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
        streamMeta={meta}
      />

      {/* 차트 하나만 */}
      <StreamingDetectionChart
        data={normalizedData}
        playing={playing}
        currentPosition={currentPosition}
        threshold={0.5}
        timeRange={timeRange}
        virtualTime={virtualTime}
        streamMeta={meta}
      />
    </div>
  );
}
