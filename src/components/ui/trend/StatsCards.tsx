// src/components/ui/trend/StatsCards.tsx
'use client';

import { BarChart3, Percent } from 'lucide-react';

type Props = {
  totalTransactions: number; // 전체 거래 건수
  totalFraud: number; // 총 사기 건수
  averageFraud: number; // 평균 사기 건수(버킷 평균)
  fraudRatio: number; // 사기 비율 (0~1)
  rangeLabel?: string;
};

export default function StatsCards({
  totalTransactions,
  totalFraud,
  averageFraud,
  fraudRatio,
  rangeLabel,
}: Props) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      {/* 전체 거래 건수 */}
      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm text-slate-400'>전체 거래 건수</p>
            <p className='text-2xl font-semibold' style={{ color: '#A78BFA' }}>
              {totalTransactions.toLocaleString()}건
              {rangeLabel ? ` (${rangeLabel})` : ''}
            </p>
          </div>
          <BarChart3 className='w-6 h-6' style={{ color: '#A78BFA' }} />
        </div>
      </div>

      {/* 총 사기 건수 */}
      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm text-slate-400'>총 사기 건수</p>
            <p className='text-2xl font-semibold' style={{ color: '#F87171' }}>
              {totalFraud.toLocaleString()}건
            </p>
          </div>
          <BarChart3 className='w-6 h-6' style={{ color: '#F87171' }} />
        </div>
      </div>

      {/* 평균 사기 건수 */}
      {/* <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm text-slate-400'>평균 사기 건수</p>
            <p className='text-2xl font-semibold' style={{ color: '#38BDF8' }}>
              {averageFraud.toLocaleString()}
            </p>
          </div>
          <AlertTriangle className='w-6 h-6' style={{ color: '#38BDF8' }} />
        </div>
      </div> */}

      {/* 사기 비율 */}
      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm text-slate-400'>사기 비율</p>
            <p className='text-2xl font-semibold' style={{ color: '#34D399' }}>
              {(fraudRatio * 100).toFixed(2)}%
            </p>
          </div>
          <Percent className='w-6 h-6' style={{ color: '#34D399' }} />
        </div>
      </div>
    </div>
  );
}
