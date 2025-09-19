'use client';

import { useRouter } from 'next/navigation';

type Tx = {
  id: string | number;
  userId: string;
  amount: number;
  merchant: string;
  merchantCategory?: string;
  category?: string; // 백엔드가 category로 줄 수도 있어 대비
  isFraud: boolean;
  transactionTime?: string;
  createdAt?: string;
  updatedAt?: string;
  externalTransactionId: string;
};

type Props = {
  data: Tx[];
  isLoading: boolean;
  error: boolean;
  formatAmount: (n: number) => string;
  /** 호출 시 (t.transactionTime || t.createdAt || t.updatedAt)를 넘기도록 page.tsx에서 캡슐화 */
  formatDate: (t: Tx) => string;
};

export default function TransactionsTable({
  data,
  isLoading,
  error,
  formatAmount,
  formatDate,
}: Props) {
  const router = useRouter();

  return (
    <div className='rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden min-h-[220px]'>
      {error ? (
        <div className='flex items-center justify-center py-16 text-red-400'>
          데이터를 불러오지 못했습니다.
        </div>
      ) : isLoading && data.length === 0 ? (
        <div className='flex items-center justify-center py-16 text-slate-400'>
          불러오는 중…
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-slate-800'>
            <thead className='bg-slate-900'>
              <tr>
                {[
                  '거래 ID',
                  '사용자 ID',
                  '가맹점',
                  '카테고리',
                  '금액',
                  '사기 여부',
                  '거래 시간',
                ].map((h) => (
                  <th
                    key={h}
                    className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400'
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className='divide-y divide-slate-800'>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className='px-6 py-12 text-center text-slate-400'
                  >
                    거래 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                data.map((t, i) => (
                  <tr
                    key={String(t.id) ?? i}
                    className='hover:bg-slate-800/50 cursor-pointer'
                    onClick={() =>
                      router.push(
                        `/dashboard/transactions/${t.externalTransactionId}`
                      )
                    }
                  >
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-100'>
                      {t.id}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-300'>
                      {t.userId}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-300'>
                      {t.merchant}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-300'>
                      {t.merchantCategory ?? t.category ?? '—'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-100'>
                      {Number.isFinite(t.amount as any)
                        ? formatAmount(t.amount)
                        : '—'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          t.isFraud
                            ? 'bg-[#F8717126] text-[#FCA5A5]' // red-400/15, red-300 (hex)
                            : 'bg-[#4ADE8026] text-[#86EFAC]' // green-400/15, green-300 (hex)
                        }`}
                      >
                        {t.isFraud ? '사기' : '정상'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-400'>
                      {formatDate(t)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
