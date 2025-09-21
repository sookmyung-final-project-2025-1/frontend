import { useApiQuery } from '../useApi';

type StreamingStatus = {
  isStreaming: boolean;
  mode: string;
  speed: number;
  currentTime: string;
  progress?: number;
};

export const useGetStreamingStatus = () =>
  useApiQuery<StreamingStatus>({
    queryKey: ['streaming', 'status'],
    queryOptions: {
      endpoint: '/proxy/streaming/status',
    },
  });
