'use client';

import { useStartDemo } from '@/hooks/queries/dashboard/test-demo/useStartDemo';
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

type StreamMeta = {
  currentVirtualTime: string;
  isPaused: boolean;
  isStreaming: boolean;
  mode: 'TIMEMACHINE' | 'REALTIME';
  progress: number; // 0..1
  speedMultiplier: number;
  updatedAt: string;
};

type DetectionResult = {
  timestamp: string;
  score: number;
  prediction: 'fraud' | 'normal';
  confidence: number;
  models: { lgbm: number; xgb: number; cat: number };
};

type Props = {
  data: DetectionResult[];
  playing: boolean;
  currentPosition: number; // 0-100
  threshold: number;
  timeRange: '24h' | '7d' | '30d';
  virtualTime: string;
  streamMeta?: StreamMeta | null; // /status에서 온 메타
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
  const startDemo = useStartDemo();

  useEffect(() => {
    startDemo.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔥 streamMeta가 오면 그 값을 우선 적용
  const resolvedPlaying = streamMeta
    ? streamMeta.isStreaming && !streamMeta.isPaused
    : playing;

  const resolvedPosition = Number.isFinite(streamMeta?.progress as number)
    ? clamp((streamMeta!.progress as number) * 100, 0, 100)
    : clamp(currentPosition, 0, 100);

  const speedMultiplier = streamMeta?.speedMultiplier ?? 1;
  const currentVirtualTime = streamMeta?.currentVirtualTime ?? virtualTime;
  const streamingMode =
    streamMeta?.mode ?? (playing ? 'REALTIME' : ('TIMEMACHINE' as const));

  const [visibleData, setVisibleData] = useState<DetectionResult[]>([]);
  const [animationIndex, setAnimationIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 현재 위치에 따른 데이터 슬라이싱
  useEffect(() => {
    if (!data.length) return;
    const endIndex = Math.floor((data.length * resolvedPosition) / 100);
    const newVisibleData = data.slice(0, Math.max(1, endIndex));
    setVisibleData(newVisibleData);
    setAnimationIndex(newVisibleData.length);
  }, [data, resolvedPosition]);

  // 재생 중 자동 진행(배속 반영)
  useEffect(() => {
    if (resolvedPlaying && data.length > 0) {
      const base = 100;
      const delay = Math.max(20, base / Math.max(0.1, speedMultiplier));
      const interval = setInterval(() => {
        setAnimationIndex((prev) => (prev >= data.length ? prev : prev + 1));
      }, delay);
      intervalRef.current = interval;
      return () => clearInterval(interval);
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [resolvedPlaying, data.length, speedMultiplier]);

  // 애니메이션 인덱스 → visible 데이터 업데이트
  useEffect(() => {
    if (data.length > 0 && animationIndex > 0) {
      setVisibleData(data.slice(0, animationIndex));
    }
  }, [animationIndex, data]);

  // ✅ 메모이즈: 매 렌더마다 map하지 않도록
  const chartData = useMemo(
    () =>
      visibleData.map((item) => ({
        time: new Date(item.timestamp).toLocaleTimeString(),
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

  type TooltipContentProps = {
    active?: boolean;
    payload?: Array<{ payload: ChartRow }>;
    label?: string | number;
  };

  const CustomTooltip = ({ active, payload, label }: TooltipContentProps) => {
    if (active && payload?.length) {
      const row = payload[0].payload;
      return (
        <div className='bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg'>
          <p className='text-slate-300 text-sm'>{`시간: ${label}`}</p>
          <p
            className={`font-semibold ${row.prediction === 1 ? 'text-red-400' : 'text-green-400'}`}
          >
            {`예측: ${row.prediction === 1 ? '사기' : '정상'}`}
          </p>
          <p className='text-blue-400'>{`스코어: ${row.score.toFixed(3)}`}</p>
          <p className='text-yellow-400'>{`신뢰도: ${(row.confidence * 100).toFixed(1)}%`}</p>
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
  const formatVirtualTime = (timeStr: string) => {
    const t = Date.parse(timeStr);
    if (!Number.isFinite(t)) return timeStr ?? '';
    return new Date(t).toLocaleString('ko-KR');
  };

  return (
    <div className='space-y-4'>
      {/* 스트리밍 상태 표시(옵션) */}
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
            <div className='text-center'>
              <div className='text-lg font-bold text-blue-400'>
                {streamingMode}
              </div>
              <div className='text-xs text-slate-400'>모드</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-bold text-green-400'>
                {speedMultiplier}x
              </div>
              <div className='text-xs text-slate-400'>재생 속도</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-bold text-purple-400'>
                {resolvedPosition.toFixed(1)}%
              </div>
              <div className='text-xs text-slate-400'>진행률</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-bold text-orange-400'>
                {formatVirtualTime(currentVirtualTime)}
              </div>
              <div className='text-xs text-slate-400'>가상 시간</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-bold text-slate-300'>
                {timeRange}
              </div>
              <div className='text-xs text-slate-400'>범위</div>
            </div>
          </div>
        </div>
      )}

      {/* 메인 차트 */}
      <div className='bg-slate-900 border border-slate-700 rounded-xl p-4'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-semibold'>실시간 사기 탐지 결과</h3>
          <div className='flex items-center gap-4 text-sm'>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 bg-red-500 rounded-full' />
              <span>사기 (≥{threshold})</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 bg-green-500 rounded-full' />
              <span>정상 (&lt;{threshold})</span>
            </div>
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
                interval='preserveStartEnd'
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

      {/* 최근 탐지 결과 / 통계 */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* 실시간 스트림 */}
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
                    ? 'bg-red-900/20 border-red-700/50 text-red-200'
                    : 'bg-green-900/20 border-green-700/50 text-green-200'
                }`}
              >
                <div className='flex justify-between items-center'>
                  <span className='text-xs font-mono'>
                    {new Date(r.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${r.prediction === 'fraud' ? 'bg-red-600' : 'bg-green-600'} text-white`}
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

        {/* 통계 */}
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
                  color='text-red-400'
                />
                <StatBlock
                  title='정상 거래'
                  value={
                    visibleData.filter((r) => r.prediction === 'normal').length
                  }
                  color='text-green-400'
                />
              </div>

              <div className='border-t border-slate-700 pt-3'>
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
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
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
