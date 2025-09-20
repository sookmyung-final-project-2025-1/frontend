'use client';

import PageSizeSelector from '@/components/transactions/PageSizeSelector';
import TransactionFilters from '@/components/transactions/TransactionFilters';
import TransactionsTable from '@/components/transactions/TransactionsTable';
import { useAllTransaction } from '@/hooks/queries/transaction/useAllTransaction';
import { TransactionRequestType } from '@/types/transaction.schema';
import { useState } from 'react';

export default function TransactionPage() {
  // 필터 상태
  const [filters, setFilters] = useState<TransactionRequestType>({
    userId: '',
    merchant: '',
    category: '',
    minAmount: undefined,
    maxAmount: undefined,
    isFraud: undefined,
    startTime: '',
    endTime: '',
    pageable: { page: 1, size: 10, sort: ['userId'] },
  });

  const {
    data: transactionData,
    isLoading,
    error,
  } = useAllTransaction(filters);

  // 공통 핸들러
  const handleFilterChange = (
    key: keyof TransactionRequestType,
    value: any
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      pageable: { ...prev.pageable, page: 0 }, // 필터 변경 시 첫 페이지
    }));
  };

  const handlePageSizeChange = (size: number) => {
    setFilters((prev) => ({
      ...prev,
      pageable: { ...prev.pageable, page: 0, size },
    }));
  };

  // 포맷터
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

  // ✅ 응답 정규화: 배열/페이지 객체 모두 지원
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

      {/* 필터 */}
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
            pageable: { page: 0, size: 10, sort: ['createdAt,desc'] },
          })
        }
      />

      {/* 페이지 사이즈 + 테이블 (이 영역만 로딩/에러 표시) */}
      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
        <PageSizeSelector
          size={filters.pageable.size}
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

      {/* 페이지네이션은 별도 필요 시 추가 */}
    </div>
  );
}
