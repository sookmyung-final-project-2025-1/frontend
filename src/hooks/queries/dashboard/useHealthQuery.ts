import { useApiQuery } from '../useApi';

export type HealthResponse = {
  additionProp1: {};
  additionProp2: {};
  additionProp3: {};
};

export const useHealthQuery = () =>
  useApiQuery<HealthResponse>({
    queryKey: ['health'],
    queryOptions: {
      endpoint: '/api/dashboard/system-health',
      authorization: false,
    },
    fetchOptions: { staleTime: 0 },
  });
