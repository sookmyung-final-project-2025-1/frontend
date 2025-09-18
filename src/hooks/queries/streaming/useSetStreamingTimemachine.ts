import { useApiMutation } from '../useApi';

type StreamingTimemachineArgs = {
  startTime: string;
  speedMultiplier: string;
};

export const useSetStreamingTimemachine = () => {
  return useApiMutation<void, StreamingTimemachineArgs>({
    method: 'POST',
    endpoint: (args: StreamingTimemachineArgs) =>
      `/proxy/streaming/start/timemachine?startTime=${args.startTime}&speedMultiplier=${args.speedMultiplier}`,
    authorization: true,
  });
};
