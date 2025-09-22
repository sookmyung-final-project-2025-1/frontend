'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DetectionResult, StreamMeta, TimeRange } from './types';

type Props = {
  data: DetectionResult[];
  threshold: number;
  playing?: boolean;
  currentPosition?: number;
  timeRange?: TimeRange;
  virtualTime?: string;
  streamMeta?: StreamMeta | null;
  connectionStatus?: 'connecting' | 'connected' | 'disconnected' | 'error';
  slidingWindowSize?: number;
};

type ChartRow = {
  timeMs: number;
  label: string;
  score: number;
  lgbm: number;
  xgb: number;
  cat: number;
  fraud?: number;
  confidence: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
function formatVirtualTime(s?: string) {
  if (!s) return '';
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return s;
  return new Date(t).toLocaleString('ko-KR', { hour12: false });
}

export default function StreamingDetectionChart({
  data,
  threshold,
  playing,
  currentPosition,
  timeRange,
  virtualTime,
  streamMeta,
  connectionStatus,
  slidingWindowSize,
}: Props) {
  const resolvedPlaying = streamMeta
    ? streamMeta.isStreaming && !streamMeta.isPaused
    : !!playing;
  const resolvedPosition =
    typeof streamMeta?.progress === 'number'
      ? clamp(streamMeta.progress * 100, 0, 100)
      : clamp(currentPosition ?? 100, 0, 100);

  const speedMultiplier = streamMeta?.speedMultiplier ?? 1;
  const currentVirtualTime =
    streamMeta?.currentVirtualTime ?? virtualTime ?? '';
  const isRealtimeSliding = resolvedPlaying;

  const [visibleData, setVisibleData] = useState<DetectionResult[]>([]);
  const [animationIndex, setAnimationIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDataRef = useRef<DetectionResult[]>([]);

  const windowedData = useMemo(() => {
    if (!slidingWindowSize || slidingWindowSize <= 0) return data;
    return data.slice(Math.max(0, data.length - slidingWindowSize));
  }, [data, slidingWindowSize]);

  useEffect(() => {
    const dataChanged = windowedData !== lastDataRef.current;
    lastDataRef.current = windowedData;
    if (!windowedData.length) {
      setVisibleData([]);
      setAnimationIndex(0);
      return;
    }
    const targetLength = isRealtimeSliding
      ? windowedData.length
      : Math.max(1, Math.floor((windowedData.length * resolvedPosition) / 100));

    if (dataChanged || animationIndex !== targetLength) {
      const newVisible = windowedData.slice(0, targetLength);
      setVisibleData(newVisible);
      setAnimationIndex(targetLength);
    }
  }, [
    windowedData,
    resolvedPosition,
    resolvedPlaying,
    isRealtimeSliding,
    animationIndex,
  ]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!isRealtimeSliding && resolvedPlaying && windowedData.length > 0) {
      const baseDelay = 100;
      const delay = Math.max(20, baseDelay / Math.max(0.1, speedMultiplier));
      const interval = setInterval(() => {
        setAnimationIndex((prev) => {
          const cappedLen = windowedData.length;
          if (prev >= cappedLen) return prev;
          const next = prev + 1;
          setVisibleData(windowedData.slice(0, Math.min(next, cappedLen)));
          return next;
        });
      }, delay);
      intervalRef.current = interval;
      return () => {
        clearInterval(interval);
        intervalRef.current = null;
      };
    }
  }, [
    resolvedPlaying,
    windowedData.length,
    speedMultiplier,
    windowedData,
    isRealtimeSliding,
  ]);

  const chartData = useMemo<ChartRow[]>(() => {
    return visibleData.map((item) => {
      const ms = Date.parse(item.timestamp);
      return {
        timeMs: Number.isFinite(ms) ? ms : Date.now(),
        label: new Date(item.timestamp).toLocaleTimeString('ko-KR', {
          hour12: false,
        }),
        score: item.score,
        lgbm: item.models.lgbm,
        xgb: item.models.xgb,
        cat: item.models.cat,
        fraud: item.prediction === 'fraud' ? item.score : undefined,
        confidence: item.confidence,
      };
    });
  }, [visibleData]);

  const showBadge = connectionStatus !== 'connected';

  return (
    <div className='relative rounded-xl border border-slate-700 bg-slate-900 p-4'>
      {showBadge && (
        <div className='absolute right-4 top-4 z-10 rounded-full border border-yellow-600/40 bg-yellow-900/30 px-3 py-1 text-xs text-yellow-200'>
          {connectionStatus === 'connecting'
            ? '실시간 연동 중…'
            : connectionStatus === 'error'
              ? '연결 오류'
              : '연결 대기'}
        </div>
      )}

      <div className='mb-3 flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>실시간 사기 탐지 결과</h3>
        <div className='text-sm text-slate-400'>
          {visibleData.length} / {data.length} 포인트 ·{' '}
          <span>{formatVirtualTime(currentVirtualTime)}</span>
          {resolvedPlaying && (
            <span className='ml-2 text-emerald-400'>▶ {speedMultiplier}x</span>
          )}
        </div>
      </div>

      <div className='h-80'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
            <XAxis
              type='number'
              dataKey='timeMs'
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              stroke='#6B7280'
              tickFormatter={(value) =>
                new Date(value).toLocaleTimeString('ko-KR', { hour12: false })
              }
            />
            <YAxis
              domain={[0, 'auto']}
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              stroke='#6B7280'
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              labelFormatter={(value) =>
                new Date(value as number).toLocaleTimeString('ko-KR', {
                  hour12: false,
                })
              }
            />
            <Legend />
            <ReferenceLine
              y={threshold}
              stroke='#EF4444'
              strokeOpacity={0.7}
              strokeDasharray='5 5'
              label={{ value: `Threshold ${threshold}`, position: 'right' }}
            />
            <Line
              type='monotone'
              dataKey='score'
              stroke='#3B82F6'
              dot={false}
              name='Score'
              strokeWidth={2}
            />
            <Line
              type='monotone'
              dataKey='lgbm'
              stroke='#10B981'
              dot={false}
              name='LGBM'
              strokeWidth={1}
            />
            <Line
              type='monotone'
              dataKey='xgb'
              stroke='#F59E0B'
              dot={false}
              name='XGB'
              strokeWidth={1}
            />
            <Line
              type='monotone'
              dataKey='cat'
              stroke='#8B5CF6'
              dot={false}
              name='CatBoost'
              strokeWidth={1}
            />
            <Line
              type='linear'
              dataKey='fraud'
              name='Fraud Detection'
              stroke='#EF4444'
              strokeWidth={3}
              strokeDasharray='4 2'
              dot={{ fill: '#EF4444', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
