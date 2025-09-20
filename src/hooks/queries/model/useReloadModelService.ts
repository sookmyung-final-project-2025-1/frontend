import { useApiMutation } from '@/hooks/queries/useApi';
import type { ReloadModelResponse } from '@/types/model-type';

export const useReloadModelService = () =>
  useApiMutation<ReloadModelResponse, void>({
    method: 'POST',
    endpoint: '/proxy/model/service/reload',
    authorization: true,
  });
