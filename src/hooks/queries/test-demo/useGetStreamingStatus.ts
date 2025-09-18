import { useApiQuery } from '../useApi';

type SampleStatus = {
  isStreaming: boolean;
  mode: string;
  speed: number;
  currentTime: string;
};

export const useGetStreamingStatus = () =>
  useApiQuery<SampleStatus>({
    queryKey: ['test', 'status'],
    queryOptions: {
      endpoint: '/proxy/test/streaming-status',
    },
  });
