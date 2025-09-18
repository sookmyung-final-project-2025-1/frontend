import { useApiQuery } from '../useApi';

export type UseKpiQueryArgs = Readonly<{
  startTime: string;
  endTime: string;
}>;

// export type Kpi = {
//   totalTransactions: number;
//   fraudDetected: number;
//   fraudRate: number;
//   avgConfidenceScore: number;
// };

export type Kpi = {
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

export const useKpiQuery = (args: UseKpiQueryArgs) => {
  const { startTime, endTime } = args;

  const kpiParameters = new URLSearchParams({
    startTime,
    endTime,
  }).toString();
  const isEnabled = Boolean(startTime && endTime);

  return useApiQuery<Kpi>({
    queryKey: ['dashboard', 'kpi', startTime, endTime],
    queryOptions: {
      endpoint: `/proxy/dashboard/kpis?${kpiParameters}`,
      authorization: true,
    },
    fetchOptions: { enabled: isEnabled, staleTime: 20_000 },
  });
};
