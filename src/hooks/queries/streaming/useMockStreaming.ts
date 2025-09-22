'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ConnStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type MockTransaction = {
  id: string;
  timestamp: string;
  amount: number;
  isFraud: boolean;
  score: number;
  confidence: number;
  models: {
    lgbm: number;
    xgb: number;
    cat: number;
  };
};

type MockStatus = {
  currentVirtualTime: string;
  isStreaming: boolean;
  isPaused: boolean;
  mode: 'REALTIME' | 'TIMEMACHINE';
  progress: number;
  speedMultiplier: number;
  updatedAt: string;
};

const MAX_BUFFER = 500;
const STEP_MS_BASE = 15_000; // 기본 간격 15초
const TIMEMACHINE_WINDOW_MS = 30 * 60 * 1000; // 30분 윈도우 기준으로 progress 계산

function makeTransaction(id: number, timestampMs: number): MockTransaction {
  const ts = new Date(timestampMs);
  const score = Math.random();
  return {
    id: `mock-${id}`,
    timestamp: ts.toISOString(),
    amount: Math.floor(Math.random() * 90_000) + 10_000,
    isFraud: score > 0.75,
    score,
    confidence: 0.6 + Math.random() * 0.35,
    models: {
      lgbm: Math.random(),
      xgb: Math.random(),
      cat: Math.random(),
    },
  };
}

export function useMockStreaming() {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnStatus>('connecting');
  const [statusData, setStatusData] = useState<MockStatus | null>(null);
  const [data, setData] = useState<{
    transactions: MockTransaction[];
    transactionCount: number;
    virtualTime?: string;
  }>({ transactions: [], transactionCount: 0 });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const baseMsRef = useRef<number>(Date.now() - 5 * 60 * 1000);
  const lastTickMsRef = useRef<number | null>(null);
  const counterRef = useRef(0);
  const speedRef = useRef(1);
  const modeRef = useRef<'REALTIME' | 'TIMEMACHINE'>('REALTIME');
  const pausedRef = useRef(false);
  const progressRef = useRef(0);
  const bufferRef = useRef<MockTransaction[]>([]);

  const applyStatus = useCallback(
    (iso: string) => {
      setStatusData({
        currentVirtualTime: iso,
        isStreaming: !pausedRef.current,
        isPaused: pausedRef.current,
        mode: modeRef.current,
        progress:
          modeRef.current === 'TIMEMACHINE' ? progressRef.current : 1,
        speedMultiplier: speedRef.current,
        updatedAt: new Date().toISOString(),
      });
    },
    []
  );

  const pushTransaction = useCallback(() => {
    if (pausedRef.current) return;

    const step = STEP_MS_BASE / Math.max(speedRef.current, 0.25);
    const nowMs =
      (lastTickMsRef.current ?? baseMsRef.current) + Math.max(step, 1_000);

    lastTickMsRef.current = nowMs;
    counterRef.current += 1;

    if (modeRef.current === 'TIMEMACHINE') {
      progressRef.current = Math.min(
        1,
        progressRef.current + step / TIMEMACHINE_WINDOW_MS
      );
    } else {
      progressRef.current = 1;
    }

    const tx = makeTransaction(counterRef.current, nowMs);
    bufferRef.current = [...bufferRef.current, tx].slice(-MAX_BUFFER);

    setData({
      transactions: bufferRef.current,
      transactionCount: bufferRef.current.length,
      virtualTime: tx.timestamp,
    });
    applyStatus(tx.timestamp);
  }, [applyStatus]);

  const startLoop = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(pushTransaction, 1_200);
  }, [pushTransaction]);

  const stopLoop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetBuffer = useCallback(() => {
    bufferRef.current = [];
    counterRef.current = 0;
    progressRef.current = 0;
    setData({ transactions: [], transactionCount: 0 });
  }, []);

  const setBaseTime = useCallback(
    (iso?: string) => {
      const parsed = iso ? Date.parse(iso) : NaN;
      baseMsRef.current = Number.isFinite(parsed) ? parsed : Date.now();
      lastTickMsRef.current = baseMsRef.current - STEP_MS_BASE;
    },
    []
  );

  const reconnect = useCallback(() => {
    stopLoop();
    setConnectionStatus('connecting');
    resetBuffer();
    setBaseTime();
    pausedRef.current = false;
    modeRef.current = 'REALTIME';
    speedRef.current = 1;
    progressRef.current = 1;
    setTimeout(() => {
      setConnectionStatus('connected');
      startLoop();
    }, 300);
  }, [resetBuffer, setBaseTime, startLoop, stopLoop]);

  const startRealtime = useCallback(async () => {
    modeRef.current = 'REALTIME';
    pausedRef.current = false;
    progressRef.current = 1;
    setBaseTime();
    startLoop();
    pushTransaction();
  }, [pushTransaction, setBaseTime, startLoop]);

  const startTimemachine = useCallback(
    async ({ startTime, speedMultiplier }: { startTime: string; speedMultiplier: number }) => {
      modeRef.current = 'TIMEMACHINE';
      pausedRef.current = false;
      speedRef.current = speedMultiplier;
      resetBuffer();
      setBaseTime(startTime);
      progressRef.current = 0;
      startLoop();
      pushTransaction();
    },
    [pushTransaction, resetBuffer, setBaseTime, startLoop]
  );

  const jumpTo = useCallback(
    async (targetIso: string) => {
      resetBuffer();
      setBaseTime(targetIso);
      progressRef.current = 0;
      pushTransaction();
    },
    [pushTransaction, resetBuffer, setBaseTime]
  );

  const pause = useCallback(async () => {
    pausedRef.current = true;
    applyStatus(new Date(lastTickMsRef.current ?? baseMsRef.current).toISOString());
  }, [applyStatus]);

  const resume = useCallback(async () => {
    pausedRef.current = false;
    pushTransaction();
  }, [pushTransaction]);

  const stop = useCallback(async () => {
    pausedRef.current = true;
    stopLoop();
    applyStatus(new Date(lastTickMsRef.current ?? baseMsRef.current).toISOString());
  }, [applyStatus, stopLoop]);

  const changeSpeed = useCallback(async (speed: number) => {
    speedRef.current = Math.max(0.1, speed);
    applyStatus(new Date(lastTickMsRef.current ?? baseMsRef.current).toISOString());
  }, [applyStatus]);

  useEffect(() => {
    setConnectionStatus('connecting');
    const ready = setTimeout(() => setConnectionStatus('connected'), 250);
    startLoop();
    // seed a few rows immediately
    pushTransaction();
    pushTransaction();
    pushTransaction();
    return () => {
      clearTimeout(ready);
      stopLoop();
    };
  }, [pushTransaction, startLoop, stopLoop]);

  const controls = useMemo(
    () => ({
      startRealtime,
      startTimemachine,
      jumpTo,
      pause,
      resume,
      stop,
      changeSpeed,
    }),
    [startRealtime, startTimemachine, jumpTo, pause, resume, stop, changeSpeed]
  );

  return {
    data,
    transactions: data.transactions,
    virtualTime: data.virtualTime,
    transactionCount: data.transactionCount,
    statusData,
    connectionStatus,
    reconnect,
    controls,
  } as const;
}
