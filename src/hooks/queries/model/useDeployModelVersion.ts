import { useApiMutation } from '@/hooks/queries/useApi';
import { QUERY_KEYS } from '@/hooks/queryKeys';
import { DeployModelArgs, DeployModelResponse } from '@/types/model-type';

export const useDeployModelVersion = () =>
  useApiMutation<DeployModelResponse, DeployModelArgs>({
    method: 'POST',
    endpoint: ({ version }) =>
      `/proxy/model/versions/${encodeURIComponent(version)}/deploy`,
    authorization: true,
    invalidateKeys: [QUERY_KEYS.modelVersion],
  });
