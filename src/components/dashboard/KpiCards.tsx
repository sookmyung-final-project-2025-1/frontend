'use client';
import { Kpi } from '@/hooks/queries/dashboard/useKpiQuery';

export default function KpiCards({ kpi }: { kpi?: Kpi | null }) {
  const items = [
    { label: '신규 유저/시간', value: kpi?.additionProp1 ?? '-' },
    { label: '전체 유저', value: kpi?.additionProp1 ?? '-' },
    { label: 'Throughput', value: kpi?.additionProp1 ?? '-' },
    { label: 'Latency p95', value: kpi?.additionProp1 ?? '-' },
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
