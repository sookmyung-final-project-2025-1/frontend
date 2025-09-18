'use client';

import { useAlarm } from '@/hooks/queries/dashboard/useAlarm';
import { AlertTriangle, Bell, CheckCircle2, Info } from 'lucide-react';

type BadgeProps = { severity: string };
const SeverityBadge = ({ severity }: BadgeProps) => {
  const s = severity?.toLowerCase?.() ?? '';
  const map = {
    critical: 'bg-red-500/15 text-red-300 border-red-500/40',
    high: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
    medium: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
    low: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
    info: 'bg-slate-500/15 text-slate-300 border-slate-500/40',
  } as const;
  const cls =
    map[s as keyof typeof map] ??
    'bg-slate-500/15 text-slate-300 border-slate-500/40';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${cls}`}
    >
      {severity.toUpperCase()}
    </span>
  );
};

const SeverityIcon = ({ severity }: { severity: string }) => {
  const s = severity?.toLowerCase?.() ?? '';
  if (s === 'critical' || s === 'high') {
    return <AlertTriangle className='w-4 h-4 text-red-400' />;
  }
  if (s === 'medium') {
    return <AlertTriangle className='w-4 h-4 text-orange-400' />;
  }
  if (s === 'low') {
    return <Info className='w-4 h-4 text-sky-400' />;
  }
  return <CheckCircle2 className='w-4 h-4 text-slate-400' />;
};

function toLocal(ts: string) {
  try {
    return new Date(ts).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return ts;
  }
}

export default function AlarmsPanel() {
  // 원하는 수만큼 표시 (예: 50)
  const { data = [], isLoading, error } = useAlarm(50);

  return (
    <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4'>
      <header className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Bell className='w-5 h-5 text-slate-300' />
          <h3 className='text-slate-200 font-semibold'>알람</h3>
        </div>
        <span className='text-xs text-slate-400'>
          총 <b className='text-slate-200'>{data.length}</b>건
        </span>
      </header>

      {isLoading && (
        <div className='p-6 text-slate-400 text-center'>불러오는 중…</div>
      )}

      {error && (
        <div className='p-6 text-red-400 text-center'>
          알람을 불러오지 못했습니다.
        </div>
      )}

      {!isLoading && !error && data.length === 0 && (
        <div className='p-6 text-slate-400 text-center'>
          표시할 알람이 없습니다.
        </div>
      )}

      {/* 리스트 */}
      <ul className='divide-y divide-slate-800'>
        {data.map((a, idx) => (
          <li
            key={`${a.timestamp}-${idx}`}
            className='py-3 flex items-start gap-3'
          >
            <div className='mt-0.5'>
              <SeverityIcon severity={a.severity} />
            </div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 flex-wrap'>
                <SeverityBadge severity={a.severity} />
                <span className='text-slate-100 font-medium truncate'>
                  {a.type}
                </span>
                <span className='text-slate-400 text-xs'>
                  {toLocal(a.timestamp)}
                </span>
              </div>
              <p className='text-slate-300 mt-1 whitespace-pre-wrap break-words'>
                {a.message}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
