'use client';

import {
  useConfidenceQuery,
  type UseConfidenceQueryArgs,
} from '@/hooks/queries/model/useConfidenceQuery';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function ConfidenceChart({
  range,
}: {
  range: UseConfidenceQueryArgs;
}) {
  const { data, isLoading, error } = useConfidenceQuery(range);

  // recharts용 데이터로 변환
  const chartData = useMemo(() => {
    const list = data?.timeSeries ?? [];
    const fmt =
      range.period === 'daily'
        ? (ts: number) =>
            new Date(ts).toLocaleDateString('ko-KR', {
              month: '2-digit',
              day: '2-digit',
            })
        : range.period === 'weekly'
          ? (ts: number) =>
              new Date(ts).toLocaleDateString('ko-KR', {
                month: '2-digit',
                day: '2-digit',
              })
          : // hourly (default)
            (ts: number) =>
              new Date(ts).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              });

    return list.map((d) => {
      const t = Date.parse(d.timestamp);
      return {
        x: Number.isFinite(t) ? fmt(t) : d.timestamp,
        score: Number(d.confidenceScore) || 0, // 0~1
        tx: Number(d.transactionCount) || 0,
      };
    });
  }, [data?.timeSeries, range.period]);

  const currentScore = data?.currentConfidenceScore;

  return (
    <div className='rounded-2xl border border-slate-800 bg-slate-900/40'>
      <div className='p-4'>
        <div className='flex items-center justify-between mb-2'>
          <div className='text-sm text-slate-300'>Confidence Score 추이</div>
          {typeof currentScore === 'number' && (
            <div className='text-xs px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200'>
              현재: {(currentScore * 100).toFixed(1)}%
            </div>
          )}
        </div>

        <div className='h-64'>
          {isLoading ? (
            <div className='h-full flex items-center justify-center text-slate-400'>
              불러오는 중…
            </div>
          ) : error ? (
            <div className='h-full flex items-center justify-center text-red-400'>
              데이터를 불러오지 못했습니다.
            </div>
          ) : (chartData?.length ?? 0) === 0 ? (
            <div className='h-full flex items-center justify-center text-slate-500 text-sm'>
              표시할 데이터가 없습니다.
            </div>
          ) : (
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 12, left: 12, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                <XAxis dataKey='x' stroke='#9CA3AF' fontSize={12} />
                <YAxis
                  domain={[0, 1]}
                  stroke='#9CA3AF'
                  fontSize={12}
                  tickFormatter={(v) => `${Math.round((v as number) * 100)}%`}
                  width={48}
                />
                <Tooltip
                  labelStyle={{ color: '#cbd5e1' }}
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                  }}
                  formatter={(value, name, entry) => {
                    if (entry && entry.dataKey === 'score') {
                      const v =
                        typeof value === 'number' ? value : Number(value);
                      return [`${(v * 100).toFixed(1)}%`, 'Confidence'];
                    }
                    return [value as any, name as string];
                  }}
                />

                {/* 현재 스코어 기준선(있을 때만 표시) */}
                {typeof currentScore === 'number' && (
                  <ReferenceLine
                    y={currentScore}
                    stroke='#F59E0B'
                    strokeDasharray='4 4'
                    label={{
                      value: `현재 ${(currentScore * 100).toFixed(1)}%`,
                      position: 'insideTopRight',
                      fill: '#F59E0B',
                    }}
                  />
                )}

                <Area
                  type='monotone'
                  dataKey='score'
                  name='Confidence'
                  stroke='#34D399'
                  fill='#34D399'
                  fillOpacity={0.2}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
