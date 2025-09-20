'use client';

import { useEffect, useState } from 'react';

export type ReportFiltersValue = {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
  reportedBy: string;
  startDate: string; // 'YYYY-MM-DD' or ''
  endDate: string; // 'YYYY-MM-DD' or ''
};

type Props = {
  value: ReportFiltersValue;
  onChange: (v: ReportFiltersValue) => void;
  isLoading?: boolean;
};

const STATUS_OPTIONS: ReportFiltersValue['status'][] = [
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
];

export default function ReportFilters({ value, onChange, isLoading }: Props) {
  const [local, setLocal] = useState<ReportFiltersValue>(value);

  useEffect(() => setLocal(value), [value]);

  const apply = () => onChange(local);
  const reset = () =>
    onChange({
      status: 'PENDING',
      reportedBy: '',
      startDate: '',
      endDate: '',
    });

  return (
    <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
      {/* 상태 */}
      <div>
        <label className='block text-xs mb-1 text-slate-400'>상태</label>
        <select
          className='w-full h-[40px] rounded-lg bg-slate-800 border border-slate-700 px-2 text-slate-100'
          value={local.status}
          onChange={(e) =>
            setLocal((p) => ({
              ...p,
              status: e.target.value as ReportFiltersValue['status'],
            }))
          }
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* 신고자 */}
      <div>
        <label className='block text-xs mb-1 text-slate-400'>신고자</label>
        <input
          className='w-full h-[40px] rounded-lg bg-slate-800 border border-slate-700 px-3 text-slate-100'
          placeholder='이메일/ID'
          value={local.reportedBy}
          onChange={(e) =>
            setLocal((p) => ({ ...p, reportedBy: e.target.value }))
          }
        />
      </div>

      {/* 시작일 */}
      <div>
        <label className='block text-xs mb-1 text-slate-400'>시작일</label>
        <input
          type='date'
          className='w-full h-[40px] rounded-lg bg-slate-800 border border-slate-700 px-3 text-slate-100'
          value={local.startDate}
          onChange={(e) =>
            setLocal((p) => ({ ...p, startDate: e.target.value }))
          }
        />
      </div>

      {/* 종료일 */}
      <div>
        <label className='block text-xs mb-1 text-slate-400'>종료일</label>
        <input
          type='date'
          className='w-full h-[40px] rounded-lg bg-slate-800 border border-slate-700 px-3 text-slate-100'
          value={local.endDate}
          onChange={(e) => setLocal((p) => ({ ...p, endDate: e.target.value }))}
        />
      </div>

      {/* 버튼 */}
      <div className='md:col-span-4 flex justify-end gap-2 mt-1'>
        <button
          onClick={reset}
          disabled={isLoading}
          className='px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 disabled:opacity-50'
        >
          초기화
        </button>
        <button
          onClick={apply}
          disabled={isLoading}
          className='px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
        >
          적용
        </button>
      </div>
    </div>
  );
}
