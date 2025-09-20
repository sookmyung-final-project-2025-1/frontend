// hooks/queries/report/useGetPendingCount.ts
import { PendingCounts } from '@/types/report-types';
import { useApiQuery } from '../useApi';

export const useGetPendingCount = () =>
  useApiQuery<PendingCounts>({
    queryKey: ['report', 'pendingCount'],
    queryOptions: {
      endpoint: '/proxy/reports/pending/count',
      authorization: true,
    },
  });
