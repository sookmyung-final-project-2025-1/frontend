'use client';

import StreamingDetectionChart from '@/components/streaming/StreamingDetectionChart';
import { useStreaming } from '@/contexts/StreamingContext';

export default function StreamingPage() {
  const { mode, data, status } = useStreaming();

  return (
    <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
      <h2 className='text-xl font-semibold text-slate-200 mb-4'>스트리밍</h2>
      <div className='h-[500px]'>
        <StreamingDetectionChart
          data={data}
          playing={mode === 'realtime' ? status.playing : false}
          currentPosition={100}
          threshold={0.5}
          timeRange='24h'
          virtualTime={status.virtualTime ?? ''}
        />
      </div>
    </div>
  );
}
