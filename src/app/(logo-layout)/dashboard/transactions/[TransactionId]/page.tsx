import TransactionDetailClient from '../../../../../components/transactions/TransactionDetailClient';

export default function TransactionDetailPage(props: any) {
  const { transactionId } = props?.params as { transactionId: string };
  return <TransactionDetailClient transactionId={transactionId} />;
}
