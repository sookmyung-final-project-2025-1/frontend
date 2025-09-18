import { useApiQuery } from '../useApi';

export type UseStatsHourlyQueryArgs = Readonly<{
  startTime: string;
  endTime: string;
}>;

export type HourlyResponse = {
  avgConfidenceScore: number;
  avgProcessingTime: number;
  timestamp: string;
  totalCount: number;
};

export const useStatsHourlyQuery = (args: UseStatsHourlyQueryArgs) => {
  const { startTime, endTime } = args;

  const hourlyParameters = new URLSearchParams({
    startTime,
    endTime,
  }).toString();
  const isEnabled = Boolean(startTime && endTime);

  return useApiQuery<HourlyResponse[]>({
    queryKey: ['stats', 'hourly', args],
    queryOptions: {
      endpoint: `/proxy/dashboard/stats/hourly?${hourlyParameters}`,
      authorization: true,
    },
    fetchOptions: { enabled: !!isEnabled },
  });
};
