// src/components/dashboard/KpiPanel.tsx
'use client';

import { useKpiQuery } from '@/hooks/queries/dashboard/useKpiQuery';
import { useMemo, useState } from 'react';
// useKpiQuery가 반환하는 타입을 새 스키마에 맞게 수정했다는 가정
// (falsePositiveRate, latencyP50Ms/latencyP95Ms 등)
import type { Kpi } from '@/hooks/queries/dashboard/useKpiQuery';
import { RefreshCw } from 'lucide-react';

/* ───────────── 시간 유틸 ───────────── */
const pad = (n: number) => String(n).padStart(2, '0');
const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
/** datetime-local 값(로컬) → ISO(UTC) */
const localInputToISO = (v: string) => new Date(v).toISOString();

/* ───────────── 포맷터 ───────────── */
const fmtInt = (v?: number) =>
  typeof v === 'number' ? v.toLocaleString('ko-KR') : '-';

const fmtPct01 = (v?: number) =>
  typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : '-';

const fmtPct100 = (v?: number) =>
  typeof v === 'number' ? `${v.toFixed(1)}%` : '-';

const fmtMs = (v?: number) => {
  if (typeof v !== 'number') return '-';
  if (v >= 1000) return `${(v / 1000).toFixed(2)} s`;
  return `${Math.round(v)} ms`;
};

const fmtKRW = (v?: number) =>
  typeof v === 'number'
    ? `₩${Math.round(v * 1000).toLocaleString('ko-KR')}`
    : '-';

/* ───────────── 카드 렌더러 ───────────── */
function KpiCards({ kpi }: { kpi?: Kpi | null }) {
  const items = [
    { label: '전체 거래 수', value: fmtInt(kpi?.totalTransactions) },
    { label: '사기 탐지 건수', value: fmtInt(kpi?.fraudTransactions) },

    { label: '오탐 비율', value: fmtPct100(kpi?.falsePositiveRate) },

    { label: '시간당 처리량', value: fmtInt(kpi?.throughputPerHour) },
    { label: '평균 거래 금액', value: fmtKRW(kpi?.averageTransactionAmount) },
    { label: '고유 사용자 수', value: fmtInt(kpi?.uniqueUsers) },
  ];

  return (
    <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4'>
      {items.map((k, i) => (
        <div
          key={i}
          className='rounded-2xl border border-slate-800 bg-slate-900/40 h-full'
        >
          <div className='h-full p-5 flex justify-between'>
            <div className='text-sm text-slate-400'>{k.label}</div>
            <div className='text-xl mt-1 text-slate-100'>{k.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────── 컨트롤 + 데이터 패널 ───────────── */
export default function KpiPanel() {
  // 기본: 최근 30일 ~ 지금
  const now = new Date();
  const startDefault = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [startLocal, setStartLocal] = useState<string>(
    toLocalInput(startDefault)
  );
  const [endLocal, setEndLocal] = useState<string>(toLocalInput(now));

  // 쿼리 파라미터(ISO로 변환)
  const startISO = useMemo(() => localInputToISO(startLocal), [startLocal]);
  const endISO = useMemo(() => localInputToISO(endLocal), [endLocal]);

  const kpiQ = useKpiQuery({
    startTime: startISO,
    endTime: endISO,
  });

  return (
    <section className='bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-6'>
      {/* 컨트롤 바 */}
      <div className='flex flex-col md:flex-row md:items-end gap-3'>
        <div className='flex-1'>
          <label className='block text-sm mb-1 text-slate-300'>시작 시간</label>
          <input
            type='datetime-local'
            value={startLocal}
            onChange={(e) => setStartLocal(e.target.value)}
            className='w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/60 focus:border-slate-500'
          />
        </div>
        <div className='flex-1'>
          <label className='block text-sm mb-1 text-slate-300'>종료 시간</label>
          <input
            type='datetime-local'
            value={endLocal}
            onChange={(e) => setEndLocal(e.target.value)}
            className='w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/60 focus:border-slate-500'
          />
        </div>

        <button
          onClick={() => kpiQ.refetch()}
          className='inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 h-[42px]'
          title='새로고침'
        >
          <RefreshCw
            className={kpiQ.isFetching ? 'animate-spin w-4 h-4' : 'w-4 h-4'}
          />
          조회
        </button>
      </div>

      {/* 상태 텍스트 */}
      <div className='text-xs text-slate-400'>
        범위: {startISO} ~ {endISO} {kpiQ.isFetching ? '(불러오는 중…)' : ''}
      </div>

      {/* 카드 */}
      {kpiQ.error ? (
        <div className='rounded-xl border border-red-700 bg-red-900/20 text-red-200 p-4 text-sm'>
          KPI 데이터를 불러오지 못했습니다.
        </div>
      ) : (
        <KpiCards kpi={kpiQ.data ?? null} />
      )}
    </section>
  );
}
