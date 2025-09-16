'use client';
import {
  useStatsHourlyQuery,
  UseStatsHourlyQueryArgs,
} from '@/hooks/queries/dashboard/useStatsHourlyQuery';
import {
  Area,
  AreaChart,
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

  return (
    <div className='rounded-2xl border border-slate-800 bg-slate-900/40 xl:col-span-2'>
      <div className='p-4'>
        <div className='text-sm text-slate-300 mb-2'>
          시간대별 사기확률 · 건수
        </div>
        <div className='h-64'>
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={data}>
              <XAxis dataKey='t' hide />
              <YAxis />
              <Tooltip />
              <Area
                type='monotone'
                dataKey='p'
                fillOpacity={0.2}
                strokeOpacity={1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
