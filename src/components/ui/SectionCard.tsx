'use client';

import { ReactNode } from 'react';

export default function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-6'>
      <h3 className='text-lg font-semibold text-slate-200 mb-4'>{title}</h3>
      {children}
    </div>
  );
}
