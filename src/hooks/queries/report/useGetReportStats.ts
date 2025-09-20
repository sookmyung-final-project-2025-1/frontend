import type { ReportStats } from '@/types/report-types';
import { useApiQuery } from '../useApi';

export const useGetReportStats = (days: number) =>
  useApiQuery<ReportStats>({
    queryKey: ['reports', 'stats', days],
    queryOptions: {
      endpoint: `/proxy/reports/stats?days=${days}`,
      authorization: true,
    },
  });
