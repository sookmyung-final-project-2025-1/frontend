import { useApiMutation } from '../../useApi';

type StartResponse = {
  status: string;
  mode: string;
};

export const useStartStreamingRealtime = () =>
  useApiMutation<StartResponse, void>({
    method: 'POST',
    endpoint: '/proxy/streaming/start/realtime',
    authorization: true,
  });
