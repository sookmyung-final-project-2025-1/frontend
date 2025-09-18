import { useApiQuery } from '../useApi';

type TestHealth = {
  status: string;
  timestamp: string;
  sevice: string;
};

export const useCheckHealth = () =>
  useApiQuery<TestHealth>({
    queryKey: ['test', 'health'],
    queryOptions: {
      endpoint: '/proxy/test/health',
    },
  });
