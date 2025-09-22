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
  // 상태 관리
  const { data: status, refetch, isFetching } = useGetStreamingStatus();
  const {
    transactions,
    statusData: wsStatusData,
    connectionStatus,
  } = useGetWebsocket();

  // WebSocket으로 받은 상태와 HTTP API 상태 동기화
  const mergedStatus = useMemo(() => {
    // WebSocket 상태가 있으면 우선 사용 (더 실시간)
    return wsStatusData || status;
  }, [wsStatusData, status]);

  // API 호출 훅들
  const startRealtime = useStartStreamingRealtime();
  const startTimemachine = useSetStreamingTimemachine();
  const jump = useJumpStreaming();
  const pause = usePauseStreaming();
  const resume = useResumeStreaming();
  const stop = useStopStreaming();
  const changeSpeed = useChangeSpeed();

  // UI 상태
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualPosition, setManualPosition] = useState<number | null>(null); // 수동 위치 추가

  // 디바운싱을 위한 ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);

  // 전역 마우스 이벤트 감지
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

  // 진행률 계산 - 수동 위치가 있으면 우선 사용
  const currentPosition = useMemo(() => {
    // 1. 수동으로 설정된 위치가 있으면 사용
    if (manualPosition !== null) {
      return clamp(manualPosition, 0, 100);
    }

    // 2. 서버 상태 확인
    const s: any = mergedStatus || {};

    // 3. 서버에서 제공하는 progress 사용
    if (typeof s.progress === 'number') {
      return clamp(s.progress * 100, 0, 100);
    }

    // 4. virtualTime으로 추정
    const currentTime = s.currentVirtualTime ?? s.currentTime;
    if (currentTime) {
      const end = Date.now();
      const span = RANGE_MS[timeRange];
      const start = end - span;
      const vt = Date.parse(currentTime);

      if (Number.isFinite(vt)) {
        return clamp(((vt - start) / span) * 100, 0, 100);
      }
    }

    // 5. 기본값: 0% (100%가 아닌 0%로 변경)
    console.log('Using default position: 0%');
    return 0;
  }, [manualPosition, mergedStatus, timeRange]);

  // 파생 상태들
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
    return s.currentVirtualTime ?? s.currentTime ?? '';
  }, [status]);

  const online = connectionStatus === 'connected';

  // WebSocket 데이터 정규화
  const normalizedData = useMemo<DetectionResult[]>(() => {
    return (transactions ?? []).map((t: any) => ({
      timestamp: t.time ?? t.timestamp ?? new Date().toISOString(),
      score: Number(t.score ?? t.amount ?? 0),
      prediction: t.isFraud ? ('fraud' as const) : ('normal' as const),
      confidence: Number(t.confidence ?? 0.8),
      models: {
        lgbm: Number(t.models?.lgbm ?? 0.33),
        xgb: Number(t.models?.xgb ?? 0.33),
        cat: Number(t.models?.cat ?? 0.34),
      },
    }));
  }, [transactions]);

  // 표시할 데이터 (시간 범위 및 위치 기준 필터링)
  const visibleData = useMemo<DetectionResult[]>(() => {
    return buildVisibleData(normalizedData, timeRange, currentPosition);
  }, [normalizedData, timeRange, currentPosition]);

  // 안전한 API 호출 헬퍼
  const safeApiCall = async (
    apiCall: () => Promise<any>,
    actionName: string
  ) => {
    if (isProcessing) {
      console.log(`${actionName} skipped - already processing`);
      return;
    }

    setIsProcessing(true);
    try {
      console.log(`${actionName} started`);
      await apiCall();
      await refetch();
      console.log(`${actionName} completed`);
    } catch (error) {
      console.error(`${actionName} failed:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 액션 함수들
  const onPlay = async () => {
    const s: any = status || {};
    const isPaused = !!s.isPaused;
    const isStreaming = !!s.isStreaming;
    const mode = s?.mode;

    console.log('Play action:', {
      isPaused,
      isStreaming,
      mode,
      currentPosition,
    });

    if (isStreaming && isPaused) {
      // 일시정지 상태 → 재개
      await safeApiCall(() => resume.mutateAsync(), 'Resume');
    } else if (!isStreaming) {
      // 스트리밍이 중지된 상태 → 위치에 따라 시작
      if (currentPosition >= 99.9) {
        // 현재 시점 → 실시간 모드
        await safeApiCall(() => startRealtime.mutateAsync(), 'Start Realtime');
      } else {
        // 과거 시점 → 타임머신 모드
        const targetTime = pctToIso(currentPosition, timeRange);
        await safeApiCall(
          () =>
            startTimemachine.mutateAsync({
              startTime: targetTime,
              speedMultiplier: speed,
            }),
          'Start Timemachine'
        );
      }
    } else {
      // 이미 스트리밍 중인 경우 - 모드에 따라 처리
      console.log('Already streaming, current mode:', mode);
      // 이미 실행 중이면 특별한 액션 없이 그대로 유지
      // 또는 필요에 따라 resume 호출
      if (mode === 'TIMEMACHINE' || mode === 'REALTIME') {
        console.log('Streaming already active, no action needed');
        return;
      }
    }
  };

  const onPause = async () => {
    await safeApiCall(() => pause.mutateAsync(), 'Pause');
  };

  const onSpeedChange = async (newSpeed: number) => {
    await safeApiCall(() => changeSpeed.mutateAsync(newSpeed), 'Change Speed');
  };

  const onSeek = async (iso: string) => {
    const s: any = status || {};
    const mode = s?.mode;
    const isStreaming = !!s?.isStreaming;

    console.log('Seek action:', { mode, isStreaming, targetTime: iso });

    if (mode === 'TIMEMACHINE' && isStreaming && !s?.isPaused) {
      // 타임머신 모드 실행 중 → jump
      await safeApiCall(() => jump.mutateAsync(iso), 'Jump');
    } else {
      // 새로 타임머신 시작
      await safeApiCall(
        () =>
          startTimemachine.mutateAsync({
            startTime: iso,
            speedMultiplier: speed,
          }),
        'Start Timemachine for Seek'
      );
    }
  };

  const onPositionChange = async (pct: number) => {
    const clamped = clamp(pct, 0, 100);

    // 디바운싱 처리
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(
      async () => {
        const s: any = status || {};
        console.log('Position change:', {
          position: clamped,
          mode: s?.mode,
          isStreaming: s?.isStreaming,
          isPaused: s?.isPaused,
        });

        if (clamped >= 99.9) {
          // 실시간 모드로 전환
          await safeApiCall(
            () => startRealtime.mutateAsync(),
            'Position → Realtime'
          );
        } else {
          const targetTime = pctToIso(clamped, timeRange);

          // 현재 상태에 따라 jump vs start 결정
          if (s?.mode === 'TIMEMACHINE' && s?.isStreaming && !s?.isPaused) {
            // 타임머신 실행 중 → jump
            await safeApiCall(
              () => jump.mutateAsync(targetTime),
              'Position → Jump'
            );
          } else {
            // 새로 타임머신 시작
            await safeApiCall(
              () =>
                startTimemachine.mutateAsync({
                  startTime: targetTime,
                  speedMultiplier: speed,
                }),
              'Position → Start Timemachine'
            );
          }
        }
      },
      isDraggingRef.current ? 200 : 0
    );
  };

  // 로딩 상태
  const loading = useMemo(() => {
    return (
      isProcessing ||
      isFetching ||
      startRealtime.isPending ||
      startTimemachine.isPending ||
      pause.isPending ||
      resume.isPending ||
      changeSpeed.isPending ||
      jump.isPending ||
      stop.isPending
    );
  }, [
    isProcessing,
    isFetching,
    startRealtime.isPending,
    startTimemachine.isPending,
    pause.isPending,
    resume.isPending,
    changeSpeed.isPending,
    jump.isPending,
    stop.isPending,
  ]);

  // 스트림 메타데이터
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
      {/* 개발 환경 디버그 정보 */}
      {process.env.NODE_ENV === 'development' && (
        <div className='bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div>
              <span className='text-slate-400'>WebSocket:</span>
              <span
                className={`ml-2 px-2 py-1 rounded text-xs ${
                  connectionStatus === 'connected'
                    ? 'bg-green-900 text-green-300'
                    : 'bg-red-900 text-red-300'
                }`}
              >
                {connectionStatus}
              </span>
            </div>
            <div>
              <span className='text-slate-400'>Mode:</span>
              <span className='ml-2 text-white'>
                {(status as any)?.mode || 'N/A'}
              </span>
            </div>
            <div>
              <span className='text-slate-400'>Streaming:</span>
              <span className='ml-2 text-white'>{playing ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className='text-slate-400'>Position:</span>
              <span className='ml-2 text-white'>
                {currentPosition.toFixed(1)}%
              </span>
            </div>
          </div>
          {isProcessing && (
            <div className='mt-2 text-yellow-300'>
              ⏳ Processing API request...
            </div>
          )}
        </div>
      )}

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

// 헬퍼 함수들
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

  // 시간 범위 내 데이터 필터링
  const inRange = all.filter((d) => {
    const t = Date.parse(d.timestamp);
    return Number.isFinite(t) && t >= start && t <= end;
  });

  // 시간순 정렬
  inRange.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // 진행률에 따라 잘라내기
  const endIdx = Math.floor((clamp(pct, 0, 100) * inRange.length) / 100);
  return inRange.slice(0, Math.max(1, endIdx));
}
