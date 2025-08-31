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
            src='/assets/images/loho.svg'
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
      <div className='flex flex-col gap-[40px] items-center'>
        <Login />
        <div className='flex justify-between gap-[30px] w-fit text-gray-90 text-[15px]'>
          <Link href={'/find'}>이메일/비밀번호 찾기</Link>
          <div className='w-[1px] h-[20px] bg-[#BDBEBE]'></div>
          <Link href={'/signup'}>회원가입</Link>
        </div>
      </div>
    </div>
  );
}
