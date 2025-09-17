import { useApiMutation } from '../../useApi';

type PauseResponse = {
  status: string;
};

export const usePauseStreaming = () =>
  useApiMutation<PauseResponse, void>({
    method: 'POST',
    endpoint: '/proxy/streaming/pause',
    authorization: true,
  });
