import { useApiQuery } from '../useApi';

type FraudTrendResponse = {
  interval: string;
  startTime: string;
  endTime: string;
  trends: string[];
};

type FraudTrendParameter = {
  startTime: string;
  endTime: string;
  interval: string; // default : 'daily'
};

export const useFraudTrend = (args: FraudTrendParameter) => {
  const { startTime, endTime, interval } = args;

  const fraudParameter = new URLSearchParams({
    startTime,
    endTime,
    interval,
  });

  return useApiQuery<FraudTrendResponse>({
    queryKey: ['fraudTrend', args],
    queryOptions: {
      endpoint: `/proxy/dashboard/fraud-trends?${fraudParameter}`,
    },
  });
};
