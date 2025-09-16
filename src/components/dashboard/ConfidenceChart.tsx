'use client';
import { ConfidenceResponse } from '@/hooks/queries/dashboard/useConfidenceQuery';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function ConfidenceChart({
  data,
}: {
  data?: ConfidenceResponse;
}) {
  return (
    <div className='rounded-2xl border border-slate-800 bg-slate-900/40'>
      <div className='p-4'>
        <div className='text-sm text-slate-300 mb-2'>Confidence Score 추이</div>
        <div className='h-64'>
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={data?.points ?? []}>
              <XAxis dataKey='t' hide />
              <YAxis />
              <Tooltip />
              <Area
                type='monotone'
                dataKey='v'
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
