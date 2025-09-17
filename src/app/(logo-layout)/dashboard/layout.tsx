'use client';

import Alert from '@/components/ui/Alert';
import { Link } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isFraud, setIsFraud] = useState<boolean>(false);

  useEffect(() => {
    setTimeout(() => {
      setIsFraud(true);
    }, 2000);
  }, []);

  return (
    <div className=' bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100'>
      <div className='w-[80vw] mx-auto relative'>
        <Alert
          isAlert={isFraud}
          setAlert={setIsFraud}
          id={'c1b1ea52-ecfc-4ec6-8861-8f57e04da422'}
        />
        <header className='sticky top-0 z-10 h-[72px] w-full bg-white/50 backdrop-blur pt-[15px]'>
          <Link
            href='/dashboard'
            className='w-fit h-full flex justify-between items-center'
          >
            <img
              src='/assets/images/logo.svg'
              alt='로고 이미지'
              width={180}
              height={48}
            />
          </Link>
        </header>
        <main className='w-full pt-[30px] flex justify-center items-center'>
          {children}
        </main>
      </div>
    </div>
  );
}
