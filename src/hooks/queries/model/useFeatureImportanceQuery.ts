import { useApiQuery } from '../useApi';

export type FeatureImportanceItem = {
  C1: number;
  C2: number;
  C3: number;
  C4: number;
  amount: number;
  hour: number;
  location: number;
  merchant_category: number;
};
export type FeatureImportanceResponse = {
  calculatedAt: string;
  featureImportance: FeatureImportanceItem;
  sampleSize: number;
};

export const useFeatureImportanceQuery = (sampleSize: number) =>
  useApiQuery<FeatureImportanceResponse>({
    queryKey: ['model', 'feature-importance', sampleSize],
    queryOptions: {
      endpoint: `/proxy/model/feature?sampleSize=${sampleSize}`,
      authorization: true,
    },
    fetchOptions: {
      enabled: !!sampleSize,
      staleTime: 20_000,
    },
  });
