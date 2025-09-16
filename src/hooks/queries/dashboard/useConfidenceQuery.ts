import { useApiQuery } from '../useApi';

type TimeSeriesItem = {
  timestamp: string;
  confidenceScore: number;
  transactionCount: number;
  period: string;
};

export type ConfidenceResponse = {
  currentConfidenceScore: number;
  calculatedAt: string;
  timeSeries: TimeSeriesItem[];
};

export type UseConfidenceQueryArgs = Readonly<{
  startTime: string;
  endTime: string;
  period?: 'hourly' | 'daily' | 'weekly';
}>;

export const useConfidenceQuery = (args: UseConfidenceQueryArgs) => {
  const { startTime, endTime, period = 'hourly' } = args;

  const condfidenceParameters = new URLSearchParams({
    startTime,
    endTime,
    period,
  }).toString();
  const isEnabled = Boolean(startTime && endTime);

  return useApiQuery<ConfidenceResponse>({
    queryKey: ['model', 'confidence', startTime, endTime, period],
    queryOptions: {
      endpoint: `/api/model/confidence?${condfidenceParameters}`,
      authorization: true,
    },
    fetchOptions: { enabled: !!isEnabled },
  });
};
