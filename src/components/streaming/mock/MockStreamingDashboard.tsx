'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import StreamingDataTable from '../StreamingDataTable';
import StreamingDetectionChart from '../StreamingDetectionChart';
import StreamingTopBar from '../StreamingTopBar';

import type { DetectionResult, TimeRange } from '../types';
import SlidingLineChart from './SlidingLineChart';

const RANGE_MS: Record<TimeRange, number> = {
  '24h': 24 * 3600_000,
  '7d': 7 * 24 * 3600_000,
  '30d': 30 * 24 * 3600_000,
};

const TIME_TICK_MS = 1_000;
const EMIT_INTERVAL_MS = 3_000;
const TIMEMACHINE_WINDOW_MS = 15 * 60 * 1_000; // 15분 묶음 기준 재생
const FRAUD_PROBABILITY = 1 / 200_000; // 평균 2~3일에 한 번 수준

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generateTransaction(timestampMs: number): DetectionResult {
  const timestamp = new Date(timestampMs).toISOString();
  const isFraud = Math.random() < FRAUD_PROBABILITY;
  const score = isFraud ? randomBetween(0.9, 0.98) : randomBetween(0.05, 0.25);

  return {
    timestamp,
    score: Number(score.toFixed(3)),
    prediction: isFraud ? 'fraud' : 'normal',
    confidence: Number(randomBetween(0.6, 0.92).toFixed(3)),
    models: {
      lgbm: Number(randomBetween(0.2, 0.5).toFixed(3)),
      xgb: Number(randomBetween(0.2, 0.5).toFixed(3)),
      cat: Number(randomBetween(0.2, 0.5).toFixed(3)),
    },
  };
}

function seedTransactions(lastMs: number, count = 120): DetectionResult[] {
  return Array.from({ length: count }, (_, i) => {
    const ts = lastMs - EMIT_INTERVAL_MS * (count - 1 - i);
    return generateTransaction(ts);
  });
}

function buildVisibleData(
  all: DetectionResult[],
  range: TimeRange,
  pct: number,
  refIso: string
) {
  if (!all.length) return [];
  const sorted = [...all].sort(
    (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
  );
  const end = Date.parse(refIso);
  const endMs = Number.isFinite(end) ? end : Date.now();
  const startMs = endMs - RANGE_MS[range];
  const inRange = sorted.filter((d) => {
    const t = Date.parse(d.timestamp);
    return Number.isFinite(t) && t >= startMs && t <= endMs;
  });
  const base = inRange.length ? inRange : sorted;
  const endIdx = Math.floor((clamp(pct, 0, 100) * base.length) / 100);
  return base.slice(0, Math.max(1, endIdx));
}

export default function MockStreamingDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [mode, setMode] = useState<'REALTIME' | 'TIMEMACHINE'>('REALTIME');
  const initialAnchor = Date.now();
  const [transactions, setTransactions] = useState<DetectionResult[]>(() =>
    seedTransactions(initialAnchor)
  );
  const [virtualTime, setVirtualTime] = useState<string>(
    new Date(initialAnchor).toISOString()
  );
  const [progress, setProgress] = useState(1);
  const [manualPosition, setManualPosition] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<'connecting' | 'connected' | 'disconnected' | 'error'>(
      'connecting'
    );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimestampRef = useRef<number>(initialAnchor);
  const lastEmissionRef = useRef<number>(initialAnchor);
  const timelineRef = useRef<
    | {
        anchor: number;
        current: number;
        speed: number;
      }
    | null
  >(null);

  useEffect(() => {
    const ready = setTimeout(() => setConnectionStatus('connected'), 400);
    return () => clearTimeout(ready);
  }, []);

  const pushTick = useMemo(
    () =>
      () => {
        if (!playing) return;
        const timeline = timelineRef.current;
        const effectiveSpeed = Math.max(timeline?.speed ?? speed, 0.1);
        const baseCurrent = timeline?.current ?? lastTimestampRef.current ?? Date.parse(virtualTime);
        const nextMs = baseCurrent + TIME_TICK_MS * effectiveSpeed;
        lastTimestampRef.current = nextMs;
        if (timeline) {
          const nextTimeline = {
            anchor: timeline.anchor,
            current: nextMs,
            speed: effectiveSpeed,
          };
          timelineRef.current = nextTimeline;
          const progressRatio =
            (nextTimeline.current - nextTimeline.anchor) / TIMEMACHINE_WINDOW_MS;
          setProgress(clamp(progressRatio, 0, 1));
          if (progressRatio >= 1) {
            timelineRef.current = null;
            setMode('REALTIME');
          } else {
            setMode('TIMEMACHINE');
          }
        } else {
          setProgress(1);
          setMode('REALTIME');
        }
        const nextIso = new Date(nextMs).toISOString();
        setVirtualTime(nextIso);
        const emitInterval = EMIT_INTERVAL_MS / effectiveSpeed;
        if (nextMs - lastEmissionRef.current >= emitInterval) {
          lastEmissionRef.current = nextMs;
          setTransactions((prev) => {
            const next = [...prev, generateTransaction(nextMs)];
            return next.slice(-600);
          });
        }
      },
    [playing, speed, virtualTime]
  );

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!playing) return;
    timerRef.current = setInterval(pushTick, TIME_TICK_MS);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [playing, pushTick]);

  const lastTransactionIso = useMemo(() => {
    const last = transactions.at(-1)?.timestamp;
    return last ?? virtualTime;
  }, [transactions, virtualTime]);

  const currentPosition = useMemo(() => {
    if (manualPosition !== null) return manualPosition;
    return clamp(progress * 100, 0, 100);
  }, [manualPosition, progress]);

  const visibleData = useMemo(
    () =>
      buildVisibleData(
        transactions,
        timeRange,
        currentPosition,
        lastTransactionIso
      ),
    [transactions, timeRange, currentPosition, lastTransactionIso]
  );

  const streamMeta = useMemo(
    () => ({
      currentVirtualTime: lastTransactionIso,
      isPaused: !playing,
      isStreaming: playing,
      mode,
      progress,
      speedMultiplier: speed,
      updatedAt: new Date().toISOString(),
    }),
    [lastTransactionIso, mode, playing, progress, speed]
  );

  const handlePlay = async () => {
    setPlaying(true);
  };

  const handlePause = async () => {
    setPlaying(false);
  };

  const handleSpeedChange = async (value: number) => {
    const next = Math.max(0.1, value);
    setSpeed(next);
    if (timelineRef.current) {
      timelineRef.current = {
        ...timelineRef.current,
        speed: next,
      };
    }
  };

  const regenerateAround = (iso: string, opts: { activateTimeline?: boolean } = {}) => {
    const baseMs = Date.parse(iso);
    const anchor = Number.isFinite(baseMs) ? baseMs : Date.now();
    lastTimestampRef.current = anchor;
    lastEmissionRef.current = anchor;
    timelineRef.current = opts.activateTimeline
      ? {
          anchor,
          current: anchor,
          speed,
        }
      : null;
    setTransactions(seedTransactions(anchor));
    setVirtualTime(new Date(anchor).toISOString());
  };

  const handleSeek = async (iso: string) => {
    setMode('TIMEMACHINE');
    setPlaying(false);
    regenerateAround(iso, { activateTimeline: true });
    setProgress(0);
    setManualPosition(null);
  };

  const handlePositionChange = async (pct: number) => {
    const clamped = clamp(pct, 0, 100);
    setManualPosition(clamped);
    const span = RANGE_MS[timeRange];
    const endMs = Date.parse(lastTransactionIso);
    const end = Number.isFinite(endMs) ? endMs : Date.now();
    const start = end - span;
    const target = new Date(start + (clamped * span) / 100).toISOString();
    setProgress(clamped / 100);
    if (clamped >= 99) {
      setMode('REALTIME');
      setPlaying(true);
      const nowIso = new Date().toISOString();
      regenerateAround(nowIso, { activateTimeline: false });
      setProgress(1);
    } else {
      setMode('TIMEMACHINE');
      setPlaying(false);
      regenerateAround(target, { activateTimeline: true });
    }
    setManualPosition(null);
  };

  const slidingWindow = useMemo(() => transactions.slice(-90), [transactions]);

  return (
    <div className='space-y-6'>
      <StreamingTopBar
        playing={playing}
        speed={speed}
        online={connectionStatus === 'connected'}
        onPlay={handlePlay}
        onPause={handlePause}
        onSpeedChange={handleSpeedChange}
        onSeek={handleSeek}
        virtualTime={lastTransactionIso}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        currentPosition={currentPosition}
        onPositionChange={handlePositionChange}
        totalDuration={Math.floor(RANGE_MS[timeRange] / 3600_000)}
        loading={false}
        streamMeta={streamMeta}
        onRefresh={() => regenerateAround(new Date().toISOString())}
      />

      <StreamingDetectionChart
        data={visibleData}
        threshold={0.6}
        playing={playing}
        currentPosition={currentPosition}
        timeRange={timeRange}
        virtualTime={lastTransactionIso}
        streamMeta={streamMeta}
        connectionStatus={connectionStatus}
        slidingWindowSize={60}
      />

      <div className='rounded-xl border border-slate-700 bg-slate-900 px-4 pt-4 pb-8 h-72'>
        <h4 className='text-sm text-slate-300 mb-3'>Sliding Fraud Score</h4>
        <SlidingLineChart
          data={slidingWindow.map((t) => ({
            timestamp: new Date(t.timestamp).toLocaleTimeString('ko-KR', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            value: Number((t.score * 100).toFixed(1)),
          }))}
          dataKey={'value'}
          color='#f97316'
          name='Fraud score'
          xKey={'timestamp'}
          windowSize={30}
        />
      </div>

      <StreamingDataTable data={visibleData} />
    </div>
  );
}
