'use client';

import { useAlarm } from '@/hooks/queries/dashboard/useAlarm';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import AlarmsDrawer from '../dashboard/alarms/AlarmDrawer';

export function cn(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(' ');
}

const TABS = [
  { label: '대시보드', href: '/dashboard' },
  { label: '모델', href: '/dashboard/model' },
  { label: '거래', href: '/dashboard/transactions' },
  { label: '스트리밍', href: '/dashboard/streaming' },
  { label: '사용자거래관리', href: '/dashboard/user' },
];

export default function DashboardTabs() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: alarms = [] } = useAlarm(10); // 최근 10건
  const alarmCount = alarms.length;

  return (
    <>
      <nav
        role='tablist'
        className='flex gap-2 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40 p-2 mb-5'
      >
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              role='tab'
              aria-selected={active}
              className={cn(
                'shrink-0 rounded-lg px-4 py-2 text-sm transition',
                active
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-300 hover:bg-slate-800/60'
              )}
            >
              {tab.label}
            </Link>
          );
        })}

        {/* 오른쪽 정렬용 공간 */}
        <div className='ml-auto' />

        {/* 알람 버튼 (모달 토글) */}
        <button
          type='button'
          onClick={() => setOpen(true)}
          className='shrink-0 rounded-lg px-3 py-2 text-sm transition flex items-center gap-2 text-slate-300 hover:bg-slate-800/60'
          aria-label='알람 열기'
        >
          <Bell className='w-4 h-4' />
          <span className='hidden sm:inline'>알람</span>
          {alarmCount > 0 && (
            <span className='ml-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[13px] font-medium px-1.5 py-0.5'>
              {alarmCount}
            </span>
          )}
        </button>
      </nav>

      {/* 우측 슬라이드 패널 */}
      <AlarmsDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
