'use client';

import TablePlaceholder from '@/components/dashboard/TablePlaceholder';

export default function TransactionsPage() {
  return (
    <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
      <h2 className='text-xl font-semibold text-slate-200 mb-4'>거래 내역</h2>
      <div className='min-h-[600px]'>
        <TablePlaceholder />
      </div>
    </div>
  );
}
