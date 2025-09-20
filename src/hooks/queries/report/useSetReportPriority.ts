// hooks/queries/report/useSetReportPriority.ts
import { PriorityLevel } from '@/types/report-types';
import { useApiMutation } from '../useApi';

type SetPriorityArgs = {
  reportId: number;
  priority: PriorityLevel;
};

export const useSetReportPriority = () =>
  useApiMutation<void, SetPriorityArgs>({
    method: 'POST',
    endpoint: ({ reportId, priority }) =>
      `/proxy/reports/${reportId}/priority?priority=${priority}`,
    authorization: true,
  });
