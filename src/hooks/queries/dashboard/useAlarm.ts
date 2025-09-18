import { useApiQuery } from '../useApi';

export type AlarmResponse = {
  type: string;
  message: string;
  severity: string;
  timestamp: string;
};

export const useAlarm = (limit: number) => {
  const params = new URLSearchParams({ limit: String(limit) });
  return useApiQuery<AlarmResponse[]>({
    queryKey: ['alarm', limit],
    queryOptions: {
      endpoint: `/proxy/dashboard/alarms?${params.toString()}`,
      authorization: true,
    },
    fetchOptions: { staleTime: 200_000 },
  });
};
