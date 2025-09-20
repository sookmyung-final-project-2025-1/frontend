'use client';

import { ReportItem } from '@/types/report-types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  rows: ReportItem[];
  loading: boolean;
  page: number;
  size: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRowClick: (id: number) => void;
};

export default function ReportsTable({
  rows,
  loading,
  page,
  size,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onRowClick,
}: Props) {
  return (
    <div className='rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-slate-800'>
          <thead className='bg-slate-900'>
            <tr>
              {[
                'ID',
                '거래ID',
                '상태',
                '우선순위',
                '신고자',
                '사기확정',
                '신고일',
              ].map((h) => (
                <th
                  key={h}
                  className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400'
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-800'>
            {loading && rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className='px-6 py-12 text-center text-slate-400'
                >
                  불러오는 중...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className='px-6 py-12 text-center text-slate-400'
                >
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.reportId}
                  className='hover:bg-slate-800/40 cursor-pointer'
                  onClick={() => onRowClick(r.reportId)}
                >
                  <td className='px-4 py-3 text-sm text-slate-200'>
                    {r.reportId}
                  </td>
                  <td className='px-4 py-3 text-sm text-slate-300'>
                    {r.transactionId}
                  </td>
                  <td className='px-4 py-3 text-sm'>
                    <Badge value={r.status} />
                  </td>
                  <td className='px-4 py-3 text-sm'>
                    <span className='px-2 py-1 rounded bg-[#1f2937] text-slate-200'>
                      {r.priority ?? '-'}
                    </span>
                  </td>
                  <td className='px-4 py-3 text-sm text-slate-300'>
                    {r.reportedBy}
                  </td>
                  <td className='px-4 py-3 text-sm'>
                    {r.isFraudConfirmed ? (
                      <span
                        className='px-2 py-1 rounded'
                        style={{ backgroundColor: '#14532d', color: '#86efac' }}
                      >
                        확정
                      </span>
                    ) : (
                      <span
                        className='px-2 py-1 rounded'
                        style={{ backgroundColor: '#3f1d1d', color: '#fca5a5' }}
                      >
                        미확정
                      </span>
                    )}
                  </td>
                  <td className='px-4 py-3 text-sm text-slate-400'>
                    {formatDate(r.reportedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 하단: 페이지네이션 + size */}
      <div className='flex items-center justify-between p-3'>
        <div className='flex items-center gap-2 text-sm text-slate-400'>
          <span>페이지당</span>
          <select
            className='bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100'
            value={size}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}개
              </option>
            ))}
          </select>
        </div>

        <div className='flex items-center gap-1'>
          <button
            className='p-2 rounded-lg border border-slate-700 text-slate-200 disabled:opacity-50'
            onClick={() => onPageChange(0)}
            disabled={page <= 0}
            aria-label='first'
          >
            «
          </button>
          <button
            className='p-2 rounded-lg border border-slate-700 text-slate-200 disabled:opacity-50'
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 0}
            aria-label='prev'
          >
            <ChevronLeft className='w-4 h-4' />
          </button>
          <span className='px-2 text-slate-300 text-sm'>
            {page + 1} / {Math.max(1, totalPages)}
          </span>
          <button
            className='p-2 rounded-lg border border-slate-700 text-slate-200 disabled:opacity-50'
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            aria-label='next'
          >
            <ChevronRight className='w-4 h-4' />
          </button>
          <button
            className='p-2 rounded-lg border border-slate-700 text-slate-200 disabled:opacity-50'
            onClick={() => onPageChange(Math.max(0, totalPages - 1))}
            disabled={page >= totalPages - 1}
            aria-label='last'
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}

function Badge({ value }: { value: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    PENDING: { bg: '#3f1d1d', fg: '#fca5a5', label: '대기' },
    UNDER_REVIEW: { bg: '#2b2f3a', fg: '#93c5fd', label: '검토중' },
    APPROVED: { bg: '#0f2f24', fg: '#86efac', label: '승인' },
    REJECTED: { bg: '#3f1d1d', fg: '#fecaca', label: '거절' },
  };
  const c = map[value] ?? { bg: '#1f2937', fg: '#cbd5e1', label: value };
  return (
    <span
      className='px-2 py-1 rounded text-xs'
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {c.label}
    </span>
  );
}

function formatDate(iso?: string | null) {
  if (!iso) return '-';
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  return new Date(t).toLocaleString('ko-KR');
}
