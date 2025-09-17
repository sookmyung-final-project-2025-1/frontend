'use client';
import React from 'react';

type Props = {
  playing: boolean;
  speed: number;
  online: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSpeedChange: (v: number) => void;
  onSeek: (iso: string) => void;
  virtualTime: string;
};

export default function TopBar({
  playing,
  speed,
  online,
  onPlay,
  onPause,
  onSpeedChange,
  onSeek,
  virtualTime,
}: Props) {
  const handleSeekKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSeek((e.target as HTMLInputElement).value);
  };

  return (
    <div className='flex items-center justify-between'>
      <div className='w-[450px]'>
        <h1 className='text-2xl font-semibold'>Fraud Detection Dashboard</h1>
        <p className='text-sm text-slate-400'>
          Virtual Time: {virtualTime || '-'} · Speed: {speed}x
        </p>
        {!online && (
          <div className='mt-1 text-xs text-amber-300'>
            오프라인/서버 이슈 감지
          </div>
        )}
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <button
          type='button'
          onClick={onPlay}
          disabled={playing}
          className='px-4 py-2 rounded-xl bg-slate-100 text-slate-900 hover:opacity-90 disabled:opacity-50'
        >
          ▶ 재생
        </button>
        <button
          type='button'
          onClick={onPause}
          disabled={!playing}
          className='px-4 py-2 rounded-xl border border-slate-600 hover:bg-slate-800 disabled:opacity-50'
        >
          ⏸ 일시정지
        </button>

        <div className='flex items-center gap-2 ml-4'>
          <span className='text-sm text-slate-400'>배속</span>
          <input
            type='number'
            value={Number.isFinite(speed) ? String(speed) : '10'}
            onChange={(e) =>
              onSpeedChange(parseInt(e.target.value || '10', 10))
            }
            className='w-20 px-2 py-1 rounded-md bg-slate-800 border border-slate-700 outline-none'
          />
        </div>

        <div className='flex items-center gap-2 ml-4'>
          <span className='text-sm text-slate-400'>시점 이동</span>
          <input
            placeholder='2018-02-03T12:00:00Z'
            onKeyDown={handleSeekKeyDown}
            className='w-64 px-2 py-1 rounded-md bg-slate-800 border border-slate-700 outline-none'
          />
        </div>
      </div>
    </div>
  );
}
