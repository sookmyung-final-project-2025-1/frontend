'use client';

import TransactionDetailView from '@/components/transactions/detail/TransactionDetilView';
import { useTransactionDetail } from '@/hooks/queries/transaction/useTransactionDetail';

export default function TransactionDetailPage({
  params,
}: {
  params: { transactionId: string };
}) {
  const { transactionId } = params;

  const { data, isLoading, error } = useTransactionDetail(transactionId);

  const formatAmount = (amount?: number) =>
    typeof amount === 'number'
      ? new Intl.NumberFormat('ko-KR', {
          style: 'currency',
          currency: 'KRW',
        }).format(amount)
      : '-';

  const formatDate = (s?: string) => {
    if (!s) return '-';
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('ko-KR');
  };

  return (
    <div className='space-y-6 bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-slate-100'>거래 상세</h1>
        <div className='text-sm text-slate-400'>
          Transaction ID: {transactionId}
        </div>
      </div>

      <TransactionDetailView
        data={data}
        isLoading={isLoading}
        error={!!error}
        formatAmount={formatAmount}
        formatDate={formatDate}
      />
    </div>
  );
}
