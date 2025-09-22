import TransactionDetailClient from '../../../../../components/transactions/TransactionDetailClient';

export default function TransactionDetailPage(props: any) {
  const { TransactionId } = props?.params as { TransactionId: string };
  return <TransactionDetailClient transactionId={TransactionId} />;
}
