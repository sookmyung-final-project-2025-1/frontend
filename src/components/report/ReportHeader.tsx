'use client';

import { useTransactionDetail } from '@/hooks/queries/transaction/useTransactionDetail';

const CARDSTYLE =
  'rounded-2xl border border-black/5 bg-white/70 backdrop-blur-sm shadow-sm';

export default function ReportHeader({ paymentId }: { paymentId: string }) {
  const { data } = useTransactionDetail(paymentId);

  return (
    <section className={`${CARDSTYLE} p-6 flex items-center justify-between`}>
      <div>
        <h1 className='text-2xl font-semibold text-[#0E2975]'>
          거래 Id : {data?.id}
        </h1>
        <p className='text-gray-70 text-sm'>{data?.transactionTime}</p>
      </div>
      <div className='flex gap-2'>
        <button className='rounded-lg border px-3 py-2 hover:bg-black/5'>
          이메일 전송하기
        </button>
        <button className='rounded-lg bg-[#0E2975] text-[#ffffff] px-3 py-2 hover:opacity-90'>
          PDF 다운로드
        </button>
      </div>
    </section>
  );
}
