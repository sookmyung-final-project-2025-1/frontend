'use client';
import {
  useStatsHourlyQuery,
  type UseStatsHourlyQueryArgs,
} from '@/hooks/queries/dashboard/useStatsHourlyQuery';
import { useMemo } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function ProbChart({
  range,
}: {
  range: UseStatsHourlyQueryArgs;
}) {
  const { data = [], isLoading, error } = useStatsHourlyQuery(range);

  // 차트용 데이터로 변환 (hour → 라벨, 확률 계산)
  const chartData = useMemo(() => {
    return (data ?? []).map((d: any) => {
      const tx = Number(d.transactionCount) || 0;
      const fr = Number(d.fraudCount) || 0;
      const p = tx > 0 ? fr / tx : 0;
      const hourLabel = new Date(d.hour).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return {
        hourLabel,
        transactionCount: tx,
        fraudCount: fr,
        fraudProb: p, // 0~1
        avgAmount: Number(d.avgAmount) || 0,
      };
    });
  }, [data]);

  return (
    <div className='rounded-2xl border border-slate-800 bg-slate-900/40 xl:col-span-2'>
      <div className='p-4'>
        <div className='text-sm text-slate-300 mb-2'>
          시간대별 사기확률 · 건수
        </div>

        <div className='h-64'>
          {isLoading && (
            <div className='h-full flex items-center justify-center text-slate-400'>
              불러오는 중…
            </div>
          )}
          {error && (
            <div className='h-full flex items-center justify-center text-red-400'>
              데이터를 불러오지 못했습니다.
            </div>
          )}
          {!isLoading && !error && (
            <ResponsiveContainer width='100%' height='100%'>
              <ComposedChart
                data={chartData}
                margin={{ top: 8, right: 12, left: 12, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                <XAxis dataKey='hourLabel' stroke='#9CA3AF' fontSize={12} />
                {/* 왼쪽 Y: 건수 */}
                <YAxis
                  yAxisId='left'
                  stroke='#9CA3AF'
                  fontSize={12}
                  width={48}
                  allowDecimals={false}
                />
                {/* 오른쪽 Y: 사기확률(%) */}
                <YAxis
                  yAxisId='right'
                  orientation='right'
                  stroke='#9CA3AF'
                  fontSize={12}
                  width={48}
                  domain={[0, 1]}
                  tickFormatter={(v) => `${Math.round((v as number) * 100)}%`}
                />

                <Tooltip
                  formatter={(value, name, entry) => {
                    if (entry && entry.dataKey === 'fraudProb') {
                      const v =
                        typeof value === 'number' ? value : Number(value);
                      return [`${(v * 100).toFixed(1)}%`, '사기확률'];
                    }
                    if (entry && entry.dataKey === 'transactionCount') {
                      return [value as number, '거래건수'];
                    }
                    if (entry && entry.dataKey === 'fraudCount') {
                      return [value as number, '사기건수'];
                    }
                    if (entry && entry.dataKey === 'avgAmount') {
                      const v =
                        typeof value === 'number' ? value : Number(value);
                      return [v.toLocaleString(), '평균금액'];
                    }
                    return [value as any, name as string];
                  }}
                  labelFormatter={(label) => `시간: ${label}`}
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                  }}
                  labelStyle={{ color: '#cbd5e1' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend />

                {/* 건수(막대) */}
                <Bar
                  yAxisId='left'
                  dataKey='transactionCount'
                  name='거래건수'
                  fill='#60A5FA'
                  radius={[4, 4, 0, 0]}
                />

                {/* 필요하면 사기건수도 함께 */}
                {/* <Bar
                  yAxisId="left"
                  dataKey="fraudCount"
                  name="사기건수"
                  fill="#F87171"
                  radius={[4, 4, 0, 0]}
                /> */}

                {/* 사기확률(면적) */}
                <Area
                  yAxisId='right'
                  type='monotone'
                  dataKey='fraudProb'
                  name='사기확률'
                  stroke='#34D399'
                  fill='#34D399'
                  fillOpacity={0.2}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive
                />

                {/* 평균 금액 라인까지 그리고 싶으면 여기 추가 */}
                {/* <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgAmount"
                  name="평균금액"
                  stroke="#EAB308"
                  strokeWidth={2}
                  dot={false}
                /> */}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
