// src/components/transaction/TransactionFilters.tsx
'use client';

import { TransactionRequestType } from '@/types/transaction.schema';
import { useMemo, useState } from 'react';

type Props = {
  filters: TransactionRequestType;
  onChange: (key: keyof TransactionRequestType, value: any) => void;
  onReset: () => void;
  /** 적용 버튼 클릭 시 최종 쿼리 파라미터를 넘겨서 요청하게 함 */
  onApply?: (params: URLSearchParams) => void;
};

/** ----------------- 시간/파라미터 유틸 ----------------- */

/** 'YYYY-MM-DDTHH:MM' → 'YYYY-MM-DDTHH:MM:ss' (서버 예시 형식) */
function toApiLocalDateTime(
  input: string | undefined,
  opts?: { end?: boolean }
) {
  if (!input) return '';
  // datetime-local은 보통 'YYYY-MM-DDTHH:MM' 형식
  // 초가 없으면 서버 예시에 맞춰 시작은 :00, 끝은 :59 부여
  const hasSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(input);
  if (hasSeconds) return input;
  const suffix = opts?.end ? ':59' : ':00';
  return `${input}${suffix}`;
}

/** 빈 값 제거하며 URLSearchParams 생성 */
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

  // ISO 8601 (오프셋 없는 로컬)로 맞춤
  const start = toApiLocalDateTime(filters.startTime, { end: false });
  const end = toApiLocalDateTime(filters.endTime, { end: true });
  if (start) push('startTime', start);
  if (end) push('endTime', end);

  // pageable은 객체 → page/size + sort[]=... 로 평탄화
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
  onApply,
}: Props) {
  const inputCls =
    'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-slate-500/60 focus:border-slate-500';

  // 페이지네이션 로컬 상태(필요 시 밖으로 뺄 수 있음)
  const [pageable, setPageable] = useState<{
    page: number;
    size: number;
    sort: string[];
  }>({
    page: 0,
    size: 10,
    sort: ['reportedAt,desc'],
  });

  // 미리보기용 쿼리 스트링 (옵션)
  const previewQs = useMemo(
    () => buildParams(filters, pageable).toString(),
    [filters, pageable]
  );

  const handleApply = () => {
    const params = buildParams(filters, pageable);
    onApply?.(params); // 부모에서 이 params로 API 요청 실행
  };

  const resetAll = () => {
    onReset();
    setPageable({ page: 0, size: 10, sort: ['reportedAt,desc'] });
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

      {/* 페이지네이션(옵션) */}
      <div className='grid grid-cols-3 gap-3'>
        <div>
          <label className='block text-sm mb-1 text-slate-300'>페이지</label>
          <input
            type='number'
            min={0}
            value={pageable.page}
            onChange={(e) =>
              setPageable((p) => ({ ...p, page: Number(e.target.value) || 0 }))
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
              setPageable((p) => ({ ...p, size: Number(e.target.value) || 10 }))
            }
            className={inputCls}
          />
        </div>
      </div>

      {/* 액션 */}
      <div className='flex items-center justify-between'>
        <div className='text-xs text-slate-500 truncate'>
          {/* 미리보기: ?userId=...&startTime=... */}
          {previewQs ? `?${previewQs}` : ''}
        </div>
        <div className='flex gap-2'>
          <button
            onClick={resetAll}
            className='px-4 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
          >
            필터 초기화
          </button>
          <button
            onClick={handleApply}
            className='px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700'
          >
            적용 및 조회
          </button>
        </div>
      </div>
    </div>
  );
}
