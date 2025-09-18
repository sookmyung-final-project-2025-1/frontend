import { useApiQuery } from '../useApi';

// export type MatricRealtimeResponse = {
//   currentTps: number;
//   recentTransactions: number;
//   activeSessions: number;
//   systemLoad: number;
// };

export type HourlyMetrics = {
  averageConfidenceScore: number;
  averageProcessingTimeMs: number;
  averageTransactionAmount: number;
  fraudRate: number;
  fraudTransactions: number;
  medianProcessingTimeMs: number;
  p95ProcessingTimeMs: number;
  throughputPerHour: number;
  totalTransactions: number;
  uniqueUsers: number;
};

export type RealtimeMetric = {
  timestamp: string;
  hourly: HourlyMetrics;
  recentFraudTransactions: number;
  recentTransactions: number;
};

export const useMetricRealtime = () =>
  useApiQuery<RealtimeMetric>({
    queryKey: ['realtime', 'matrics'],
    queryOptions: {
      endpoint: '/proxy/dashboard/realtime',
      authorization: true,
    },
    fetchOptions: {
      staleTime: 10_000,
    },
  });
