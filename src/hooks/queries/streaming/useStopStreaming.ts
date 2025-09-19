import { useApiMutation } from '../useApi';

type Response = {
  status: string;
};

export const useStopStreaming = () =>
  useApiMutation<Response, void>({
    method: 'POST',
    endpoint: '/proxy/streaming/stop',
    authorization: true,
  });
