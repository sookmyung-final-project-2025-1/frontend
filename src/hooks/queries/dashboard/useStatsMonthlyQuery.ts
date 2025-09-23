import { useApiQuery } from '../useApi';

export type UseStatsHourlyQueryArgs = Readonly<{
  startTime: string;
  endTime: string;
}>;

export type HourlyResponse = {
  month: string;
  totalCount: number;
  fraudCount: number;
  fraudRate: number; // 0~1
  totalAmount: number; // 합계 금액
  avgAmount: number; // 평균 금액
  uniqueUsers: number;
};

export const useStatsMonthlyQuery = (args: UseStatsHourlyQueryArgs) => {
  const { startTime, endTime } = args;

  const hourlyParameters = new URLSearchParams({
    startTime,
    endTime,
  }).toString();
  const isEnabled = Boolean(startTime && endTime);

  return useApiQuery<HourlyResponse[]>({
    queryKey: ['stats', 'monthly', args],
    queryOptions: {
      endpoint: `/proxy/dashboard/stats/monthly?${hourlyParameters}`,
      authorization: true,
    },
    fetchOptions: { enabled: !!isEnabled },
  });
};
