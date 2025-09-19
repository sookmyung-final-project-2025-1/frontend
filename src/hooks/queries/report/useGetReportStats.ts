// hooks/queries/report/useGetReportStats.ts
import { useApiQuery } from '../useApi';

/**
 * 스펙이 key-value 형태(예: { total: 123, pending: 10, ... })라
 * 안전하게 인덱스 시그니처로 받습니다.
 * 필요하면 화면단에서 구체 타입으로 좁혀 쓰세요.
 */
export type ReportStats = Record<string, unknown>;

/**
 * 신고 통계 조회
 * @param days 최근 일수(기본 7)
 */
export const useGetReportStats = (days: number = 7) => {
  const params = new URLSearchParams();
  if (Number.isFinite(days)) params.set('days', String(days));

  return useApiQuery<ReportStats>({
    queryKey: ['reports', 'stats', days],
    queryOptions: {
      endpoint: `/proxy/reports/stats?${params.toString()}`,
      authorization: true,
    },
  });
};
