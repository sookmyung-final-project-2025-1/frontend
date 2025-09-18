import { useApiMutation } from '../useApi';

type ResumeResponse = {
  status: string;
};

export const useResumeStreaming = () =>
  useApiMutation<ResumeResponse, void>({
    method: 'POST',
    endpoint: '/proxy/streaming/resume',
    authorization: true,
  });
