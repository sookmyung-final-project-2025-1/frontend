'use client';

import DashboardTabs from '@/components/ui/DashboardTabs';
import AppProviders from '@/contexts/AppProviders';
import { Link } from 'lucide-react';
import Image from 'next/image';
import { ReactNode, useEffect, useState } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // 탭 전체에서 공유할 초기 범위 (필요 시 페이지에서 Context API로 변경 가능)
  const initialTimeRange = {
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date().toISOString(),
  };

  const [isFraud, setIsFraud] = useState<boolean>(false);

  useEffect(() => {
    setTimeout(() => {
      setIsFraud(true);
    }, 2000);
  }, []);

  return (
    <AppProviders
      initialConfidenceRange={{ ...initialTimeRange, period: 'hourly' }}
      initialKpiRange={initialTimeRange}
      initialSeriesProbRange={initialTimeRange}
    >
      <div className='bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 min-w-screen pb-12'>
        <div className='w-[80vw] mx-auto relative'>
          <header className='sticky top-0 z-10 h-[72px] w-full bg-white/50 backdrop-blur pt-[15px]'>
            <Link
              href='/dashboard'
              className='w-fit h-full flex justify-between items-center'
            >
              <Image
                src='/assets/images/logo.svg'
                alt='로고 이미지'
                width={180}
                height={48}
              />
            </Link>
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
