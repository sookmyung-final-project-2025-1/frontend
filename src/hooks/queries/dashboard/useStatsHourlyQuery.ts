import { useApiQuery } from '../useApi';

export type UseStatsHourlyQueryArgs = Readonly<{
  startTime: string;
  endTime: string;
}>;

export const useStatsHourlyQuery = (args: UseStatsHourlyQueryArgs) => {
  const { startTime, endTime } = args;

  const hourlyParameters = new URLSearchParams({
    startTime,
    endTime,
  }).toString();
  const isEnabled = Boolean(startTime && endTime);

  return useApiQuery<UseStatsHourlyQueryArgs>({
    queryKey: ['stats', 'hourly'],
    queryOptions: {
      endpoint: `/proxy/dashboard/stats/hourly?${hourlyParameters}`,
      authorization: true,
    },
    fetchOptions: { enabled: !!isEnabled, staleTime: 0 },
  });
};
