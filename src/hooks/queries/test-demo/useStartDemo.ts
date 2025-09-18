import { useApiMutation } from '../useApi';

type DemoType = {
  message: string;
  mode: string;
  startTime: string;
};

export const useStartDemo = () =>
  useApiMutation<DemoType, void>({
    method: 'POST',
    endpoint: '/proxy/test/start-demo',
  });
