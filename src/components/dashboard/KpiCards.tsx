'use client';
import { Kpi } from '@/hooks/queries/dashboard/useKpiQuery';

export default function KpiCards({ kpi }: { kpi?: Kpi | null }) {
  const items = [
    { label: '전체 거래 수', value: kpi?.totalTransactions ?? '-' },
    { label: '사기 탐지 건수', value: kpi?.fraudDetected ?? '-' },
    { label: '사기율', value: kpi?.fraudRate ?? '-' },
    { label: '평균 신뢰도', value: kpi?.avgConfidenceScore ?? '-' },
  ];

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
      {items.map((k, i) => (
        <div
          key={i}
          className='rounded-2xl border border-slate-800 bg-slate-900/40'
        >
          <div className='p-4'>
            <div className='text-xs text-slate-400'>{k.label}</div>
            <div className='text-xl mt-1'>{k.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
