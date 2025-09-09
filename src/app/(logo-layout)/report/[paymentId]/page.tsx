export default function ReportPage({
  params,
}: {
  params: { paymentId: string };
}) {
  const { paymentId } = params;
  return (
    <div>
      <h1>거래 </h1>
      {paymentId}
    </div>
  );
}
