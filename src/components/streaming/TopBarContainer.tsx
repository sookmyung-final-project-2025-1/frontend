'use client';

import StreamingDetectionChart from '@/components/streaming/StreamingDetectionChart';
import StreamingTopBar from '@/components/streaming/StreamingTopBar';
import { useDashboardData } from '@/contexts/DashboardActionsContext';
import { useStreaming } from '@/contexts/StreamingContext';
import { useMemo, useState } from 'react';

/** 유틸: 현재 기준으로 범위(ms) */
const RANGE_MS: Record<'24h' | '7d' | '30d', number> = {
  '24h': 24 * 3600_000,
  '7d': 7 * 24 * 3600_000,
  '30d': 30 * 24 * 3600_000,
};

export default function TopBarContainer() {
  const { online } = useDashboardData();
  const {
    status,
    mode,
    streamingData,
    startRealtime,
    startTimemachine,
    pause,
    resume,
    changeSpeed,
    refresh,
    loading,
    data, // 차트 데이터
  } = useStreaming();

  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  /** 현재 시각 기준으로 범위 계산 */
  const { rangeStartMs, rangeEndMs, spanMs, totalHours } = useMemo(() => {
    const end = Date.now();
    const span = RANGE_MS[timeRange];
    const start = end - span;
    return {
      rangeStartMs: start,
      rangeEndMs: end,
      spanMs: span,
      totalHours: Math.floor(span / 3600_000),
    };
  }, [timeRange]);

  /** status/streamingData → 표시값 */
  const playing = streamingData
    ? streamingData.isStreaming && !streamingData.isPaused
    : status.playing;
  const speed = streamingData?.speedMultiplier ?? status.speed;
  const virtualTime =
    streamingData?.currentVirtualTime ?? status.virtualTime ?? '';

  /** 진행률(%) 계산: 서버 progress 우선, 없으면 virtualTime으로 추정 */
  const currentPosition = useMemo(() => {
    if (typeof streamingData?.progress === 'number') {
      return Math.max(0, Math.min(100, streamingData.progress * 100));
    }
    if (virtualTime) {
      const vt = new Date(virtualTime).getTime();
      const p = ((vt - rangeStartMs) / (spanMs || 1)) * 100;
      return Math.max(0, Math.min(100, p));
    }
    return 100;
  }, [streamingData?.progress, virtualTime, rangeStartMs, spanMs]);

  /** 배속 변경 */
  const handleSpeedChange = async (newSpeed: number) => {
    await changeSpeed(newSpeed);
  };

  /** 슬라이더 이동: 100%이면 실시간, 미만이면 타임머신(해당 절대시각) */
  const handlePositionChange = async (percentage: number) => {
    const clamped = Math.max(0, Math.min(100, percentage));
    if (clamped >= 99.9) {
      await startRealtime();
      return;
    }
    const targetMs = rangeStartMs + (spanMs * clamped) / 100;
    const iso = new Date(targetMs).toISOString();
    await startTimemachine(iso, speed);
  };

  /** 수동 시점 이동 (ISO 직접 입력) */
  const handleSeekIso = async (iso: string) => {
    // iso가 현재 범위의 과거면 타임머신, 현재/미래면 실시간
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return;
    if (t >= rangeEndMs - 1000) {
      await startRealtime();
    } else {
      await startTimemachine(iso, speed);
    }
  };

  /** /status 원본 표기용 메타 */
  const streamMeta = streamingData && {
    currentVirtualTime: streamingData.currentVirtualTime,
    isPaused: streamingData.isPaused,
    isStreaming: streamingData.isStreaming,
    mode: streamingData.mode, // 'REALTIME' | 'TIMEMACHINE'
    progress: streamingData.progress, // 0..1
    speedMultiplier: streamingData.speedMultiplier,
    updatedAt: streamingData.updatedAt,
  };

  return (
    <div className='space-y-6'>
      <StreamingTopBar
        playing={playing}
        speed={speed}
        online={online}
        onPlay={startRealtime}
        onPause={pause}
        onSpeedChange={handleSpeedChange}
        onSeek={handleSeekIso}
        virtualTime={virtualTime}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        currentPosition={currentPosition}
        onPositionChange={handlePositionChange}
        totalDuration={totalHours}
        onRefresh={refresh}
        loading={loading}
        streamMeta={streamMeta}
      />

      {/* 메인 차트/패널 (예시) */}
      <StreamingDetectionChart
        data={data}
        playing={playing}
        currentPosition={currentPosition}
        threshold={0.5}
        timeRange={timeRange}
        virtualTime={virtualTime}
        streamMeta={streamMeta}
      />
    </div>
  );
}
