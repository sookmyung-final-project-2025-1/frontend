// src/app/(logo-layout)/dashboard/transactions/page.tsx (경로는 네 구조에 맞게)
'use client';

import PageSizeSelector from '@/components/transactions/PageSizeSelector';
import TransactionFilters from '@/components/transactions/TransactionFilters';
import TransactionsTable from '@/components/transactions/TransactionsTable';
import { useAllTransaction } from '@/hooks/queries/transaction/useAllTransaction';
import { TransactionRequestType } from '@/types/transaction.schema';
import { useCallback, useState } from 'react';

export default function TransactionPage() {
  const [filters, setFilters] = useState<TransactionRequestType>({
    userId: '',
    merchant: '',
    category: '',
    minAmount: undefined,
    maxAmount: undefined,
    isFraud: undefined,
    startTime: '',
    endTime: '',
    // ✅ 기본 정렬은 없으므로 빈 배열
    pageable: { page: 0, size: 10, sort: [] },
  });

  const {
    data: transactionData,
    isLoading,
    error,
  } = useAllTransaction(filters);

  const handleFilterChange = (
    key: keyof TransactionRequestType,
    value: any
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      pageable: { ...prev.pageable!, page: 0 },
    }));
  };

  const handlePageableChange = useCallback(
    (
      updater: (
        p: NonNullable<TransactionRequestType['pageable']>
      ) => NonNullable<TransactionRequestType['pageable']>
    ) => {
      setFilters((prev) => ({
        ...prev,
        pageable: updater(prev.pageable ?? { page: 0, size: 10, sort: [] }),
      }));
    },
    []
  );

  const handlePageSizeChange = (size: number) => {
    handlePageableChange((p) => ({ ...p, page: 0, size }));
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('ko-KR');
  };

  const transactions: any[] = Array.isArray(transactionData)
    ? transactionData
    : ((transactionData as any)?.content ?? []);

  const totalElements: number = Array.isArray(transactionData)
    ? transactionData.length
    : ((transactionData as any)?.totalElements ?? transactions.length);

  return (
    <div className='space-y-6 bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-slate-100'>거래 내역</h1>
        <div className='text-sm text-slate-400'>총 {totalElements}건</div>
      </div>

      <TransactionFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={() =>
          setFilters({
            userId: '',
            merchant: '',
            category: '',
            minAmount: undefined,
            maxAmount: undefined,
            isFraud: undefined,
            startTime: '',
            endTime: '',
            pageable: { page: 0, size: 10, sort: [] }, // ✅ 리셋도 빈 배열
          })
        }
        pageable={filters.pageable!}
        onPageableChange={handlePageableChange}
        showPreview={false} // 필요 시 true
      />

      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
        <PageSizeSelector
          size={filters.pageable?.size ?? 10}
          onChange={handlePageSizeChange}
        />

        <TransactionsTable
          data={transactions}
          isLoading={isLoading}
          error={!!error}
          formatAmount={formatAmount}
          formatDate={(t) =>
            formatDate(t.transactionTime || t.createdAt || t.updatedAt)
          }
        />
      </div>
    </div>
  );
}
