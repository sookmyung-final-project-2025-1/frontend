import { useApiQuery } from '../useApi';

export type UseStatsDailyQueryArgs = Readonly<{
  startTime: string;
  endTime: string;
}>;

type DailyResponse = {
  date: string;
  fraudRate: number;
  fraudCount: number;
  totalCount: number;
};

export const useStatsDailyQuery = (args: UseStatsDailyQueryArgs) => {
  const { startTime, endTime } = args;

  const dailyParameters = new URLSearchParams({
    startTime,
    endTime,
  }).toString();
  const isEnabled = Boolean(startTime && endTime);

  return useApiQuery<DailyResponse[]>({
    queryKey: ['stats', 'daily', args],
    queryOptions: {
      endpoint: `/proxy/dashboard/stats/daily?${dailyParameters}`,
      authorization: true,
    },
    fetchOptions: { enabled: !!isEnabled },
  });
};
