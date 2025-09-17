import { useApiMutation } from '../../useApi';

type JumpResponse = {
  status: string;
  targetTime: string;
};

export const useJumpStreaming = () =>
  useApiMutation<JumpResponse, string>({
    method: 'POST',
    endpoint: (targetTime) => `/proxy/streaming/jump?targetTime=${targetTime}`,
    authorization: true,
  });
