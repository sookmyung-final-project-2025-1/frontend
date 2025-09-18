'use client';

import { useHighRiskTransaction } from '@/hooks/queries/dashboard/useHighRiskTransaction';
import { useGetWeight } from '@/hooks/queries/model/useWeights';
import { useState } from 'react';

export default function TablePlaceholder() {
  const [limit, setLimit] = useState<number>(10);
  const presetOptions = [10, 20, 50, 100];

  // 데이터
  const { data: thresholdData, isLoading: thresholdLoading } = useGetWeight();
  const { data = [], isLoading, error } = useHighRiskTransaction(limit);

  const threshold =
    typeof thresholdData?.threshold === 'number'
      ? thresholdData.threshold
      : 0.5;

  const formatAmount = (n: number) =>
    isFinite(n) ? `₩${Math.round(n).toLocaleString('ko-KR')}` : '-';

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '-' : d.toLocaleString('ko-KR');
  };

  const handleSelectLimit = (v: string) => {
    const parsed = parseInt(v, 10);
    if (Number.isFinite(parsed) && parsed > 0) setLimit(parsed);
  };

  const handleInputLimit = (v: string) => {
    const num = parseInt(v, 10);
    if (!Number.isFinite(num)) return;

    const clamped = Math.max(1, Math.min(1000, num));
    setLimit(clamped);
  };

  return (
    <div className='rounded-2xl border border-slate-800 bg-slate-900/40'>
      <div className='p-4'>
        <div className='flex items-center justify-between gap-3'>
          <div className='text-sm text-slate-300'>탐색 / 필터 </div>

          <div className='flex items-center gap-2'>
            <label className='text-xs text-slate-400'>표시 개수</label>
            <select
              value={presetOptions.includes(limit) ? String(limit) : 'custom'}
              onChange={(e) =>
                e.target.value === 'custom'
                  ? null
                  : handleSelectLimit(e.target.value)
              }
              className='px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs'
            >
              {presetOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}개
                </option>
              ))}
              <option value='custom'>직접 입력</option>
            </select>

            <input
              type='number'
              min={1}
              max={1000}
              value={limit}
              onChange={(e) => handleInputLimit(e.target.value)}
              className='w-20 px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs'
              title='1~1000 사이 숫자'
            />

            {/* <button
              type='button'
              className='px-3 py-1.5 rounded-xl border border-slate-600 hover:bg-slate-800 text-xs'
            >
              전체 보기
            </button> */}
          </div>
        </div>

        <div className='mt-4 grid grid-cols-5 text-xs text-slate-400'>
          <div>시간</div>
          <div>사용자ID</div>
          <div>금액</div>
          <div>최종확률</div>
          <div>가맹점</div>
        </div>

        <div className='mt-2'>
          {isLoading ? (
            <div className='text-slate-400 text-sm'>불러오는 중…</div>
          ) : error ? (
            <div className='text-red-400 text-sm'>
              데이터를 불러오지 못했습니다.
            </div>
          ) : data.length === 0 ? (
            <div className='text-slate-400 text-sm'>최근 거래가 없습니다.</div>
          ) : (
            <ul className='divide-y divide-slate-800'>
              {data.map((tx) => {
                const labelBad = tx.fraudScore >= threshold;
                return (
                  <li
                    key={tx.userId}
                    className='py-2 grid grid-cols-5 items-center text-sm text-slate-200'
                  >
                    <div className='truncate'>
                      {formatTime(tx.predictionTime)}
                    </div>
                    <div className='truncate text-slate-400 font-mono'>
                      {tx.userId}
                    </div>
                    <div className='truncate'>{formatAmount(tx.amount)}</div>
                    <div className='truncate'>
                      {(tx.fraudScore * 100).toFixed(1)}%
                    </div>
                    <div className='truncate'>{tx.merchant}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className='mt-2 text-slate-500 text-xs'>
          (최근 {limit}건 기준 • 기준 임계치{' '}
          {thresholdLoading ? '…' : threshold})
        </div>
      </div>
    </div>
  );
}
