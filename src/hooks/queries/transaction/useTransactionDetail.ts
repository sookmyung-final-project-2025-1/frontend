import { TransactionType } from '@/types/transaction.schema';
import { useApiQuery } from '../useApi';

export const useTransactionDetail = (transactionId: string) => {
  const transactionDetailParameter = new URLSearchParams({ transactionId });

  return useApiQuery<TransactionType>({
    queryKey: ['transaction', 'detail', transactionId],
    queryOptions: {
      endpoint: `/proxy/transaction?${transactionDetailParameter}`,
      authorization: true,
    },
  });
};
