// hooks/queries/model/useGetModelVersionMetadata.ts
import { useApiQuery } from '@/hooks/queries/useApi';

export type ModelMetadata = Record<string, unknown>; // 일단 느슨하게

export const useGetModelVersionMetadata = (version: string) =>
  useApiQuery<ModelMetadata>({
    queryKey: ['model', 'metadata', version],
    queryOptions: {
      endpoint: `/proxy/model/versions/${encodeURIComponent(version)}/metadata`,
      authorization: true,
    },
    fetchOptions: {
      enabled: !!version, // 빈 값일 때 호출 방지
    },
  });
