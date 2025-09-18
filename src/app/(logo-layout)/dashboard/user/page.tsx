'use client';

import Link from 'next/link';

export default function UserTxManagementPage() {
  return (
    <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
      <h2 className='text-xl font-semibold text-slate-200 mb-4'>
        사용자거래관리
      </h2>
      <p className='text-slate-300'>
        기능 준비 중입니다. 우선{' '}
        <Link href='/user' className='text-sky-400 underline'>
          /user
        </Link>
        로 이동해 주세요.
      </p>
    </div>
  );
}
