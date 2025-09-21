// src/components/streaming/StreamingDetectionChart.tsx
'use client';

import { useStartDemo } from '@/hooks/queries/test-demo/useStartDemo';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type ChartRow = {
  time: string;
  score: number;
  prediction: 0 | 1;
  confidence: number;
  lgbm: number;
  xgb: number;
  cat: number;
};

export type StreamMeta = {
  currentVirtualTime: string;
  isPaused: boolean;
  isStreaming: boolean;
  mode: 'TIMEMACHINE' | 'REALTIME';
  progress?: number; // 0..1  ← 옵셔널
  speedMultiplier: number;
  updatedAt: string;
};

export type DetectionResult = {
  timestamp: string;
  score: number;
  prediction: 'fraud' | 'normal';
  confidence: number;
  models: { lgbm: number; xgb: number; cat: number };
};

type Props = {
  data: DetectionResult[];
  playing: boolean;
  currentPosition: number; // 0..100
  threshold: number;
  timeRange: '24h' | '7d' | '30d';
  virtualTime: string;
  streamMeta?: StreamMeta | null;
};

export default function StreamingDetectionChart({
  data,
  playing,
  currentPosition,
  threshold,
  timeRange,
  virtualTime,
  streamMeta,
}: Props) {
  // 데모 API 1회만
  const startDemo = useStartDemo();
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    startDemo.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolvedPlaying = streamMeta
    ? streamMeta.isStreaming && !streamMeta.isPaused
    : playing;

  const resolvedPosition =
    typeof streamMeta?.progress === 'number'
      ? clamp(streamMeta.progress * 100, 0, 100)
      : clamp(currentPosition, 0, 100);

  const speedMultiplier = streamMeta?.speedMultiplier ?? 1;
  const currentVirtualTime = streamMeta?.currentVirtualTime ?? virtualTime;
  const streamingMode =
    streamMeta?.mode ?? (playing ? 'REALTIME' : 'TIMEMACHINE');

  const [visibleData, setVisibleData] = useState<DetectionResult[]>([]);
  const [animationIndex, setAnimationIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 슬라이더 위치가 바뀌면 보여줄 데이터 컷
  useEffect(() => {
    if (!data.length) return;
    const endIndex = Math.floor((data.length * resolvedPosition) / 100);
    const newVisible = data.slice(0, Math.max(1, endIndex));
    setVisibleData(newVisible);
    setAnimationIndex(newVisible.length);
  }, [data, resolvedPosition]);

  // 재생 중이면 애니메이션 증가
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

  // animationIndex가 증가할 때 실제 표시 데이터 갱신
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
        prediction: item.prediction === 'fraud' ? 1 : 0,
        confidence: item.confidence,
        lgbm: item.models.lgbm,
        xgb: item.models.xgb,
        cat: item.models.cat,
      })),
    [visibleData]
  );

  const recentResults = useMemo(() => visibleData.slice(-10), [visibleData]);

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ payload: ChartRow }>;
    label?: string | number;
  }) => {
    if (active && payload?.length) {
      const row = payload[0].payload;
      return (
        <div className='bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg'>
          <p className='text-slate-300 text-sm'>{`시간: ${label}`}</p>
          <p
            className={`font-semibold ${
              row.prediction === 1 ? 'text-red-400' : 'text-green-400'
            }`}
          >
            {`예측: ${row.prediction === 1 ? '사기' : '정상'}`}
          </p>
          <p className='text-blue-400'>{`스코어: ${row.score.toFixed(3)}`}</p>
          <p className='text-yellow-400'>{`신뢰도: ${(
            row.confidence * 100
          ).toFixed(1)}%`}</p>
          <div className='mt-2 space-y-1'>
            <p className='text-xs text-slate-400'>모델별 기여도:</p>
            <p className='text-xs'>LGBM: {(row.lgbm * 100).toFixed(1)}%</p>
            <p className='text-xs'>XGB: {(row.xgb * 100).toFixed(1)}%</p>
            <p className='text-xs'>CAT: {(row.cat * 100).toFixed(1)}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const formatVirtualTime = (s: string) => {
    const t = Date.parse(s);
    if (!Number.isFinite(t)) return s ?? '';
    return new Date(t).toLocaleString('ko-KR');
  };

  return (
    <div className='space-y-4'>
      {streamMeta && (
        <div className='bg-slate-800 border border-slate-600 rounded-xl p-4'>
          <div className='flex items-center justify-between'>
            <h4 className='font-semibold flex items-center gap-2'>
              <div
                className={`w-3 h-3 rounded-full ${
                  resolvedPlaying
                    ? 'bg-green-400 animate-pulse'
                    : 'bg-yellow-400'
                }`}
              />
              스트리밍 상태
            </h4>
            <div className='text-sm text-slate-400'>
              업데이트: {formatVirtualTime(streamMeta.updatedAt)}
            </div>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-5 gap-4 mt-3'>
            <InfoCell label='모드' value={streamingMode} color='#60A5FA' />
            <InfoCell
              label='재생 속도'
              value={`${streamMeta.speedMultiplier}x`}
              color='#34D399'
            />
            <InfoCell
              label='진행률'
              value={`${resolvedPosition.toFixed(1)}%`}
              color='#A78BFA'
            />
            <InfoCell
              label='가상 시간'
              value={formatVirtualTime(currentVirtualTime)}
              color='#FB923C'
            />
            <InfoCell label='범위' value={timeRange} color='#E5E7EB' />
          </div>
        </div>
      )}

      <div className='bg-slate-900 border border-slate-700 rounded-xl p-4'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-semibold'>실시간 사기 탐지 결과</h3>
          <div className='flex items-center gap-4 text-sm'>
            <LegendDot color='#EF4444' label={`사기 (≥${threshold})`} />
            <LegendDot color='#10B981' label={`정상 (<${threshold})`} />
            <div className='text-slate-400'>
              {visibleData.length} / {data.length} 포인트
            </div>
          </div>
        </div>

        <div className='h-80'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
              <XAxis
                dataKey='time'
                stroke='#9CA3AF'
                fontSize={12}
                minTickGap={24}
              />
              <YAxis stroke='#9CA3AF' fontSize={12} domain={[0, 1]} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={threshold}
                stroke='#EF4444'
                strokeDasharray='5 5'
                label={{
                  value: `Threshold: ${threshold}`,
                  position: 'insideTopRight',
                }}
              />
              <Line
                type='monotone'
                dataKey='score'
                stroke='#3B82F6'
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 0, r: 2 }}
                activeDot={{ r: 4, stroke: '#3B82F6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='bg-slate-900 border border-slate-700 rounded-xl p-4'>
          <h4 className='font-semibold mb-3 flex items-center gap-2'>
            <div
              className={`w-2 h-2 rounded-full ${
                resolvedPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
              }`}
            />
            실시간 스트림
          </h4>
          <div className='space-y-2 max-h-60 overflow-y-auto'>
            {[...recentResults].reverse().map((r, i) => (
              <div
                key={`${r.timestamp}-${i}`}
                className={`p-2 rounded-lg border transition-all ${
                  r.prediction === 'fraud'
                    ? 'bg-[#7F1D1D26] border-[#7F1D1D80] text-[#FCA5A5]'
                    : 'bg-[#064E3B26] border-[#064E3B80] text-[#A7F3D0]'
                }`}
              >
                <div className='flex justify-between items-center'>
                  <span className='text-xs font-mono'>
                    {new Date(r.timestamp).toLocaleTimeString('ko-KR', {
                      hour12: false,
                    })}
                  </span>
                  <span
                    className='text-xs px-2 py-1 rounded text-white'
                    style={{
                      backgroundColor:
                        r.prediction === 'fraud' ? '#DC2626' : '#10B981',
                    }}
                  >
                    {r.prediction === 'fraud' ? '사기' : '정상'}
                  </span>
                </div>
                <div className='text-xs mt-1 flex justify-between'>
                  <span>Score: {r.score.toFixed(3)}</span>
                  <span>신뢰도: {(r.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='bg-slate-900 border border-slate-700 rounded-xl p-4'>
          <h4 className='font-semibold mb-3'>탐지 통계</h4>
          {visibleData.length > 0 && (
            <>
              <div className='grid grid-cols-2 gap-4'>
                <StatBlock
                  title='사기 탐지'
                  value={
                    visibleData.filter((r) => r.prediction === 'fraud').length
                  }
                  color='#F87171'
                />
                <StatBlock
                  title='정상 거래'
                  value={
                    visibleData.filter((r) => r.prediction === 'normal').length
                  }
                  color='#34D399'
                />
              </div>
              <div className='border-top border-slate-700 pt-3'>
                <div className='text-sm space-y-1'>
                  <KV
                    label='평균 스코어'
                    value={(
                      visibleData.reduce((s, r) => s + r.score, 0) /
                      visibleData.length
                    ).toFixed(3)}
                  />
                  <KV
                    label='평균 신뢰도'
                    value={`${(
                      (visibleData.reduce((s, r) => s + r.confidence, 0) /
                        visibleData.length) *
                      100
                    ).toFixed(1)}%`}
                  />
                  <KV
                    label='사기 비율'
                    value={`${(
                      (visibleData.filter((r) => r.prediction === 'fraud')
                        .length /
                        visibleData.length) *
                      100
                    ).toFixed(1)}%`}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className='flex items-center gap-2'>
      <div
        className='w-3 h-3 rounded-full'
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );
}

function InfoCell({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className='text-center'>
      <div className='text-lg font-bold' style={{ color }}>
        {value}
      </div>
      <div className='text-xs text-slate-400'>{label}</div>
    </div>
  );
}

function StatBlock({
  title,
  value,
  color,
}: {
  title: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className='text-center'>
      <div className='text-2xl font-bold' style={{ color }}>
        {value}
      </div>
      <div className='text-xs text-slate-400'>{title}</div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string | number }) {
  return (
    <div className='flex justify-between'>
      <span className='text-slate-400'>{label}:</span>
      <span>{value}</span>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
