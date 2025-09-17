import { useApiMutation } from '../useApi';

export type ThresholdResponse = {
  additionProp1: {};
  additionProp2: {};
  additionProp3: {};
};

export const useSaveThresholdMutation = () =>
  useApiMutation<ThresholdResponse, number>({
    method: 'PUT',
    endpoint: (threshold) => `/proxy/model/threshold?threshold=${threshold}`,
    authorization: true,
    body: (v) => v,
  });
