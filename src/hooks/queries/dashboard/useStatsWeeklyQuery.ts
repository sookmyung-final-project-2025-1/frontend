// src/hooks/queries/dashboard/useStatsWeeklyQuery.ts
import { useApiQuery } from '../useApi';

export type UseStatsWeeklyQueryArgs = Readonly<{
  startTime: string;
  endTime: string;
}>;

export type WeeklyPoint = {
  date: string;
  totalCount: number;
  fraudCount: number;
  fraudRate: number;
};

export const useStatsWeeeklyQuery = (args: UseStatsWeeklyQueryArgs) => {
  const { startTime, endTime } = args;
  const qs = new URLSearchParams({ startTime, endTime }).toString();
  const enabled = Boolean(startTime && endTime);

  return useApiQuery<WeeklyPoint[]>({
    queryKey: ['stats', 'weekly', args],
    queryOptions: {
      endpoint: `/proxy/dashboard/stats/weekly?${qs}`,
      authorization: true,
    },
    fetchOptions: { enabled },
  });
};
