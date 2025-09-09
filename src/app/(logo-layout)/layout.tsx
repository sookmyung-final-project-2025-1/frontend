'use client';

import Alert from '@/components/ui/Alert';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import '../globals.css';

export default function LogoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isFraud, setIsFraud] = useState<boolean>(false);

  useEffect(() => {
    setTimeout(() => {
      setIsFraud(true);
    }, 5000);
  }, []);

  return (
    <div className='min-h-dvh bg-gradient-to-b from-[#F6F9FF] via-white to-[#EFF6FF]'>
      <div className='w-[80vw] mx-auto relative'>
        <Alert isAlert={isFraud} setAlert={setIsFraud} id={1} />
        <header className='absolute top-[30px] inset-x-0 w-[80vw] mx-auto'>
          <Link
            href='/dashboard'
            className='w-fit flex justify-between items-center'
          >
            <Image
              src='/assets/images/loho.svg'
              alt='로고 이미지'
              width={180}
              height={48}
            />
          </Link>
        </header>
        <main className='pt-[100px] flex justify-center items-center'>
          {children}
        </main>
      </div>
    </div>
  );
}
