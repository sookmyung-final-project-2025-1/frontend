// src/hooks/queries/reports/useGetPendingReportCount.ts
import { useApiQuery } from '../useApi';

/**
 * 대기 중인 신고 수 조회
 * GET /api/reports/pending/count  → 프록시: /proxy/reports/pending/count
 * 반환: number (대기 중 카운트)
 */
export const useGetPendingReportCount = () =>
  useApiQuery<number>({
    queryKey: ['reports', 'pending', 'count'],
    queryOptions: {
      endpoint: '/proxy/reports/pending/count',
      authorization: true,
    },
  });
