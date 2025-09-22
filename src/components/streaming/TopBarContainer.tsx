// src/components/streaming/TopBarContainer.tsx
'use client';

import StreamingTopBar from '@/components/streaming/StreamingTopBar';

import { useChangeSpeed } from '@/hooks/queries/streaming/useChangeSpeed';
import { useGetStreamingStatus } from '@/hooks/queries/streaming/useGetStreamingStatus';
import { useGetWebsocket } from '@/hooks/queries/streaming/useGetWebsocket';
import { useJumpStreaming } from '@/hooks/queries/streaming/useJumpStreaming'; // ← /streaming/jump (aka /target)
import { usePauseStreaming } from '@/hooks/queries/streaming/usePauseStreaming';
import { useResumeStreaming } from '@/hooks/queries/streaming/useResumeStreaming';
import { useSetStreamingTimemachine } from '@/hooks/queries/streaming/useSetStreamingTimemachine';
import { useStartStreamingRealtime } from '@/hooks/queries/streaming/useStartStreamingRealtime';
import { useStopStreaming } from '@/hooks/queries/streaming/useStopStreaming';

import { useEffect, useMemo, useRef, useState } from 'react';
import StreamingDetectionChart from './StreamingDetectionChart';
import { DetectionResult, StreamMeta } from './types';

const RANGE_MS = {
  '24h': 24 * 3600_000,
  '7d': 7 * 24 * 3600_000,
  '30d': 30 * 24 * 3600_000,
} as const;
type TimeRange = keyof typeof RANGE_MS;

export default function TopBarContainer() {
  const { data: status, refetch, isFetching } = useGetStreamingStatus();

  const startRealtime = useStartStreamingRealtime();
  const startTimemachine = useSetStreamingTimemachine();
  const pause = usePauseStreaming();
  const resume = useResumeStreaming();
  const stop = useStopStreaming();
  const changeSpeed = useChangeSpeed();
  const jump = useJumpStreaming();

  const { transactions, connectionStatus } = useGetWebsocket();
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  // progress 계산
  const currentPosition = useMemo(() => {
    if (typeof (status as any)?.progress === 'number') {
      return Math.max(0, Math.min(100, (status as any).progress * 100));
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
    (status as any)?.progress,
    (status as any)?.currentVirtualTime,
    (status as any)?.currentTime,
    timeRange,
  ]);

  const playing = !!(status as any)?.isStreaming && !(status as any)?.isPaused;
  const speed = (status as any)?.speedMultiplier ?? (status as any)?.speed ?? 1;
  const virtualTime =
    (status as any)?.currentVirtualTime ?? (status as any)?.currentTime ?? '';

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
    // 엔터로 직접 시점 이동 시에도 모드에 따라 분기
    if ((status as any)?.mode === 'TIMEMACHINE') {
      await jump.mutateAsync(iso);
    } else {
      await startTimemachine.mutateAsync({
        startTime: iso,
        speedMultiplier: speed,
      });
    }
    await refetch();
  };

  // ---------- 🔑 /target(jump) 디바운스 큐 ----------
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueuedIsoRef = useRef<string | null>(null);
  const isDraggingRef = useRef(false);

  // pct → ISO 변환
  const pctToIso = (pct: number) => {
    const clamped = Math.max(0, Math.min(100, pct));
    const span = RANGE_MS[timeRange];
    const end = Date.now();
    const start = end - span;
    const targetMs = start + (span * clamped) / 100;
    return new Date(targetMs).toISOString();
  };

  // 드래그 중 자주 호출되는 포지션 변경은 점프 요청을 디바운스해서 보냄
  const queueJumpOrStart = (pct: number) => {
    const targetIso = pctToIso(pct);
    lastQueuedIsoRef.current = targetIso;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(
      async () => {
        const iso = lastQueuedIsoRef.current!;
        try {
          if (pct >= 99.9) {
            // 거의 끝 → 실시간 전환
            await startRealtime.mutateAsync();
          } else if (
            (status as any)?.mode === 'TIMEMACHINE' &&
            (status as any)?.isStreaming
          ) {
            // 이미 타임머신 실행 중 → jump (/target)
            await jump.mutateAsync(iso);
          } else {
            // 타임머신 시작
            await startTimemachine.mutateAsync({
              startTime: iso,
              speedMultiplier: speed,
            });
          }
          await refetch();
        } finally {
          // no-op
        }
      },
      isDraggingRef.current ? 160 : 0
    ); // 드래그 중 160ms 디바운스, 클릭/업 즉시
  };

  // TopBar에서 내려주는 콜백: 드래그/클릭 중 계속 호출됨
  const onPositionChange = async (pct: number) => {
    const clamped = Math.max(0, Math.min(100, pct));
    if (clamped >= 99.9) {
      await startRealtime.mutateAsync(); // 실시간
      await refetch();
      return;
    }

    const span = RANGE_MS[timeRange];
    const end = Date.now();
    const start = end - span;
    const targetIso = new Date(start + (span * clamped) / 100).toISOString();

    const mode = (status as any)?.mode;
    const isStreaming = !!(status as any)?.isStreaming;

    if (mode === 'TIMEMACHINE' && isStreaming) {
      await jump.mutateAsync(targetIso); // ✅ 이미 타임머신이면 jump
    } else {
      await startTimemachine.mutateAsync({
        // ✅ 아니면 타임머신 시작
        startTime: targetIso,
        speedMultiplier: (status as any)?.speedMultiplier ?? 1,
      });
    }
    await refetch();
  };

  // TopBar에서 드래그 상태를 관리하지 않는 경우 대비한 이벤트(선택):
  // StreamingTopBar가 드래그 시작/끝을 알려줄 수 있으면 props로 받아서 갱신해줘도 됨.
  useEffect(() => {
    const onDown = () => {
      isDraggingRef.current = true;
    };
    const onUp = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // ---------- 차트/테이블 데이터 정규화 ----------
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

  const online = connectionStatus === 'connected';

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
        streamMeta={meta}
      />

      <StreamingDetectionChart
        data={
          normalizedData /* 차트 내부에서 timeRange/currentPosition로 잘라 쓰면 됨 (또는 TopBar에서 visible만 주입해도 됨) */
        }
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
