import { useApiQuery } from '../useApi';

export type HealthResponse = {
  avgConfidenceScore: number;
  avgProcessingTime: number;
  checkedAt: string;
  p95ProcessingTime: number;
  score: number;
  status: string;
};

export const useHealthQuery = () =>
  useApiQuery<HealthResponse>({
    queryKey: ['health'],
    queryOptions: {
      endpoint: '/proxy/dashboard/system-health',
      authorization: false,
    },
    fetchOptions: { staleTime: 10_000 },
  });
