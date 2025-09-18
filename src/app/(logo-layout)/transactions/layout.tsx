'use client';

import { Link } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function TransactionLayout({
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
        <main className='w-full pt-[30px] flex justify-center items-center'>
          {children}
        </main>
      </div>
    </div>
  );
}
