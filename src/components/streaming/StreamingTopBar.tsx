'use client';

import { useEffect, useMemo, useState } from 'react';
import type { StreamMeta, TimeRange } from './types';

type Props = {
  playing: boolean;
  speed: number;
  online: boolean;

  onPlay: () => Promise<void> | void;
  onPause: () => Promise<void> | void;
  onSpeedChange: (v: number) => Promise<void> | void;
  onSeek: (iso: string) => Promise<void> | void;

  virtualTime?: string;
  timeRange: TimeRange;
  onTimeRangeChange: (r: TimeRange) => void;

  currentPosition: number; // 0..100
  onPositionChange: (pct: number) => Promise<void> | void;

  totalDuration: number; // hour 단위 표기용
  onRefresh: () => void;
  loading: boolean;

  streamMeta?: StreamMeta | null;
};

function useClientPlaceholder(virtualTime?: string) {
  const [ph, setPh] = useState<string>(''); // SSR엔 빈 문자열로 렌더해서 hydration mismatch 방지
  useEffect(() => {
    if (virtualTime && !Number.isNaN(Date.parse(virtualTime))) {
      setPh(new Date(virtualTime).toISOString());
    } else {
      setPh(new Date().toISOString());
    }
  }, [virtualTime]);
  return ph;
}

export default function StreamingTopBar({
  playing,
  speed,
  online,
  onPlay,
  onPause,
  onSpeedChange,
  onSeek,
  virtualTime,
  timeRange,
  onTimeRangeChange,
  currentPosition,
  onPositionChange,
  totalDuration,
  onRefresh,
  loading,
  streamMeta,
}: Props) {
  const ph = useClientPlaceholder(virtualTime);

  const [seekInput, setSeekInput] = useState<string>('');
  const [speedInput, setSpeedInput] = useState<string>(String(speed));

  useEffect(() => {
    setSpeedInput(String(speed));
  }, [speed]);

  const resolvedPositionPct = useMemo(
    () => currentPosition.toFixed(1),
    [currentPosition]
  );

  const handleEnterSeek = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const s = (seekInput || '').trim();
    if (!s) return;
    if (Number.isFinite(Date.parse(s))) {
      await onSeek(new Date(s).toISOString());
      setSeekInput('');
    } else {
      // 잘못된 입력은 무시
    }
  };

  const handleSpeedApply = async () => {
    const next = Number(speedInput);
    if (!Number.isFinite(next) || next <= 0) return;
    await onSpeedChange(next);
  };

  return (
    <div className='space-y-4'>
      {/* 상단 상태/액션 바 */}
      <div className='flex flex-wrap items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 p-3'>
        <div className='flex items-center gap-2'>
          <span
            className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-yellow-500'}`}
            title={
              online
                ? 'WebSocket connected'
                : 'WebSocket connecting/disconnected'
            }
          />
          <span className='text-sm text-slate-300'>
            {online ? '온라인' : '연결 중...'}
          </span>
        </div>

        <div className='ml-auto flex items-center gap-2'>
          {!playing ? (
            <button
              onClick={() => onPlay()}
              className='rounded-md bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-500 disabled:opacity-50'
              disabled={loading}
            >
              ▶ 재생
            </button>
          ) : (
            <button
              onClick={() => onPause()}
              className='rounded-md bg-slate-700 px-3 py-1 text-sm text-white hover:bg-slate-600 disabled:opacity-50'
              disabled={loading}
            >
              ⏸ 일시정지
            </button>
          )}

          <button
            onClick={onRefresh}
            className='rounded-md bg-slate-800 px-3 py-1 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50'
            disabled={loading}
            title='상태 새로고침'
          >
            ↻ 새로고침
          </button>
        </div>
      </div>

      {/* 타임머신 & 속도 & 범위 */}
      <div className='space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-3'>
        <div className='flex flex-wrap items-center gap-3'>
          {/* 타임머신 입력 */}
          <div className='flex items-center gap-2'>
            <label className='text-sm text-slate-300'>타임머신 시점</label>
            <input
              placeholder={ph} // SSR에선 "" → 클라에서만 채움
              suppressHydrationWarning
              value={seekInput}
              onChange={(e) => setSeekInput(e.target.value)}
              onKeyDown={handleEnterSeek}
              disabled={loading}
              className='w-64 rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-sm outline-none'
            />
            <button
              onClick={async () => {
                if (!seekInput) return;
                if (!Number.isFinite(Date.parse(seekInput))) return;
                await onSeek(new Date(seekInput).toISOString());
                setSeekInput('');
              }}
              className='rounded-md bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-500 disabled:opacity-50'
              disabled={
                loading || !seekInput || !Number.isFinite(Date.parse(seekInput))
              }
            >
              이동
            </button>
          </div>

          {/* 속도 제어 */}
          <div className='flex items-center gap-2'>
            <label className='text-sm text-slate-300'>배속</label>
            <input
              type='number'
              step='0.1'
              min='0.1'
              value={speedInput}
              onChange={(e) => setSpeedInput(e.target.value)}
              className='w-20 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm outline-none'
            />
            <button
              onClick={handleSpeedApply}
              className='rounded-md bg-slate-700 px-3 py-1 text-sm text-white hover:bg-slate-600 disabled:opacity-50'
              disabled={loading}
            >
              적용
            </button>
          </div>

          {/* 범위 */}
          <div className='flex items-center gap-2'>
            <label className='text-sm text-slate-300'>범위</label>
            <select
              value={timeRange}
              onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
              className='rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-200 outline-none'
            >
              <option value='24h'>24시간</option>
              <option value='7d'>7일</option>
              <option value='30d'>30일</option>
            </select>
            <span className='text-xs text-slate-400'>총 {totalDuration}h</span>
          </div>
        </div>

        {/* 포지션 슬라이더 */}
        <div className='flex items-center gap-3'>
          <input
            type='range'
            min={0}
            max={100}
            value={currentPosition}
            onChange={(e) => onPositionChange(Number(e.target.value))}
            className='h-1 w-full cursor-pointer appearance-none rounded bg-slate-700 accent-indigo-500'
            disabled={loading}
          />
          <span className='w-16 text-right text-sm text-slate-300'>
            {resolvedPositionPct}%
          </span>
        </div>
      </div>
    </div>
  );
}
