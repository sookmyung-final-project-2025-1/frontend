// src/hooks/queries/report/useGetReport.ts
import useBuildParams from '@/lib/useBuildParams';
import type {
  PaginatedReports,
  ReportItem,
  ReportItemStatus,
} from '@/types/report-types';
import { useMemo } from 'react';
import { useApiQuery } from '../useApi';

type ReportArgs = {
  status: ReportItemStatus | undefined;
  reportedBy?: string;
  startDate?: string;
  endDate?: string;
  pageable: { page: number; size: number; sort?: string[] };
};

const VALID_STATUS: ReportItemStatus[] = [
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
];

const normalizeItem = (r: any): ReportItem => ({
  reportId: Number(r.reportId ?? r.id ?? 0),
  transactionId: Number(r.transactionId ?? r.txId ?? 0),
  reportedBy: String(r.reportedBy ?? r.reporter ?? ''),
  reason: String(r.reason ?? ''),
  description: r.description ?? null,
  status: (VALID_STATUS as readonly string[]).includes(r.status)
    ? (r.status as ReportItemStatus)
    : 'PENDING',
  reviewedBy: r.reviewedBy ?? null,
  reviewComment: r.reviewComment ?? null,
  isFraudConfirmed: Boolean(
    r.isFraudConfirmed ?? r.fraudConfirmed ?? r.confirmed ?? false
  ),
  reportedAt: String(r.reportedAt ?? r.createdAt ?? ''),
  reviewedAt: r.reviewedAt ?? null,
  transactionDetails: r.transactionDetails ?? {
    amount: r.amount ?? undefined,
    merchant: r.merchant ?? undefined,
    userId: r.userId ?? undefined,
    transactionTime: r.transactionTime ?? undefined,
  },
  priority: r.priority ?? null,
  severity: r.severity ?? null,
  category: r.category ?? null,
  message: r.message ?? null,
});

function transformRaw(
  raw: any,
  fallbackPage: number,
  fallbackSize: number
): PaginatedReports {
  const contentRaw: any[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.content)
      ? raw.content
      : [];

  const content = contentRaw.map(normalizeItem);

  const totalElements =
    typeof raw?.totalElements === 'number' ? raw.totalElements : content.length;

  const totalPages =
    typeof raw?.totalPages === 'number'
      ? raw.totalPages
      : Math.ceil(totalElements / Math.max(1, fallbackSize));

  const number = typeof raw?.number === 'number' ? raw.number : fallbackPage;

  const size = typeof raw?.size === 'number' ? raw.size : fallbackSize;

  return { content, totalElements, totalPages, number, size };
}

export const useGetReport = (args: ReportArgs) => {
  const { status, reportedBy, startDate, endDate, pageable } = args;

  const params = useBuildParams({
    ...(status ? { status } : {}),
    ...(reportedBy ? { reportedBy } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  });

  // pageable=nested
  params.set('pageable.page', String(pageable.page));
  params.set('pageable.size', String(pageable.size));
  (pageable.sort ?? []).forEach((s) => params.append('pageable.sort', s));

  const qs = params.toString();

  // 1) 원시 응답으로 가져옵니다.
  const q = useApiQuery<any>({
    queryKey: ['reports', args],
    queryOptions: {
      endpoint: `/proxy/reports?${qs}`,
      authorization: true,
    },
  });

  // 2) 메모이즈하여 가공된 데이터를 제공합니다.
  const parsed: PaginatedReports | undefined = useMemo(() => {
    if (!q.data) return undefined;
    try {
      return transformRaw(q.data, pageable.page, pageable.size);
    } catch {
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: pageable.page,
        size: pageable.size,
      };
    }
  }, [q.data, pageable.page, pageable.size]);

  // 3) data만 가공된 타입으로 덮어써서 반환
  return {
    ...q,
    data: parsed,
  } as Omit<typeof q, 'data'> & { data: PaginatedReports | undefined };
};
