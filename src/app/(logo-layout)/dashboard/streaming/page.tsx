'use client';

import TopBarContainer from '@/components/streaming/TopBarContainer';
import { StreamingProvider } from '@/contexts/StreamingContext';

export default function StreamingPage() {
  return (
    <StreamingProvider>
      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
        <TopBarContainer />
      </div>
    </StreamingProvider>
  );
}
