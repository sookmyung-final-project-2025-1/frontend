import { useApiQuery } from '../useApi';

// export type HighRiskTransaction = {
//   transactionId: number;
//   amount: number;
//   fraudScore: number;
//   timestamp: string;
// };

export type HighRiskTransaction = {
  userId: number;
  amount: number;
  fraudScore: number;
  merchant: string;
  predictionTime: string;
};

export const useHighRiskTransaction = (limit: number) => {
  const params = new URLSearchParams();
  if (Number.isFinite(limit)) params.set('limit', String(limit));

  const endpoint = `/proxy/dashboard/high-risk-transactions?${params.toString()}`;

  return useApiQuery<HighRiskTransaction[]>({
    queryKey: ['dashboard', 'highRisk', limit],
    queryOptions: {
      endpoint,
      authorization: true,
    },
    fetchOptions: {
      enabled: Number.isFinite(limit) && limit > 0,
    },
  });
};
