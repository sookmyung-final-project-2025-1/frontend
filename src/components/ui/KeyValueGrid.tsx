'use client';

import { ReactNode } from 'react';

type Item = { k: ReactNode; v: ReactNode };

export default function KeyValueGrid({ items }: { items: Item[] }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
      {items.map((it, idx) => (
        <div
          key={idx}
          className='flex items-start justify-between gap-4 rounded-lg border border-slate-800 bg-slate-900/30 px-4 py-3'
        >
          <div className='text-sm text-slate-400'>{it.k}</div>
          <div className='text-sm text-slate-100 text-right break-words'>
            {it.v ?? '-'}
          </div>
        </div>
      ))}
    </div>
  );
}
