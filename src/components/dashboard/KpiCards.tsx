'use client';
import { Kpi } from '@/hooks/queries/dashboard/useKpiQuery';

export default function KpiCards({ kpi }: { kpi?: Kpi | null }) {
  // ---- 포맷터 ----
  const fmtInt = (v?: number) =>
    typeof v === 'number' ? v.toLocaleString('ko-KR') : '-';

  const fmtPct = (v?: number) =>
    typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : '-';

  const fmtFraudPct = (v?: number) =>
    typeof v === 'number' ? `${v.toFixed(1)}%` : '-';

  const fmtMs = (v?: number) => {
    if (typeof v !== 'number') return '-';
    if (v >= 1000) return `${(v / 1000).toFixed(2)} s`;
    return `${Math.round(v)} ms`;
  };

  const fmtKRW = (v?: number) =>
    typeof v === 'number' ? `₩${Math.round(v).toLocaleString('ko-KR')}` : '-';

  // ---- 라벨 매핑 ----
  const items = [
    { label: '전체 거래 수', value: fmtInt(kpi?.totalTransactions) },
    { label: '사기 탐지 건수', value: fmtInt(kpi?.fraudTransactions) },
    { label: '사기율', value: fmtFraudPct(kpi?.fraudRate) },
    { label: '평균 신뢰도', value: fmtPct(kpi?.averageConfidenceScore) },

    { label: '평균 처리시간', value: fmtMs(kpi?.averageProcessingTimeMs) },
    { label: '지연시간 p50', value: fmtMs(kpi?.medianProcessingTimeMs) },
    { label: '지연시간 p95', value: fmtMs(kpi?.p95ProcessingTimeMs) },
    { label: '시간당 처리량', value: fmtInt(kpi?.throughputPerHour) },

    { label: '평균 거래 금액', value: fmtKRW(kpi?.averageTransactionAmount) },
    { label: '고유 사용자 수', value: fmtInt(kpi?.uniqueUsers) },
  ];

  return (
    <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4'>
      {items.map((k, i) => (
        <div
          key={i}
          className='rounded-2xl border border-slate-800 bg-slate-900/40 h-full'
        >
          <div className='h-full p-5 flex justify-between'>
            <div className='text-xm text-slate-400'>{k.label}</div>
            <div className='text-xl mt-1 text-slate-100'>{k.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
