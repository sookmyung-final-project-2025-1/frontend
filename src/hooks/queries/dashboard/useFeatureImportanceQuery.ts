import { useApiQuery } from '../useApi';

export type FeatureImportanceItem = { feature: string; importance: number };
export type FeatureImportanceResponse = { items: FeatureImportanceItem[] };

export const useFeatureImportanceQuery = (sampleSize: number) =>
  useApiQuery<FeatureImportanceResponse>({
    queryKey: ['model', 'feature-importance'],
    queryOptions: {
      endpoint: `/api/model/feature?sampleSize=${sampleSize}`,
      authorization: true,
    },
    fetchOptions: {
      enabled: !!sampleSize,
      staleTime: 0,
    },
  });
