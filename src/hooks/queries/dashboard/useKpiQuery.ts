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
  falsePositiveRate: number; // 오탐 비율(%)
  totalTransactions: number; // 총 트랜잭션 수
  fraudAmount: number; // 사기 금액 합계
  blockedAmount: number; // 차단 금액 합계
  fraudTransactions: number; // 사기 트랜잭션 수
  fraudRate: number; // 사기 비율(%)
  throughputPerHour: number; // 시간당 처리량
  latencyP95Ms: number; // 지연 p95 (ms)
  averageProcessingTimeMs: number; // 평균 처리 시간 (ms)
  averageConfidenceScore: number; // 평균 신뢰도
  latencyP50Ms: number; // 지연 p50 (ms)
  uniqueUsers: number; // 고유 사용자 수
  newUsersHourly: number; // 시간당 신규 사용자 수
  averageTransactionAmount: number; // 평균 거래 금액
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
