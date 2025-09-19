// hooks/queries/report/useSetReportPriority.ts
import { useApiMutation } from '../useApi';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SetPriorityArgs = { reportId: number; priority: PriorityLevel };

// 응답 스펙이 없다면 void로 둡니다. 필요하면 타입 넣으세요.
export const useSetReportPriority = () =>
  useApiMutation<void, SetPriorityArgs>({
    method: 'POST',
    endpoint: ({ reportId, priority }) =>
      `/proxy/reports/${reportId}/priority?priority=${encodeURIComponent(
        priority
      )}`,
    authorization: true,
  });
