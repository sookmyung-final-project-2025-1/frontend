import { useApiMutation } from '../../useApi';

export const useStopStreaming = () =>
  useApiMutation<void, void>({
    method: 'POST',
    endpoint: '/proxy/streaming/stop',
    authorization: true,
  });
