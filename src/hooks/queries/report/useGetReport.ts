// src/hooks/queries/reports/useGetReport.ts
import useBuildParams from '@/lib/useBuildParams';
import { useApiQuery } from '../useApi';

export type ReportStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
export type ReportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ReportItem = {
  reportId: number;
  transactionId: number;
  reportedBy: string;
  reason: string;
  description: string;
  status: ReportStatus | string; // 서버가 임시 문자열을 보낼 수도 있어 여유 둠
  reviewedBy: string;
  reviewComment: string;
  isFraudConfirmed: boolean;
  reportedAt: string; // ISO
  reviewedAt: string; // ISO
  transactionDetails: Record<string, unknown>;
  priority: ReportPriority | string;
};

export type ReportPage = {
  totalPages: number;
  totalElements: number;
  size: number;
  content: ReportItem[];
};

export type PageableType = {
  page: number;
  size: number;
  sort?: string[] | string;
};

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

export type ReportArgs = {
  status?: ReportStatus; // 선택적으로 필터 가능하게
  reportedBy?: string;
  startDate?: string; // YYYY-MM-DD or ISO
  endDate?: string; // YYYY-MM-DD or ISO
  pageable: PageableType;
};

export const useGetReport = (args: ReportArgs) => {
  const { status, reportedBy, startDate, endDate, pageable } = args;

  const params = useBuildParams({
    ...(status ? { status } : {}),
    ...(reportedBy ? { reportedBy } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  });

  useAddPageable(params, pageable, PAGEABLE_MODE);

  const qs = params.toString();

  return useApiQuery<ReportPage>({
    queryKey: ['reports', args],
    queryOptions: {
      endpoint: `/proxy/reports?${qs}`, // 엔드포인트 맥락 그대로
      authorization: true,
    },
    fetchOptions: {
      enabled: !!pageable,
    },
  });
};
