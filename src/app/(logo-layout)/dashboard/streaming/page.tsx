'use client';

import StreamingDashboard from '@/components/streaming/StreamingDashboard';
import MockStreamingDashboard from '@/components/streaming/mock/MockStreamingDashboard';

const USE_MOCK_STREAMING =
  (process.env.NEXT_PUBLIC_STREAMING_MOCK ??
    (process.env.NODE_ENV !== 'production' ? '1' : '0')) === '1';

export default function StreamingPage() {
  return (
    <div className='p-6'>
      {USE_MOCK_STREAMING ? <MockStreamingDashboard /> : <StreamingDashboard />}
    </div>
  );
}
