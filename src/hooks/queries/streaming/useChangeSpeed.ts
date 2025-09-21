// src/hooks/queries/streaming/useChangeSpeed.ts
import { useApiMutation } from '../useApi';

type ChangeSpeedResponse = { status: string; speed: string };

export const useChangeSpeed = () =>
  useApiMutation<ChangeSpeedResponse, number>({
    method: 'PUT',
    endpoint: (speedMultiplier) =>
      `/proxy/streaming/speed?speedMultiplier=${speedMultiplier}`, // ✅
    authorization: true,
  });
