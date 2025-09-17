import { QUERY_KEYS } from '@/hooks/queryKeys';
import { useApiMutation, useApiQuery } from '../useApi';

export type WeightsResponse = {
  additionProp1: {};
  additionProp2: {};
  additionProp3: {};
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
    authorization: false,
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
  });
