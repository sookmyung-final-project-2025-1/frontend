import { QUERY_KEYS } from '@/hooks/queryKeys';
import { useApiQuery } from '../useApi';

type VersionResponse = {
  versions: string[];
  currentVersion: string;
  latestVersion: string;
  totalCount: number;
};

export const useGetAvailableVersion = () =>
  useApiQuery<VersionResponse>({
    queryKey: [QUERY_KEYS.modelVersion],
    queryOptions: {
      endpoint: '/proxy/model/versions/available',
      authorization: true,
    },
  });
