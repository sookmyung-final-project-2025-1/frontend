'use client';

import { useAllTransaction } from '@/hooks/queries/transaction/useAllTransaction';
import { TransactionRequestType } from '@/types/transaction.schema';
import { useState } from 'react';

export default function TransactionPage() {
  // 필터 상태 관리
  const [filters, setFilters] = useState<TransactionRequestType>({
    userId: '',
    merchant: '',
    category: '',
    minAmount: undefined,
    maxAmount: undefined,
    isFraud: undefined,
    startTime: '',
    endTime: '',
    pageable: {
      page: 1,
      size: 10,
      sort: ['userId'],
    },
  });

  const {
    data: transactionData,
    isLoading,
    error,
  } = useAllTransaction(filters);

  // 필터 값 변경 핸들러
  const handleFilterChange = (
    key: keyof TransactionRequestType,
    value: any
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      pageable: {
        ...prev.pageable,
        page: 0, // 필터 변경 시 첫 페이지로
      },
    }));
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      pageable: {
        ...prev.pageable,
        page,
      },
    }));
  };

  // 페이지 사이즈 변경 핸들러
  const handlePageSizeChange = (size: number) => {
    setFilters((prev) => ({
      ...prev,
      pageable: {
        ...prev.pageable,
        page: 0,
        size,
      },
    }));
  };

  // 금액 포맷팅
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-lg'>로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-red-500'>데이터를 불러오는데 실패했습니다.</div>
      </div>
    );
  }

  const transactions = filters.pageable?.sort || [];
  const curentElements = filters.pageable?.size || 0;
  const currentPage = filters.pageable?.page || 1;

  return (
    <div className='p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>거래 내역</h1>
        <div className='text-sm text-gray-500'>
          총 {transactionData?.length}건
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className='bg-white rounded-lg shadow p-6 space-y-4'>
        <h2 className='text-lg font-semibold'>필터</h2>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          <div>
            <label className='block text-sm font-medium mb-1'>사용자 ID</label>
            <input
              type='text'
              value={filters.userId || ''}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder='사용자 ID 입력'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>가맹점</label>
            <input
              type='text'
              value={filters.merchant || ''}
              onChange={(e) => handleFilterChange('merchant', e.target.value)}
              placeholder='가맹점명 입력'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>카테고리</label>
            <input
              type='text'
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              placeholder='카테고리 입력'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>최소 금액</label>
            <input
              type='number'
              value={filters.minAmount || ''}
              onChange={(e) =>
                handleFilterChange(
                  'minAmount',
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              placeholder='최소 금액'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>최대 금액</label>
            <input
              type='number'
              value={filters.maxAmount || ''}
              onChange={(e) =>
                handleFilterChange(
                  'maxAmount',
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              placeholder='최대 금액'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>사기 여부</label>
            <select
              value={
                filters.isFraud === undefined ? '' : filters.isFraud.toString()
              }
              onChange={(e) =>
                handleFilterChange(
                  'isFraud',
                  e.target.value === '' ? undefined : e.target.value === 'true'
                )
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value=''>전체</option>
              <option value='true'>사기</option>
              <option value='false'>정상</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>시작 시간</label>
            <input
              type='datetime-local'
              value={filters.startTime || ''}
              onChange={(e) => handleFilterChange('startTime', e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium mb-1'>종료 시간</label>
            <input
              type='datetime-local'
              value={filters.endTime || ''}
              onChange={(e) => handleFilterChange('endTime', e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
        </div>

        {/* 필터 초기화 버튼 */}
        <div className='flex justify-end'>
          <button
            onClick={() =>
              setFilters({
                userId: '',
                merchant: '',
                category: '',
                minAmount: undefined,
                maxAmount: undefined,
                isFraud: undefined,
                startTime: '',
                endTime: '',
                pageable: {
                  page: 0,
                  size: 10,
                  sort: ['createdAt,desc'],
                },
              })
            }
            className='px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors'
          >
            필터 초기화
          </button>
        </div>
      </div>

      {/* 페이지 사이즈 선택 */}
      <div className='flex items-center gap-2'>
        <span className='text-sm text-gray-600'>페이지당 항목 수:</span>
        <select
          value={filters.pageable.size}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          className='px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
        >
          <option value={5}>5개</option>
          <option value={10}>10개</option>
          <option value={20}>20개</option>
          <option value={50}>50개</option>
        </select>
      </div>

      {/* 거래 내역 테이블 */}
      <div className='bg-white rounded-lg shadow overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  거래 ID
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  사용자 ID
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  가맹점
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  카테고리
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  금액
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  사기 여부
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  거래 시간
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className='px-6 py-12 text-center text-gray-500'
                  >
                    거래 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                transactions.map((transaction: any, index: number) => (
                  <tr
                    key={transaction.id || index}
                    className='hover:bg-gray-50'
                  >
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                      {transaction.id}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {transaction.userId}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {transaction.merchant}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {transaction.category}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold'>
                      {formatAmount(transaction.amount)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.isFraud
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {transaction.isFraud ? '사기' : '정상'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {formatDate(
                        transaction.timestamp || transaction.createdAt
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 페이지네이션 */}
      {/* {totalPages > 1 && (
        <div className='flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow'>
          <div className='flex items-center text-sm text-gray-700'>
            <span>
              {currentPage * filters.pageable.size + 1}-
              {Math.min(
                (currentPage + 1) * filters.pageable.size,
                totalElements
              )}{' '}
              / {totalElements.toLocaleString()}
            </span>
          </div>

          <div className='flex items-center space-x-1'>
            <button
              onClick={() => handlePageChange(0)}
              disabled={currentPage === 0}
              className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              처음
            </button>

            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              이전
            </button> */}

      {/* 페이지 번호들
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const startPage = Math.max(
                0,
                Math.min(currentPage - 2, totalPages - 5)
              );
              const pageNumber = startPage + i;

              if (pageNumber >= totalPages) return null;

              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-3 py-2 text-sm font-medium border rounded-md ${
                    pageNumber === currentPage
                      ? 'text-blue-600 bg-blue-50 border-blue-300'
                      : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber + 1}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              다음
            </button>

            <button
              onClick={() => handlePageChange(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
              className='px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              마지막
            </button>
          </div>
        </div>
      )} */}
    </div>
  );
}
