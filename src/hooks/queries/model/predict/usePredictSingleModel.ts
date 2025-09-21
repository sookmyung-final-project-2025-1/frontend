import { QUERY_KEYS } from '@/hooks/queryKeys';
import { useApiMutation } from '../../useApi';

type SingleModelResponse = {
  transactionId: number;
  amount: number;
  productCode: string;
};

export const usePredictSingleModel = () =>
  useApiMutation<SingleModelResponse, string>({
    method: 'POST',
    endpoint: (model) =>
      `/proxy/model/predict/single/${encodeURIComponent(model)}`,
    authorization: true,
    invalidateKeys: [QUERY_KEYS.model],
  });
