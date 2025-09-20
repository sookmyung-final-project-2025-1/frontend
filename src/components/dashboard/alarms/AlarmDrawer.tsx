'use client';

import { useAlarm } from '@/hooks/queries/dashboard/useAlarm';
import { AlertTriangle, Bell, CheckCircle2, Info, X } from 'lucide-react';
import Link from 'next/link';

function SeverityIcon({ severity }: { severity: string }) {
  const s = severity?.toLowerCase?.() ?? '';
  if (s === 'critical' || s === 'high')
    return <AlertTriangle className='w-4 h-4 text-red-400' />;
  if (s === 'medium')
    return <AlertTriangle className='w-4 h-4 text-orange-400' />;
  if (s === 'low') return <Info className='w-4 h-4 text-sky-400' />;
  return <CheckCircle2 className='w-4 h-4 text-slate-400' />;
}

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

export default function AlarmsDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data = [], isLoading, error } = useAlarm(20);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity pb-[20px] ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md transform bg-slate-900 border-l border-slate-800 transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role='dialog'
        aria-modal='true'
      >
        {/* 전체를 세로 플렉스 레이아웃으로 */}
        <div className='flex h-full flex-col'>
          {/* Header */}
          <div className='flex items-center justify-between p-4 border-b border-slate-800 flex-none'>
            <div className='flex items-center gap-2'>
              <Bell className='w-5 h-5 text-slate-300' />
              <h3 className='text-slate-100 font-semibold'>알람</h3>
            </div>
            <button
              onClick={onClose}
              className='p-2 rounded-md hover:bg-slate-800 text-slate-300'
              aria-label='닫기'
            >
              <X className='w-4 h-4' />
            </button>
          </div>

          {/* Scroll area: flex-1 + overflow-y-auto + 충분한 bottom padding */}
          <div className='flex-1 overflow-y-auto p-4 space-y-3 pb-24 [padding-bottom:calc(env(safe-area-inset-bottom)+6rem)]'>
            {isLoading && (
              <div className='text-slate-400 text-center py-8'>
                불러오는 중…
              </div>
            )}
            {error && (
              <div className='text-red-400 text-center py-8'>
                알람을 불러오지 못했습니다.
              </div>
            )}
            {!isLoading && !error && data.length === 0 && (
              <div className='text-slate-400 text-center py-8'>
                표시할 알람이 없습니다.
              </div>
            )}

            <ul className='divide-y divide-slate-800'>
              {data.map((a, i) => (
                <li
                  key={`${a.timestamp}-${i}`}
                  className='py-3 flex items-start gap-3'
                >
                  <SeverityIcon severity={a.severity} />
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <span className='text-xs rounded-full border border-slate-700 px-2 py-0.5 text-slate-300'>
                        {a.severity.toUpperCase()}
                      </span>
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

          {/* Footer */}
          <div className='p-4 border-t border-slate-800 flex items-center justify-between flex-none'>
            <span className='text-xs text-slate-400'>
              최근 {data.length}건 표시
            </span>
            <Link
              href='/dashboard/alarms'
              className='text-slate-100 text-sm px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700'
              onClick={onClose}
            >
              모두 보기
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
