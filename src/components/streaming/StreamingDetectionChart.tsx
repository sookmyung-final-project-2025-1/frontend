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

  // 대시보드에서 모두 내려보내는 버전 (정확한 연동)
  playing?: boolean;
  currentPosition?: number; // 0..100
  timeRange?: TimeRange;
  virtualTime?: string;
  streamMeta?: StreamMeta | null;
};

type ChartRow = {
  time: string;
  score: number;
  lgbm: number;
  xgb: number;
  cat: number;
  fraud?: number;
  confidence: number;
};

export default function StreamingDetectionChart({
  data,
  threshold,
  playing,
  currentPosition,
  timeRange,
  virtualTime,
  streamMeta,
}: Props) {
  // 재생/포지션/메타 해석 (옵셔널 대비 기본값)
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

  // 애니메이션 보이기용 버퍼
  const [visibleData, setVisibleData] = useState<DetectionResult[]>([]);
  const [animationIndex, setAnimationIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 슬라이더 위치에 맞춰 자르기
  useEffect(() => {
    if (!data.length) {
      setVisibleData([]);
      setAnimationIndex(0);
      return;
    }
    const endIndex = Math.floor((data.length * resolvedPosition) / 100);
    const newVisible = data.slice(0, Math.max(1, endIndex));
    setVisibleData(newVisible);
    setAnimationIndex(newVisible.length);
  }, [data, resolvedPosition]);

  // 재생 중이면 점차 증가
  useEffect(() => {
    if (resolvedPlaying && data.length > 0) {
      const base = 100;
      const delay = Math.max(20, base / Math.max(0.1, speedMultiplier));
      const i = setInterval(() => {
        setAnimationIndex((prev) => (prev >= data.length ? prev : prev + 1));
      }, delay);
      intervalRef.current = i;
      return () => {
        clearInterval(i);
        intervalRef.current = null;
      };
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [resolvedPlaying, data.length, speedMultiplier]);

  // animationIndex 증가에 따라 갱신
  useEffect(() => {
    if (data.length > 0 && animationIndex > 0) {
      setVisibleData(data.slice(0, animationIndex));
    }
  }, [animationIndex, data]);

  const chartData = useMemo<ChartRow[]>(
    () =>
      visibleData.map((item) => ({
        time: new Date(item.timestamp).toLocaleTimeString('ko-KR', {
          hour12: false,
        }),
        score: item.score,
        lgbm: item.models.lgbm,
        xgb: item.models.xgb,
        cat: item.models.cat,
        fraud: item.prediction === 'fraud' ? item.score : undefined,
        confidence: item.confidence,
      })),
    [visibleData]
  );

  return (
    <div className='bg-slate-900 border border-slate-700 rounded-xl p-4'>
      <div className='flex justify-between items-center mb-3'>
        <h3 className='text-lg font-semibold'>실시간 사기 탐지 결과</h3>
        <div className='text-sm text-slate-400'>
          {visibleData.length} / {data.length} 포인트 ·{' '}
          <span>{formatVirtualTime(currentVirtualTime)}</span>
        </div>
      </div>

      <div className='h-80'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='time' tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <ReferenceLine
              y={threshold}
              strokeOpacity={0.5}
              strokeDasharray='5 5'
              label={`Threshold ${threshold}`}
            />

            <Line type='monotone' dataKey='score' dot={false} name='score' />
            <Line type='monotone' dataKey='lgbm' dot={false} name='lgbm' />
            <Line type='monotone' dataKey='xgb' dot={false} name='xgb' />
            <Line type='monotone' dataKey='cat' dot={false} name='cat' />
            <Line
              type='linear'
              dataKey='fraud'
              name='fraudOnly'
              strokeDasharray='4 2'
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
function formatVirtualTime(s?: string) {
  if (!s) return '';
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return s;
  return new Date(t).toLocaleString('ko-KR', { hour12: false });
}
