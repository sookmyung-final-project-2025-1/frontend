'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import StreamingDataTable from './StreamingDataTable';
import StreamingDetectionChart from './StreamingDetectionChart';
import StreamingTopBar from './StreamingTopBar';

import { useChangeSpeed } from '@/hooks/queries/streaming/useChangeSpeed';
import { useGetWebsocket } from '@/hooks/queries/streaming/useGetWebsocket';
import { useMockStreaming } from '@/hooks/queries/streaming/useMockStreaming';
import { useJumpStreaming } from '@/hooks/queries/streaming/useJumpStreaming';
import { usePauseStreaming } from '@/hooks/queries/streaming/usePauseStreaming';
import { useResumeStreaming } from '@/hooks/queries/streaming/useResumeStreaming';
import { useSetStreamingTimemachine } from '@/hooks/queries/streaming/useSetStreamingTimemachine';
import { useStartStreamingRealtime } from '@/hooks/queries/streaming/useStartStreamingRealtime';
import { useStopStreaming } from '@/hooks/queries/streaming/useStopStreaming';

import type { DetectionResult, TimeRange } from './types';

export const RANGE_MS = {
  '24h': 24 * 3600_000,
  '7d': 7 * 24 * 3600_000,
  '30d': 30 * 24 * 3600_000,
} as const satisfies Record<TimeRange, number>;

// ---------- 유틸 ----------
const SHIFT_DISPLAY_YEAR = true;
const USE_MOCK_STREAMING =
  (process.env.NEXT_PUBLIC_STREAMING_MOCK ?? '0') === '1';
type MockStreamingResult = ReturnType<typeof useMockStreaming>;

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
function isoToPctDisplay(iso: string, range: TimeRange, refIso?: string) {
  const span = RANGE_MS[range];
  if (!span) return 100;
  const end = refIso ? Date.parse(refIso) : Date.now();
  const endMs = Number.isFinite(end) ? end : Date.now();
  const start = endMs - span;
  const target = Date.parse(iso);
  if (!Number.isFinite(target)) return 100;
  return clamp(((target - start) / span) * 100, 0, 100);
}
function shiftIsoToCurrentYear(iso?: string | null) {
  if (!SHIFT_DISPLAY_YEAR || !iso) return iso ?? '';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso ?? '';
  const now = new Date();
  d.setFullYear(now.getFullYear());
  return d.toISOString();
}
function alignDisplayIsoToRaw(
  displayIso: string,
  refDisplayIso: string,
  refRawIso: string
) {
  if (!SHIFT_DISPLAY_YEAR) return displayIso;
  const displayMs = Date.parse(displayIso);
  const refDisplayMs = Date.parse(refDisplayIso);
  const refRawMs = Date.parse(refRawIso);
  if (
    !Number.isFinite(displayMs) ||
    !Number.isFinite(refDisplayMs) ||
    !Number.isFinite(refRawMs)
  )
    return displayIso;
  const delta = displayMs - refDisplayMs;
  return new Date(refRawMs + delta).toISOString();
}
function pctToIsoRaw(pct: number, range: TimeRange, refRawIso: string) {
  const clamped = clamp(pct, 0, 100);
  const span = RANGE_MS[range];
  const refMs = Date.parse(refRawIso);
  if (!Number.isFinite(refMs)) return refRawIso;
  const start = refMs - span;
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
  let streamingSource: MockStreamingResult;
  if (USE_MOCK_STREAMING) {
    streamingSource = useMockStreaming();
  } else {
    const real = useGetWebsocket();
    streamingSource = {
      ...real,
      controls: {
        startRealtime: async () => {},
        startTimemachine: async () => {},
        jumpTo: async () => {},
        pause: async () => {},
        resume: async () => {},
        stop: async () => {},
        changeSpeed: async () => {},
      },
    } as MockStreamingResult;
  }

  const {
    transactions,
    statusData: wsStatusData,
    connectionStatus,
    virtualTime: wsVirtualTime,
    reconnect,
    controls: mockControls,
  } = streamingSource;

  const realStartRealtime = USE_MOCK_STREAMING
    ? null
    : useStartStreamingRealtime();
  const realStartTimemachine = USE_MOCK_STREAMING
    ? null
    : useSetStreamingTimemachine();
  const realJump = USE_MOCK_STREAMING ? null : useJumpStreaming();
  const realPause = USE_MOCK_STREAMING ? null : usePauseStreaming();
  const realResume = USE_MOCK_STREAMING ? null : useResumeStreaming();
  const realStop = USE_MOCK_STREAMING ? null : useStopStreaming();
  const realChangeSpeed = USE_MOCK_STREAMING ? null : useChangeSpeed();

  const startRealtimeAsync = useCallback(async () => {
    if (USE_MOCK_STREAMING) {
      await mockControls.startRealtime();
    } else {
      await realStartRealtime?.mutateAsync();
    }
  }, [mockControls, realStartRealtime]);

  const startTimemachineAsync = useCallback(
    async (payload: { startTime: string; speedMultiplier: number }) => {
      if (USE_MOCK_STREAMING) {
        await mockControls.startTimemachine(payload);
      } else {
        await realStartTimemachine?.mutateAsync(payload);
      }
    },
    [mockControls, realStartTimemachine]
  );

  const jumpAsync = useCallback(
    async (iso: string) => {
      if (USE_MOCK_STREAMING) {
        await mockControls.jumpTo(iso);
      } else {
        await realJump?.mutateAsync(iso);
      }
    },
    [mockControls, realJump]
  );

  const pauseAsync = useCallback(async () => {
    if (USE_MOCK_STREAMING) {
      await mockControls.pause();
    } else {
      await realPause?.mutateAsync();
    }
  }, [mockControls, realPause]);

  const resumeAsync = useCallback(async () => {
    if (USE_MOCK_STREAMING) {
      await mockControls.resume();
    } else {
      await realResume?.mutateAsync();
    }
  }, [mockControls, realResume]);

  const stopAsync = useCallback(async () => {
    if (USE_MOCK_STREAMING) {
      await mockControls.stop();
    } else {
      await realStop?.mutateAsync();
    }
  }, [mockControls, realStop]);

  const changeSpeedAsync = useCallback(
    async (speed: number) => {
      if (USE_MOCK_STREAMING) {
        await mockControls.changeSpeed(speed);
      } else {
        await realChangeSpeed?.mutateAsync(speed);
      }
    },
    [mockControls, realChangeSpeed]
  );

  const startRealtimePending = USE_MOCK_STREAMING
    ? false
    : realStartRealtime?.isPending ?? false;
  const startTimemachinePending = USE_MOCK_STREAMING
    ? false
    : realStartTimemachine?.isPending ?? false;
  const jumpPending = USE_MOCK_STREAMING ? false : realJump?.isPending ?? false;
  const pausePending = USE_MOCK_STREAMING
    ? false
    : realPause?.isPending ?? false;
  const resumePending = USE_MOCK_STREAMING
    ? false
    : realResume?.isPending ?? false;
  const stopPending = USE_MOCK_STREAMING ? false : realStop?.isPending ?? false;
  const changeSpeedPending = USE_MOCK_STREAMING
    ? false
    : realChangeSpeed?.isPending ?? false;

  // 내부 상태
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualPosition, setManualPosition] = useState<number | null>(null);
  const [localVirtualTimeRaw, setLocalVirtualTimeRaw] =
    useState<string | undefined>(undefined);
  const suppressStatusUntilRef = useRef(0);

  const setLocalVirtualTimeRawGuarded = useCallback(
    (iso: string | undefined) => {
      setLocalVirtualTimeRaw(iso);
      suppressStatusUntilRef.current = Date.now() + 2000;
    },
    []
  );

  const [internalState, setInternalState] = useState({
    isStreaming: false,
    isPaused: false,
    mode: 'REALTIME' as 'REALTIME' | 'TIMEMACHINE',
    speedMultiplier: 1,
    progress: null as number | null, // 0..1 (WS status 없을 땐 ref 시간 기반 계산 사용)
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);
  const autoStartedRef = useRef(false);
  const online = connectionStatus === 'connected';

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

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, []);

  // WS status 수신 시 내부 상태 동기화 (status가 {}거나 null이어도 안전)
  useEffect(() => {
    if (!wsStatusData || typeof wsStatusData !== 'object') return;
    setInternalState((prev) => ({
      ...prev,
      isStreaming:
        'isStreaming' in wsStatusData
          ? !!(wsStatusData as any).isStreaming
          : prev.isStreaming,
      isPaused:
        'isPaused' in wsStatusData
          ? !!(wsStatusData as any).isPaused
          : prev.isPaused,
      mode:
        (wsStatusData as any).mode === 'TIMEMACHINE'
          ? 'TIMEMACHINE'
          : (wsStatusData as any).mode === 'REALTIME'
            ? 'REALTIME'
            : prev.mode,
      speedMultiplier:
        typeof (wsStatusData as any).speedMultiplier === 'number'
          ? (wsStatusData as any).speedMultiplier
          : typeof (wsStatusData as any).speed === 'number'
            ? (wsStatusData as any).speed
            : prev.speedMultiplier,
      progress:
        typeof (wsStatusData as any).progress === 'number'
          ? (wsStatusData as any).progress
          : prev.progress,
    }));
  }, [wsStatusData]);

  // 디버깅 로그
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    console.log('🔄 Dashboard State:', {
      transactionCount: transactions?.length,
      wsStatusData,
      internalState,
      connectionStatus,
      virtualTime: wsVirtualTime,
    });
  }, [
    transactions,
    wsStatusData,
    internalState,
    connectionStatus,
    wsVirtualTime,
  ]);

  // 마지막 트랜잭션 시각(Fallback)
  const lastTxIso = useMemo(() => {
    const last = (transactions ?? [])
      .map((t: any) => t.time ?? t.timestamp ?? t.eventTime ?? t.createdAt)
      .filter(Boolean)
      .map((x: any) => new Date(x).getTime())
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b)
      .at(-1);
    return last ? new Date(last).toISOString() : undefined;
  }, [transactions]);

  // 참조 시간: status → wsVirtualTime → 마지막 데이터 → now (연도 시프트 옵션 적용)
  const referenceRawIso = useMemo<string>(() => {
    const raw =
      localVirtualTimeRaw ??
      (wsStatusData as any)?.currentVirtualTime ??
      (wsStatusData as any)?.currentTime ??
      wsVirtualTime ??
      lastTxIso ??
      new Date().toISOString();
    return raw;
  }, [localVirtualTimeRaw, wsStatusData, wsVirtualTime, lastTxIso]);

  const referenceDisplayIso = useMemo<string>(() => {
    return shiftIsoToCurrentYear(referenceRawIso) || referenceRawIso;
  }, [referenceRawIso]);

  const currentPosition = useMemo(() => {
    if (manualPosition !== null) return clamp(manualPosition, 0, 100);
    if (typeof internalState.progress === 'number') {
      const pct = internalState.progress * 100;
      if (
        internalState.mode === 'REALTIME' &&
        internalState.isStreaming &&
        !internalState.isPaused &&
        pct < 1
      )
        return 100;
      return clamp(pct, 0, 100);
    }
    // progress 미제공 시 refIso 기반 계산
    const end = Date.parse(referenceDisplayIso);
    const endMs = Number.isFinite(end) ? end : Date.now();
    const span = RANGE_MS[timeRange];
    const start = endMs - span;
    return clamp(((endMs - start) / span) * 100, 0, 100);
  }, [
    manualPosition,
    internalState.progress,
    timeRange,
    referenceDisplayIso,
  ]);

  const playing = internalState.isStreaming && !internalState.isPaused;
  const speed = internalState.speedMultiplier;

  useEffect(() => {
    const fromStatus =
      (wsStatusData as any)?.currentVirtualTime ??
      (wsStatusData as any)?.currentTime ??
      wsVirtualTime ??
      undefined;

    if (!fromStatus) return;

    if (Date.now() < suppressStatusUntilRef.current) return;

    const statusMs = Date.parse(fromStatus);
    if (!Number.isFinite(statusMs)) return;

    const currentMs = localVirtualTimeRaw ? Date.parse(localVirtualTimeRaw) : NaN;
    if (Number.isFinite(currentMs) && statusMs < currentMs - 500) return;

    if (fromStatus !== localVirtualTimeRaw) {
      setLocalVirtualTimeRaw(fromStatus);
    }
  }, [wsStatusData, wsVirtualTime, localVirtualTimeRaw]);

  // 연결되면 내부 상태만으로 자동 Realtime 시작 (서버 status가 비어도 UI 동작)
  useEffect(() => {
    if (!online) return;
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;

    setInternalState((prev) => ({
      ...prev,
      isStreaming: true,
      isPaused: false,
      mode: 'REALTIME',
      progress: 1,
    }));

    if (USE_MOCK_STREAMING) {
      mockControls
        .startRealtime()
        .then(() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ startRealtime success (mock)');
          }
        })
        .catch((err: any) => {
          console.error('❌ startRealtime failed (mock)', err);
        });
    } else {
      realStartRealtime?.mutate(undefined, {
        onSuccess: () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ startRealtime success');
          }
          // 여기서 별도 status GET 안 함 (요청 금지 요구사항)
          // 서버가 status 토픽을 푸시하면 위 useEffect에서 동기화됨
        },
        onError: (err: any) => {
          console.error('❌ startRealtime failed', err);
        },
      });
    }
  }, [online, mockControls, realStartRealtime]);

  const normalizedData = useMemo<DetectionResult[]>(() => {
    const rows = (transactions ?? []).map((t: any) => {
      const pred: DetectionResult['prediction'] = t.isFraud
        ? 'fraud'
        : 'normal';
      const rawTimestamp = toIsoStringSafe(
        t.time ?? t.timestamp ?? t.eventTime ?? t.createdAt ?? Date.now()
      );
      const displayTimestamp =
        shiftIsoToCurrentYear(rawTimestamp) || rawTimestamp;
      return {
        timestamp: displayTimestamp,
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

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Normalized data:', {
        count: rows.length,
        sample: rows[0],
      });
    }
    return rows;
  }, [transactions]);

  const visibleData = useMemo<DetectionResult[]>(() => {
    const result = buildVisibleData(
      normalizedData,
      timeRange,
      currentPosition,
      referenceDisplayIso
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('👁️ Visible data:', {
        total: normalizedData.length,
        visible: result.length,
        position: currentPosition,
        timeRange,
      });
    }
    return result;
  }, [normalizedData, timeRange, currentPosition, referenceDisplayIso]);

  const displayVirtualTime = useMemo(() => {
    const last = visibleData.length ? visibleData[visibleData.length - 1] : null;
    const fallback = referenceDisplayIso;
    return last?.timestamp ?? fallback;
  }, [visibleData, referenceDisplayIso]);

  const virtualTime = displayVirtualTime;

  const safeApiCall = async (apiCall: () => Promise<any>) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await apiCall();
    } finally {
      setIsProcessing(false);
    }
  };

  const onPlay = async () => {
    if (internalState.isStreaming && internalState.isPaused) {
      setInternalState((prev) => ({ ...prev, isPaused: false }));
      await safeApiCall(() => resumeAsync());
    } else if (!internalState.isStreaming) {
      if (currentPosition >= 99.9) {
        setInternalState((prev) => ({
          ...prev,
          isStreaming: true,
          isPaused: false,
          mode: 'REALTIME',
          progress: 1,
        }));
        setLocalVirtualTimeRawGuarded(referenceRawIso);
        await safeApiCall(() => startRealtimeAsync());
      } else {
        const targetRaw = pctToIsoRaw(
          currentPosition,
          timeRange,
          referenceRawIso
        );
        setInternalState((prev) => ({
          ...prev,
          isStreaming: true,
          isPaused: false,
          mode: 'TIMEMACHINE',
          progress: currentPosition / 100,
        }));
        setLocalVirtualTimeRawGuarded(targetRaw);
        await safeApiCall(() =>
          startTimemachineAsync({
            startTime: targetRaw,
            speedMultiplier: speed,
          })
        );
      }
    }
  };

  const onPause = async () => {
    setInternalState((prev) => ({ ...prev, isPaused: true }));
    await safeApiCall(() => pauseAsync());
  };

  const onSpeedChange = async (newSpeed: number) => {
    setInternalState((prev) => ({ ...prev, speedMultiplier: newSpeed }));
    suppressStatusUntilRef.current = Date.now() + 2000;
    await safeApiCall(() => changeSpeedAsync(newSpeed));
  };

  const onSeek = async (iso: string) => {
    setManualPosition(null);
    const displayRef = referenceDisplayIso;
    const displayIso = shiftIsoToCurrentYear(iso) || iso;
    const pct = isoToPctDisplay(displayIso, timeRange, displayRef);

    if (
      internalState.mode === 'TIMEMACHINE' &&
      internalState.isStreaming &&
      !internalState.isPaused
    ) {
      setInternalState((prev) => ({ ...prev, progress: pct / 100 }));
      const rawForJump = alignDisplayIsoToRaw(
        displayIso,
        displayRef,
        referenceRawIso
      );
      setLocalVirtualTimeRawGuarded(rawForJump);
      await safeApiCall(() => jumpAsync(rawForJump));
    } else {
      setInternalState((prev) => ({
        ...prev,
        isStreaming: true,
        isPaused: false,
        mode: 'TIMEMACHINE',
        progress: pct / 100,
      }));
      const rawTarget = alignDisplayIsoToRaw(
        displayIso,
        displayRef,
        referenceRawIso
      );
      setLocalVirtualTimeRawGuarded(rawTarget);
      await safeApiCall(() =>
        startTimemachineAsync({
          startTime: rawTarget,
          speedMultiplier: speed,
        })
      );
    }
  };

  const onPositionChange = async (pct: number) => {
    const clamped = clamp(pct, 0, 100);
    setManualPosition(clamped);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      async () => {
        if (clamped >= 99.9) {
          setInternalState((prev) => ({
            ...prev,
            isStreaming: true,
            isPaused: false,
            mode: 'REALTIME',
            progress: 1,
          }));
          setLocalVirtualTimeRawGuarded(referenceRawIso);
          await safeApiCall(() => startRealtimeAsync());
          setManualPosition(null);
        } else {
          const targetRaw = pctToIsoRaw(clamped, timeRange, referenceRawIso);
          if (
            internalState.mode === 'TIMEMACHINE' &&
            internalState.isStreaming &&
            !internalState.isPaused
          ) {
            setInternalState((prev) => ({ ...prev, progress: clamped / 100 }));
            setLocalVirtualTimeRawGuarded(targetRaw);
            await safeApiCall(() => jumpAsync(targetRaw));
          } else {
            setInternalState((prev) => ({
              ...prev,
              isStreaming: true,
              isPaused: false,
              mode: 'TIMEMACHINE',
              progress: clamped / 100,
            }));
            setLocalVirtualTimeRawGuarded(targetRaw);
            await safeApiCall(() =>
              startTimemachineAsync({
                startTime: targetRaw,
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
    startRealtimePending ||
    startTimemachinePending ||
    pausePending ||
    resumePending ||
    changeSpeedPending ||
    jumpPending ||
    stopPending;

  const streamMeta = useMemo(() => {
    return {
      currentVirtualTime: virtualTime || undefined,
      isPaused: internalState.isPaused,
      isStreaming: internalState.isStreaming,
      mode: internalState.mode,
      progress: currentPosition / 100,
      speedMultiplier: speed,
      updatedAt: (wsStatusData as any)?.updatedAt ?? new Date().toISOString(),
    };
  }, [internalState, speed, virtualTime, currentPosition, wsStatusData]);

  const autoProgressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const lastTickMsRef = useRef<number | null>(null);
  const hasWsProgress =
    wsStatusData && typeof (wsStatusData as any)?.progress === 'number';

  const realtimeTickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const lastRealtimeTickRef = useRef<number | null>(null);

  useEffect(() => {
    const shouldAutoAdvance =
      playing &&
      internalState.mode === 'TIMEMACHINE' &&
      !hasWsProgress &&
      !manualPosition;

    if (!shouldAutoAdvance) {
      if (autoProgressIntervalRef.current) {
        clearInterval(autoProgressIntervalRef.current);
        autoProgressIntervalRef.current = null;
      }
      lastTickMsRef.current = null;
      return;
    }

    lastTickMsRef.current = performance.now();
    autoProgressIntervalRef.current = setInterval(() => {
      const now = performance.now();
      const prev = lastTickMsRef.current ?? now;
      lastTickMsRef.current = now;
      const deltaMs = now - prev;
      const spanMs = RANGE_MS[timeRange];
      if (!Number.isFinite(spanMs) || spanMs <= 0) return;
      const increment = (deltaMs * speed) / spanMs;

      setInternalState((prevState) => {
        const base =
          typeof prevState.progress === 'number'
            ? prevState.progress
            : 0;
        const next = clamp(base + increment, 0, 1);
        if (Math.abs(next - base) < 1e-4) return prevState;
        return { ...prevState, progress: next };
      });
    }, 400);

    return () => {
      if (autoProgressIntervalRef.current) {
        clearInterval(autoProgressIntervalRef.current);
        autoProgressIntervalRef.current = null;
      }
      lastTickMsRef.current = null;
    };
  }, [
    playing,
    internalState.mode,
    hasWsProgress,
    manualPosition,
    timeRange,
    speed,
  ]);

  useEffect(() => {
    const shouldTick = playing && internalState.mode === 'REALTIME';

    if (!shouldTick) {
      if (realtimeTickIntervalRef.current) {
        clearInterval(realtimeTickIntervalRef.current);
        realtimeTickIntervalRef.current = null;
      }
      lastRealtimeTickRef.current = null;
      return;
    }

    if (realtimeTickIntervalRef.current) return;

    lastRealtimeTickRef.current = performance.now();
    realtimeTickIntervalRef.current = setInterval(() => {
      const now = performance.now();
      const prev = lastRealtimeTickRef.current ?? now;
      lastRealtimeTickRef.current = now;
      const deltaMs = now - prev;
      if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;

      const applyMs = deltaMs * Math.max(0.1, speed || 1);

      setLocalVirtualTimeRaw((prevIso) => {
        const baseIso = prevIso ?? referenceRawIso;
        const baseMs = Date.parse(baseIso);
        if (!Number.isFinite(baseMs)) return prevIso;
        const next = new Date(baseMs + applyMs).toISOString();
        return next;
      });
    }, 400);

    return () => {
      if (realtimeTickIntervalRef.current) {
        clearInterval(realtimeTickIntervalRef.current);
        realtimeTickIntervalRef.current = null;
      }
      lastRealtimeTickRef.current = null;
    };
  }, [playing, internalState.mode, speed, referenceRawIso]);

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
        loading={loading}
        streamMeta={streamMeta}
        onRefresh={() => reconnect()}
      />

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
