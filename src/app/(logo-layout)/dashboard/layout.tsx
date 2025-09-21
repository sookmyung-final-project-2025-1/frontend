// src/app/(logo-layout)/dashboard/layout.tsx
'use client';

import DashboardTabs from '@/components/ui/DashboardTabs';
import AppProviders from '@/contexts/AppProviders';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

/**
 * 쿠키 삭제 유틸 (path=/ 로 지우고, 만약을 위해 expires도 추가)
 */
function deleteCookie(name: string) {
  // 표준 만료
  document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; path=/; SameSite=Lax`;
  // 레거시 호환
  document.cookie = `${encodeURIComponent(name)}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // 탭 전체에서 공유할 초기 범위 (필요 시 페이지에서 Context API로 변경 가능)
  const initialTimeRange = {
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date().toISOString(),
  };

  const [isFraud, setIsFraud] = useState<boolean>(false);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setIsFraud(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      // (선택) 서버 세션도 종료하고 싶다면 주석 해제
      // await fetch('/api/logout', { method: 'POST', credentials: 'include' });

      // 토큰/상태 삭제
      deleteCookie('accessToken');
      deleteCookie('refreshToken'); // 사용하는 경우
      try {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } catch {}

      // (선택) 기타 클라이언트 상태 초기화가 필요하면 여기에서 처리

      // 로그인 페이지로 이동
      router.replace('/signin');
    } catch (e) {
      console.error(e);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <AppProviders
      initialConfidenceRange={{ ...initialTimeRange, period: 'hourly' }}
      initialKpiRange={initialTimeRange}
      initialSeriesProbRange={initialTimeRange}
    >
      <div className='bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 min-w-screen min-h-screen pb-12 overflow-x-hidden'>
        <div className='w-[80vw] mx-auto relative'>
          <header className='sticky top-0 z-10 h-[72px] w-full bg-white/5 backdrop-blur pt-[15px] mb-[20px] flex justify-between items-center px-1 sm:px-0'>
            <Link
              href='/dashboard'
              className='w-fit h-full flex items-center gap-2'
            >
              <Image
                src='/assets/images/header_logo.png'
                alt='로고 이미지'
                width={180}
                height={48}
                priority
              />
            </Link>

            <button
              type='button'
              onClick={handleLogout}
              disabled={loggingOut}
              aria-busy={loggingOut}
              className={`inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2
                text-sm font-medium text-slate-200 hover:bg-slate-800/60
                disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {loggingOut ? (
                <>
                  <svg
                    className='animate-spin h-4 w-4'
                    viewBox='0 0 24 24'
                    aria-hidden='true'
                  >
                    <circle
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                      fill='none'
                      className='opacity-25'
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z'
                    />
                  </svg>
                  로그아웃 중…
                </>
              ) : (
                <>로그아웃</>
              )}
            </button>
          </header>

          {/* 상단 공용 탭 */}
          <DashboardTabs />

          {/* 각 탭 페이지 콘텐츠 */}
          {children}
        </div>
      </div>
    </AppProviders>
  );
}
