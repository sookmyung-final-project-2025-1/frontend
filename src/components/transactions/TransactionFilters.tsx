'use client';

import { TransactionRequestType } from '@/types/transaction.schema';

type Props = {
  filters: TransactionRequestType;
  onChange: (key: keyof TransactionRequestType, value: any) => void;
  onReset: () => void;
};

export default function TransactionFilters({
  filters,
  onChange,
  onReset,
}: Props) {
  const inputCls =
    'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-slate-500/60 focus:border-slate-500';

  return (
    <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8 space-y-4'>
      <h2 className='text-lg font-semibold text-slate-200'>필터</h2>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        <div>
          <label className='block text-sm mb-1 text-slate-300'>사용자 ID</label>
          <input
            type='text'
            value={filters.userId || ''}
            onChange={(e) => onChange('userId', e.target.value)}
            placeholder='사용자 ID 입력'
            className={inputCls}
          />
        </div>

        <div>
          <label className='block text-sm mb-1 text-slate-300'>가맹점</label>
          <input
            type='text'
            value={filters.merchant || ''}
            onChange={(e) => onChange('merchant', e.target.value)}
            placeholder='가맹점명 입력'
            className={inputCls}
          />
        </div>

        <div>
          <label className='block text-sm mb-1 text-slate-300'>카테고리</label>
          <input
            type='text'
            value={filters.category || ''}
            onChange={(e) => onChange('category', e.target.value)}
            placeholder='카테고리 입력'
            className={inputCls}
          />
        </div>

        <div>
          <label className='block text-sm mb-1 text-slate-300'>최소 금액</label>
          <input
            type='number'
            value={filters.minAmount ?? ''}
            onChange={(e) =>
              onChange(
                'minAmount',
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            placeholder='최소 금액'
            className={inputCls}
          />
        </div>

        <div>
          <label className='block text-sm mb-1 text-slate-300'>최대 금액</label>
          <input
            type='number'
            value={filters.maxAmount ?? ''}
            onChange={(e) =>
              onChange(
                'maxAmount',
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            placeholder='최대 금액'
            className={inputCls}
          />
        </div>

        <div>
          <label className='block text-sm mb-1 text-slate-300'>사기 여부</label>
          <select
            value={filters.isFraud === undefined ? '' : String(filters.isFraud)}
            onChange={(e) =>
              onChange(
                'isFraud',
                e.target.value === '' ? undefined : e.target.value === 'true'
              )
            }
            className={inputCls}
          >
            <option value=''>전체</option>
            <option value='true'>사기</option>
            <option value='false'>정상</option>
          </select>
        </div>

        <div>
          <label className='block text-sm mb-1 text-slate-300'>시작 시간</label>
          <input
            type='datetime-local'
            value={filters.startTime || ''}
            onChange={(e) => onChange('startTime', e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className='block text-sm mb-1 text-slate-300'>종료 시간</label>
          <input
            type='datetime-local'
            value={filters.endTime || ''}
            onChange={(e) => onChange('endTime', e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div className='flex justify-end'>
        <button
          onClick={onReset}
          className='px-4 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        >
          필터 초기화
        </button>
      </div>
    </div>
  );
}
