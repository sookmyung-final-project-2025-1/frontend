'use client';

import { useGetReportById } from '@/hooks/queries/report/useGetReportById';
import { useSetReportPriority } from '@/hooks/queries/report/useSetReportPriority';
import { PriorityLevel } from '@/types/report-types';
import { Flag, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type Props = {
  reportId: number | null;
  onClose: () => void;
  onChanged?: () => void;
};

const PRIORITY: PriorityLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function ReportDetailDrawer({
  reportId,
  onClose,
  onChanged,
}: Props) {
  const open = reportId != null;
  const { data, isLoading } = useGetReportById(reportId);

  // ✅ PriorityLevel로 상태 선언
  const [newPriority, setNewPriority] = useState<PriorityLevel>('MEDIUM');
  const setPriorityM = useSetReportPriority();

  useEffect(() => {
    if (data?.priority) setNewPriority(data.priority);
  }, [data?.priority]);

  const setPriority = async () => {
    if (!reportId) return;
    await setPriorityM.mutateAsync({ reportId, priority: newPriority });
    onChanged?.();
  };

  return (
    <div
      className={`fixed inset-y-0 right-0 w-full sm:w-[480px] bg-slate-900 border-l border-slate-800 transform transition-transform duration-200 ${
        open ? 'translate-x-0' : 'translate-x-full'
      } z-50`}
      aria-hidden={!open}
    >
      <div className='flex items-center justify-between p-4 border-b border-slate-800'>
        <div className='flex items-center gap-2'>
          <Flag className='w-5 h-5 text-slate-300' />
          <h3 className='text-lg font-semibold'>신고 상세</h3>
        </div>
        <button
          onClick={onClose}
          className='p-2 rounded-lg hover:bg-slate-800 text-slate-300'
          aria-label='close'
        >
          <X className='w-5 h-5' />
        </button>
      </div>

      <div className='p-4 space-y-4 overflow-y-auto h-[calc(100%-64px)]'>
        {!data && isLoading && (
          <div className='text-slate-400'>불러오는 중...</div>
        )}

        {data && (
          <>
            <KV label='Report ID' value={data.reportId} />
            <KV label='Transaction ID' value={data.transactionId} />
            <KV label='Status' value={data.status} />
            <KV label='Reported By' value={data.reportedBy} />
            <KV
              label='Fraud Confirmed'
              value={data.isFraudConfirmed ? 'Yes' : 'No'}
            />
            <KV label='Reported At' value={fmt(data.reportedAt)} />
            <KV label='Reviewed At' value={fmt(data.reviewedAt)} />
            <KV label='Reason' value={data.reason} />
            <KV label='Description' value={data.description} />

            <div className='border-t border-slate-800 pt-3'>
              <div className='mb-2 text-sm text-slate-400'>거래 상세</div>
              <div className='text-sm text-slate-300 grid grid-cols-2 gap-2'>
                <KV
                  label='amount'
                  value={data.transactionDetails?.amount}
                  inline
                />
                <KV
                  label='merchant'
                  value={data.transactionDetails?.merchant}
                  inline
                />
                <KV
                  label='userId'
                  value={data.transactionDetails?.userId}
                  inline
                />
                <KV
                  label='transactionTime'
                  value={fmt(data.transactionDetails?.transactionTime)}
                  inline
                />
              </div>
            </div>

            <div className='border-t border-slate-800 pt-3 space-y-2'>
              <div className='text-sm text-slate-400'>우선순위 변경</div>
              <div className='flex items-center gap-2'>
                <select
                  className='bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100'
                  value={newPriority}
                  onChange={(e) =>
                    setNewPriority(e.target.value as PriorityLevel)
                  }
                >
                  {PRIORITY.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <button
                  onClick={setPriority}
                  className='px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700'
                >
                  적용
                </button>
              </div>
            </div>

            {data.message && (
              <div className='text-xs text-slate-400 border-t border-slate-800 pt-3'>
                서버 메시지: {data.message}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// 👉 value를 ReactNode 허용으로 느슨하게 해서 'unknown' 에러 방지
function KV({
  label,
  value,
  inline,
}: {
  label: string;
  value?: React.ReactNode;
  inline?: boolean;
}) {
  return (
    <div className={`text-sm ${inline ? 'flex items-center gap-2' : ''}`}>
      <span className='text-slate-400'>{label}:</span>{' '}
      <span className='text-slate-200'>{value ?? '-'}</span>
    </div>
  );
}

function fmt(iso?: string | null) {
  if (!iso) return '-';
  const t = Date.parse(iso);
  return Number.isFinite(t) ? new Date(t).toLocaleString('ko-KR') : iso;
}
