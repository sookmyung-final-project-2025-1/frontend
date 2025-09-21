'use client';

import Login from '@/components/Login';
import Image from 'next/image';
import Link from 'next/link';

export default function SignIn() {
  return (
    <div className='w-[395px] flex flex-col items-center gap-[50px]'>
      <div className='flex flex-col items-center'>
        <div className='relative w-[380px] h-[130px]'>
          <Image
            src='/assets/images/logo.svg'
            alt='로고 이미지'
            fill
            className='object-contain'
            unoptimized
            priority
          />
        </div>
        <div className='text-gray-30 text-[18px] font-semibold'>
          기업을 위한 사기 거래 탐지 시스템 결제지킴이
        </div>
      </div>
      <div className='flex flex-col gap-[20px] items-center'>
        <Login />
        <hr className='w-full border-0 border-t border-[#BDBEBE]' />
        <Link
          href={'/signup'}
          className='flex justify-between w-fit text-gray-90 text-[15px]'
        >
          회원가입
        </Link>
      </div>
    </div>
  );
}
