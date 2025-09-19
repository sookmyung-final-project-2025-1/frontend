'use client';

import {
  AlertTriangle,
  BarChart3,
  Calendar,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

type Props = {
  totalFraud: number;
  averageFraud: number;
  maxFraud: number;
  trendUp: boolean;
  trendPct: string;
};

export default function StatsCards({
  totalFraud,
  averageFraud,
  maxFraud,
  trendUp,
  trendPct,
}: Props) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm text-slate-400'>총 사기 건수</p>
            <p className='text-2xl font-semibold' style={{ color: '#F87171' }}>
              {totalFraud.toLocaleString()}
            </p>
          </div>
          <BarChart3 className='w-6 h-6' style={{ color: '#F87171' }} />
        </div>
      </div>

      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm text-slate-400'>평균 사기 건수</p>
            <p className='text-2xl font-semibold' style={{ color: '#38BDF8' }}>
              {averageFraud.toLocaleString()}
            </p>
          </div>
          <AlertTriangle className='w-6 h-6' style={{ color: '#38BDF8' }} />
        </div>
      </div>

      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm text-slate-400'>최고 사기 건수</p>
            <p className='text-2xl font-semibold' style={{ color: '#FB923C' }}>
              {maxFraud.toLocaleString()}
            </p>
          </div>
          <TrendingUp className='w-6 h-6' style={{ color: '#FB923C' }} />
        </div>
      </div>

      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm text-slate-400'>최근 트렌드</p>
            <div className='flex items-center gap-2'>
              {trendUp ? (
                <TrendingUp className='w-6 h-6' style={{ color: '#F87171' }} />
              ) : (
                <TrendingDown
                  className='w-6 h-6'
                  style={{ color: '#34D399' }}
                />
              )}
              <span
                className='text-2xl font-semibold'
                style={{ color: trendUp ? '#F87171' : '#34D399' }}
              >
                {trendPct}%
              </span>
            </div>
          </div>
          <Calendar className='w-6 h-6' style={{ color: '#A78BFA' }} />
        </div>
      </div>
    </div>
  );
}
