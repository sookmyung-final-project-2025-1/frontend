'use client';

import { FraudTrendInterval, makeRange } from '@/lib/faudTrendUtils';
import { useMemo, useState } from 'react';
import DataPanel from './DataPanel';
import Controls from './FraudController';

export default function FraudTrend() {
  // 컨트롤: 상시 표시
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [interval, setInterval] = useState<FraudTrendInterval>('daily');

  // interval에 맞는 범위 계산 (렌더마다 동일 입력일 때 메모)
  const { startTime, endTime } = useMemo(
    () => makeRange(selectedDate, interval),
    [selectedDate, interval]
  );

  return (
    <div className='space-y-8'>
      {/* 헤더/컨트롤: 항상 보이도록 */}
      <div>
        <p className='text-slate-400 text-sm'>
          {new Date(selectedDate).toLocaleDateString('ko-KR')}
          {' · '}
          {interval}
          {' · '}
          <span className='text-slate-500'>
            start={startTime}, end={endTime}
          </span>
        </p>
      </div>

      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
        <Controls
          selectedDate={selectedDate}
          interval={interval}
          onDateChange={setSelectedDate}
          onIntervalChange={(v) => setInterval(v)}
        />
      </div>

      {/* 결과 패널 (여기서만 로딩/에러/빈 데이터 처리) */}
      <DataPanel startTime={startTime} endTime={endTime} interval={interval} />
    </div>
  );
}
