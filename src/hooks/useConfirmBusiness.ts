import { ApiError, fetcher } from '@/api/fetcher';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from './queryKeys';

export const useConfirmBusiness = () => {
  const qc = useQueryClient();

  const run = async (bn: string) => {
    try {
      await qc.fetchQuery({
        queryKey: QUERY_KEYS.businessNumCheck(bn),
        queryFn: () =>
          fetcher<void>({
            method: 'GET',
            endpoint: `/proxy/auth/check-business?businessNumber=${encodeURIComponent(bn)}`,
            authorization: false,
          }),
        staleTime: 0,
        retry: false,
      });
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) return false;
      throw e;
    }
  };

  return { run };
};
