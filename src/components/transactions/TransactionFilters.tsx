// src/components/transactions/TransactionFilters.tsx
'use client';

import { TransactionRequestType } from '@/types/transaction.schema';
import { useMemo } from 'react';

type Pageable = NonNullable<TransactionRequestType['pageable']>;

type Props = {
  filters: TransactionRequestType;
  onChange: (key: keyof TransactionRequestType, value: any) => void;
  onReset: () => void;

  /** 부모의 pageable을 그대로 내려받아 조작 (단일 소스) */
  pageable: Pageable;
  onPageableChange: (updater: (p: Pageable) => Pageable) => void;

  /** (선택) 현재 파라미터 프리뷰가 필요하면 true */
  showPreview?: boolean;
};

function toApiLocalDateTime(
  input: string | undefined,
  opts?: { end?: boolean }
) {
  if (!input) return '';
  const hasSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(input);
  if (hasSeconds) return input;
  const suffix = opts?.end ? ':59' : ':00';
  return `${input}${suffix}`;
}

function buildParams(
  filters: TransactionRequestType,
  pageable?: { page?: number; size?: number; sort?: string[] }
) {
  const params = new URLSearchParams();
  const push = (k: string, v: unknown) => {
    if (v === undefined || v === null) return;
    const s = String(v).trim();
    if (s === '') return;
    params.append(k, s);
  };

  push('userId', filters.userId);
  push('merchant', filters.merchant);
  push('category', filters.category);
  if (typeof filters.minAmount === 'number')
    push('minAmount', filters.minAmount);
  if (typeof filters.maxAmount === 'number')
    push('maxAmount', filters.maxAmount);
  if (typeof filters.isFraud === 'boolean') push('isFraud', filters.isFraud);

  const start = toApiLocalDateTime(filters.startTime, { end: false });
  const end = toApiLocalDateTime(filters.endTime, { end: true });
  if (start) push('startTime', start);
  if (end) push('endTime', end);

  if (pageable) {
    if (typeof pageable.page === 'number') push('page', pageable.page);
    if (typeof pageable.size === 'number') push('size', pageable.size);
    if (Array.isArray(pageable.sort)) {
      for (const s of pageable.sort) push('sort', s);
    }
  }
  return params;
}

export default function TransactionFilters({
  filters,
  onChange,
  onReset,
  pageable,
  onPageableChange,
  showPreview,
}: Props) {
  const inputCls =
    'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-slate-500/60 focus:border-slate-500';

  // 정렬 UI용 파생 상태 (pageable.sort는 ["field,dir"] 형태의 0~1개만 사용한다고 가정)
  const currentSort = pageable.sort?.[0] ?? '';
  const [sortField, sortDir] = currentSort.split(','); // e.g. "createdAt,desc"

  const previewQs = useMemo(() => {
    if (!showPreview) return '';
    return buildParams(filters, pageable).toString();
  }, [filters, pageable, showPreview]);

  const handleSortFieldChange = (field: string) => {
    onPageableChange((p) => ({
      ...p,
      page: 0,
      sort: field ? [`${field},${sortDir || 'desc'}`] : [], // 필드 없으면 빈 배열
    }));
  };

  const handleSortDirChange = (dir: 'asc' | 'desc') => {
    onPageableChange((p) => ({
      ...p,
      page: 0,
      sort: sortField ? [`${sortField},${dir}`] : [], // 필드 없으면 빈 배열
    }));
  };

  const resetAll = () => {
    onReset();
    onPageableChange((p) => ({ ...p, page: 0, size: 10, sort: [] })); // ✅ 기본은 빈 배열
  };

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
          <p className='mt-1 text-xs text-slate-500'>
            예: 2024-01-01T00:00 → 전송: 2024-01-01T00:00:00
          </p>
        </div>

        <div>
          <label className='block text-sm mb-1 text-slate-300'>종료 시간</label>
          <input
            type='datetime-local'
            value={filters.endTime || ''}
            onChange={(e) => onChange('endTime', e.target.value)}
            className={inputCls}
          />
          <p className='mt-1 text-xs text-slate-500'>
            예: 2024-01-31T23:59 → 전송: 2024-01-31T23:59:59
          </p>
        </div>
      </div>

      {/* 페이지네이션 + 정렬 */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
        <div>
          <label className='block text-sm mb-1 text-slate-300'>페이지</label>
          <input
            type='number'
            min={0}
            value={pageable.page}
            onChange={(e) =>
              onPageableChange((p) => ({
                ...p,
                page: Number(e.target.value) || 0,
              }))
            }
            className={inputCls}
          />
        </div>
        <div>
          <label className='block text-sm mb-1 text-slate-300'>
            페이지 크기
          </label>
          <input
            type='number'
            min={1}
            value={pageable.size}
            onChange={(e) =>
              onPageableChange((p) => ({
                ...p,
                size: Number(e.target.value) || 10,
              }))
            }
            className={inputCls}
          />
        </div>

        {/* ✅ 정렬 UI */}
        <div className='grid grid-cols-2 gap-2'>
          <div>
            <label className='block text-sm mb-1 text-slate-300'>
              정렬 필드
            </label>
            <select
              value={sortField || ''}
              onChange={(e) => handleSortFieldChange(e.target.value)}
              className={inputCls}
            >
              <option value=''>선택 안 함 (기본)</option>
              <option value='createdAt'>createdAt</option>
              <option value='updatedAt'>updatedAt</option>
              <option value='transactionTime'>transactionTime</option>
              <option value='reportedAt'>reportedAt</option>
              <option value='amount'>amount</option>
              <option value='userId'>userId</option>
              {/* 필요한 필드 자유롭게 추가 */}
            </select>
          </div>
          <div>
            <label className='block text-sm mb-1 text-slate-300'>
              정렬 방향
            </label>
            <select
              value={(sortDir as 'asc' | 'desc') || 'desc'}
              onChange={(e) =>
                handleSortDirChange(e.target.value as 'asc' | 'desc')
              }
              className={inputCls}
              disabled={!sortField}
              title={!sortField ? '정렬 필드를 먼저 선택하세요' : undefined}
            >
              <option value='asc'>오름차순</option>
              <option value='desc'>내림차순</option>
            </select>
          </div>
        </div>
      </div>

      {/* 액션 */}
      <div className='flex items-center justify-between'>
        <div className='text-xs text-slate-500 truncate'>
          {showPreview && (previewQs ? `?${previewQs}` : '')}
        </div>
        <div className='flex gap-2'>
          <button
            onClick={resetAll}
            className='px-4 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
          >
            필터 초기화
          </button>
        </div>
      </div>
    </div>
  );
}
