import useBuildParams from '@/lib/useBuildParams';
import {
  PageableType,
  TransactionRequestType,
  TransactionType,
} from '@/types/transaction.schema';
import { useApiQuery } from '../useApi';

type PageableMode = 'nested' | 'flat' | 'json';
const PAGEABLE_MODE: PageableMode = 'nested';

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

  const params = useBuildParams({
    userId,
    merchant,
    category,
    minAmount,
    maxAmount,
    ...(isFraud !== undefined ? { isFraud: isFraud ? 'true' : 'false' } : {}),
    startTime,
    endTime,
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
