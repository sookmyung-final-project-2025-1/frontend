'use client';
import { FeatureImportanceResponse } from '@/hooks/queries/dashboard/useFeatureImportanceQuery';
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function FeatureImportanceChart({
  data,
}: {
  data?: FeatureImportanceResponse;
}) {
  return (
    <div className='rounded-2xl border border-slate-800 bg-slate-900/40'>
      <div className='p-4'>
        <div className='text-sm text-slate-300 mb-2'>Feature Importance</div>
        <div className='h-72'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={data?.items ?? []}>
              <XAxis dataKey='feature' hide />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='importance' />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
