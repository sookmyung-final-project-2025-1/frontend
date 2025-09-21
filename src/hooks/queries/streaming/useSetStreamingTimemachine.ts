// src/hooks/queries/streaming/useSetStreamingTimemachine.ts
import { useApiMutation } from '../useApi';

type StreamingTimemachineArgs = {
  startTime: string; // ISO
  speedMultiplier: number; // ✅ number
};

export const useSetStreamingTimemachine = () =>
  useApiMutation<void, StreamingTimemachineArgs>({
    method: 'POST',
    endpoint: (args) =>
      `/proxy/streaming/start/timemachine?startTime=${encodeURIComponent(
        args.startTime
      )}&speedMultiplier=${args.speedMultiplier}`, // ✅
    authorization: true,
  });
