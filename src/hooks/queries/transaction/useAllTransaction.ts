// src/hooks/queries/transactions/useAllTransaction.ts
import useBuildParams from '@/lib/useBuildParams';
import {
  PageableType,
  TransactionRequestType,
  TransactionType,
} from '@/types/transaction.schema';
import { useApiQuery } from '../useApi';

type PageableMode = 'nested' | 'flat' | 'json';
const PAGEABLE_MODE: PageableMode = 'nested';

/** ---------- 유틸: datetime-local → 로컬(초 포함) ---------- */
const withSeconds = (v?: string | null, opts?: { end?: boolean }) => {
  if (!v) return undefined;
  // 이미 초가 있으면 그대로
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(v)) return v;
  // HH:mm 만 있을 때 초 채우기
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v))
    return `${v}${opts?.end ? ':59' : ':00'}`;
  // 그 외는 그대로 (useApi에서 못 잡을 수도 있음)
  return v;
};

function useAddPageable(
  params: URLSearchParams,
  pageable: PageableType,
  mode: PageableMode
) {
  const { page, size, sort } = pageable;

  const add = (key: string, value: string | string[]) => {
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else params.set(key, value);
  };

  if (mode === 'nested') {
    add('pageable.page', String(page));
    add('pageable.size', String(size));
    if (sort) add('pageable.sort', Array.isArray(sort) ? sort : [sort]);
    return;
  }

  if (mode === 'flat') {
    add('page', String(page));
    add('size', String(size));
    if (sort) add('sort', Array.isArray(sort) ? sort : [sort]);
    return;
  }

  params.set('pageable', JSON.stringify({ page, size, sort }));
}

export const useAllTransaction = (args: TransactionRequestType) => {
  const {
    userId,
    merchant,
    category,
    minAmount,
    maxAmount,
    isFraud,
    startTime,
    endTime,
    pageable,
  } = args;

  // ✅ 초를 채워서 useApi의 1970 변환에 걸리도록 맞춘다
  const startLocal = withSeconds(startTime, { end: false });
  const endLocal = withSeconds(endTime, { end: true });

  const params = useBuildParams({
    userId,
    merchant,
    category,
    minAmount,
    maxAmount,
    ...(isFraud !== undefined ? { isFraud: isFraud ? 'true' : 'false' } : {}),
    startTime: startLocal,
    endTime: endLocal,
  });

  useAddPageable(params, pageable, PAGEABLE_MODE);

  const qs = params.toString();

  return useApiQuery<TransactionType[]>({
    queryKey: ['transaction', args],
    queryOptions: {
      endpoint: `/proxy/transactions?${qs}`,
      authorization: true,
    },
    fetchOptions: {
      enabled: !!pageable,
    },
  });
};
