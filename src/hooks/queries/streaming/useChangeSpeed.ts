import { useApiMutation } from '../useApi';

type ChangeSpeedResponse = {
  status: string;
  speed: string;
};

export const useChangeSpeed = () =>
  useApiMutation<ChangeSpeedResponse, number>({
    method: 'PUT',
    endpoint: (speedMultiplier) =>
      `/proxy/streaming/speed?multiplier=${speedMultiplier}`,
    authorization: true,
  });
