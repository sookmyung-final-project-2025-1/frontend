import { TransactionType } from '@/types/transaction.schema';
import { useApiMutation } from '../../useApi';

export const useCreateSampleTransaction = () => {
  return useApiMutation<TransactionType, void>({
    method: 'POST',
    endpoint: '/proxy/test/create-sample-transaction',
    authorization: true,
  });
};
