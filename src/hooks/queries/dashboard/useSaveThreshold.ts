import { QUERY_KEYS } from '@/hooks/queryKeys';
import { useApiMutation } from '../useApi';

export type ThresholdResponse = {
  status: string;
  threshold: string;
};

export const useSaveThresholdMutation = () =>
  useApiMutation<ThresholdResponse, number>({
    method: 'PUT',
    endpoint: (threshold) => `/proxy/model/threshold?threshold=${threshold}`,
    authorization: true,
    body: (v) => v,
    invalidateKeys: [QUERY_KEYS.weight],
  });
