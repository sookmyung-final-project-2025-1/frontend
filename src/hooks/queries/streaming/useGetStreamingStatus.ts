import { useApiQuery } from '../useApi';

export const useGetStreamingStatus = () =>
  useApiQuery({
    queryKey: ['streaming', 'status'],
    queryOptions: {
      endpoint: '/proxy/streaming/status',
    },
  });
