import { QUERY_KEYS } from '@/hooks/queryKeys';
import { useApiMutation, useApiQuery } from '../useApi';

export type WeightsResponse = {
  lgbm: number;
  xgboost: number;
  catboost: number;
  threshold: number;
};

export type WeightsRequest = {
  lgbmWeight: number;
  xgboostWeight: number;
  catboostWeight: number;
  autoNormalize: boolean;
  validWeightSum: boolean;
};

export const useSaveWeightsMutation = () =>
  useApiMutation<WeightsResponse, WeightsRequest>({
    method: 'PUT',
    endpoint: '/proxy/model/weights',
    authorization: true,
    body: (v) => v,
    invalidateKeys: [QUERY_KEYS.weight],
  });

export const useGetWeight = () =>
  useApiQuery<WeightsResponse>({
    queryKey: QUERY_KEYS.weight,
    queryOptions: {
      endpoint: '/proxy/model/weights',
      authorization: true,
    },
    fetchOptions: {
      staleTime: 20_000,
    },
  });
