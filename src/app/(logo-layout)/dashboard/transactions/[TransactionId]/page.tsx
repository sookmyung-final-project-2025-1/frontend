import TransactionDetailClient from '../../../../../components/transactions/TransactionDetailClient';

export default function TransactionDetailPage({
  params,
}: {
  params: { transactionId: string };
}) {
  return <TransactionDetailClient transactionId={params.transactionId} />;
}
