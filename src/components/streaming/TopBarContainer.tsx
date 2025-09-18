'use client';

import StreamingTopBar from '@/components/streaming/StreamingTopBar';
import { useDashboardData } from '@/contexts/DashboardActionsContext';
import { useStreaming } from '@/contexts/StreamingContext';
import { useMemo, useState } from 'react';

export default function TopBarContainer() {
  const { online } = useDashboardData();
  const {
    status,
    mode,
    streamingData, // 새로 추가된 원본 데이터
    startRealtime,
    startTimemachine,
    pause,
    resume,
    changeSpeed,
    refresh,
    loading,
  } = useStreaming();

  // 2017-01-01 ~ now 전체 시간 계산
  const { totalHours, startEpochMs, spanMs } = useMemo(() => {
    const start = new Date().getTime();
    const end = Date.now();
    const span = end - start;
    return {
      totalHours: Math.floor(span / 3600_000),
      startEpochMs: start,
      spanMs: span,
    };
  }, []);

  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  // streamingData가 있으면 우선 사용, 없으면 status에서 fallback
  const playing = streamingData
    ? streamingData.isStreaming && !streamingData.isPaused
    : status.playing;
  const speed = streamingData?.speedMultiplier ?? status.speed;
  const virtualTime =
    streamingData?.currentVirtualTime ?? status.virtualTime ?? '';

  // progress를 실제 /status 데이터에서 가져와서 위치 계산
  const position = useMemo(() => {
    if (streamingData?.progress !== undefined) {
      // progress가 0-1 범위이므로 0-100 범위로 변환
      return Math.max(0, Math.min(100, streamingData.progress * 100));
    }

    // fallback: virtualTime으로부터 계산
    if (virtualTime && spanMs > 0) {
      const virtualMs = new Date(virtualTime).getTime();
      const progress = Math.max(
        0,
        Math.min(100, ((virtualMs - startEpochMs) / spanMs) * 100)
      );
      return progress;
    }

    return 100; // 기본값
  }, [streamingData?.progress, virtualTime, spanMs, startEpochMs]);

  // 핸들러들
  const handlePlay = async () => {
    if (playing) {
      return; // 이미 재생 중
    }

    // streamingData의 모드를 기반으로 시작
    const currentMode = streamingData?.mode ?? status.mode;

    if (currentMode === 'TIMEMACHINE' && virtualTime) {
      await startTimemachine(virtualTime, speed);
    } else {
      await startRealtime();
    }
  };

  const handlePause = async () => {
    await pause();
  };

  const handleSpeedChange = async (newSpeed: number) => {
    await changeSpeed(newSpeed);
  };

  const seekToIso = async (iso: string) => {
    try {
      const targetMs = new Date(iso).getTime();
      if (isNaN(targetMs)) {
        if (process.env.NODE_ENV === 'development')
          console.error('Invalid ISO string:', iso);
        return;
      }

      await startTimemachine(iso, speed);
    } catch (error) {
      if (process.env.NODE_ENV === 'development')
        console.error('Failed to seek:', error);
    }
  };

  const handlePositionChange = async (percentage: number) => {
    const clampedPercentage = Math.max(0, Math.min(100, percentage));

    if (spanMs > 0) {
      const targetMs = startEpochMs + (spanMs * clampedPercentage) / 100;
      const iso = new Date(targetMs).toISOString();
      await seekToIso(iso);
    }
  };

  // StreamMeta는 실제 /status 데이터를 그대로 사용
  const streamMeta = streamingData
    ? {
        currentVirtualTime: streamingData.currentVirtualTime,
        isPaused: streamingData.isPaused,
        isStreaming: streamingData.isStreaming,
        mode: streamingData.mode,
        progress: streamingData.progress,
        speedMultiplier: streamingData.speedMultiplier,
        updatedAt: streamingData.updatedAt,
      }
    : undefined;

  return (
    <StreamingTopBar
      playing={playing}
      speed={speed}
      online={online}
      onPlay={handlePlay}
      onPause={handlePause}
      onSpeedChange={handleSpeedChange}
      onSeek={seekToIso}
      virtualTime={virtualTime}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      currentPosition={position}
      onPositionChange={handlePositionChange}
      totalDuration={totalHours}
      onRefresh={refresh}
      loading={loading}
      streamMeta={streamMeta}
    />
  );
}
