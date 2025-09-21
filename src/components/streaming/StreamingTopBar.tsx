'use client';

import { useEffect, useRef, useState } from 'react';
import type { StreamMeta, TimeRange } from './types';

type Props = {
  playing: boolean;
  speed: number;
  online: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSpeedChange: (v: number) => void;
  onSeek: (iso: string) => void;
  virtualTime: string;

  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;

  currentPosition: number; // 0..100 %
  onPositionChange: (pct: number) => void;

  totalDuration: number; // 시간 단위
  onRefresh: () => void;
  loading: boolean;

  // ✅ null/undefined 모두 허용 (TopBarContainer/대시보드에서 넘기는 값과 호환)
  streamMeta?: StreamMeta | null;
};

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
  loading,
  streamMeta,
}: Props) {
  const [previewPos, setPreviewPos] = useState(currentPosition);
  const [seekInput, setSeekInput] = useState('');
  const [dragging, setDragging] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dragging) setPreviewPos(currentPosition);
  }, [currentPosition, dragging]);

  useEffect(() => {
    if (streamMeta?.currentVirtualTime)
      setSeekInput(streamMeta.currentVirtualTime);
  }, [streamMeta?.currentVirtualTime]);

  const timeRangeLabels: Record<TimeRange, string> = {
    '24h': '24시간',
    '7d': '7일',
    '30d': '30일',
  };

  const clientXToPct = (clientX: number) => {
    if (!barRef.current) return previewPos;
    const rect = barRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(100, (x / rect.width) * 100));
  };

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const p = clientXToPct(e.clientX);
    setPreviewPos(p);
    onPositionChange(p);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
    setPreviewPos(clientXToPct(e.clientX));
  };
  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    setPreviewPos(clientXToPct(e.clientX));
  };
  const handleMouseUp = () => {
    if (!dragging) return;
    setDragging(false);
    onPositionChange(previewPos);
  };
  useEffect(() => {
    if (!dragging) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, previewPos]);

  const formatTime = (percentage: number) => {
    const totalSec = totalDuration * 3600;
    const sec = (totalSec * percentage) / 100;
    if (totalDuration >= 24) {
      const d = Math.floor(sec / 86400);
      const h = Math.floor((sec % 86400) / 3600);
      return `${d}일 ${h}시간`;
    }
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}:${String(m).padStart(2, '0')}`;
  };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSeek(seekInput);
  };

  const isoNow = new Date().toISOString();
  const isoNowNoMs = isoNow.replace(/\.\d{3}Z$/, 'Z');

  return (
    <div className='space-y-4'>
      <div className='flex items-start justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Fraud Detection Dashboard</h1>
          <p className='text-sm text-slate-400'>
            Virtual Time: {virtualTime || '-'} · Speed: {speed}x ·{' '}
            <span className='uppercase'>{streamMeta?.mode || ''}</span>
            {!online && <span className='ml-2 text-amber-300'>오프라인</span>}
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <div className='flex rounded-lg bg-slate-800 border border-slate-700 p-1'>
            {(['24h', '7d', '30d'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => onTimeRangeChange(r)}
                disabled={loading}
                className={`px-3 py-1 text-sm rounded-md transition-colors disabled:opacity-50 ${
                  timeRange === r
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {timeRangeLabels[r]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className='space-y-3'>
        {/* 진행 바 */}
        <div className='space-y-2'>
          <div className='flex justify-between text-xs text-slate-400'>
            <span>시작</span>
            <span className='text-slate-300'>
              {formatTime(previewPos)} / {formatTime(100)}
            </span>
            <span>현재</span>
          </div>
          <div
            ref={barRef}
            className='relative h-2 bg-slate-700 rounded-full cursor-pointer hover:h-3 transition-all'
            onMouseDown={handleMouseDown}
            onClick={handleBarClick}
          >
            <div
              className='absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all'
              style={{ width: `${previewPos}%` }}
            />
            <div
              className='absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-lg cursor-grab active:cursor-grabbing transition-transform hover:scale-110'
              style={{ left: `calc(${previewPos}% - 8px)` }}
            />
          </div>
        </div>

        {/* 컨트롤 */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex gap-1'>
              <button
                onClick={onPlay}
                disabled={playing || loading}
                className='px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2'
              >
                ▶ 재생
              </button>
              <button
                onClick={onPause}
                disabled={!playing || loading}
                className='px-4 py-2 rounded-lg border border-slate-600 hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2'
              >
                ⏸ 일시정지
              </button>
            </div>

            <div className='flex items-center gap-2'>
              <span className='text-sm text-slate-400'>배속</span>
              <select
                value={speed}
                onChange={(e) => onSpeedChange(Number(e.target.value))}
                disabled={loading}
                className='px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-sm outline-none focus:border-blue-500 disabled:opacity-50'
              >
                {[0.5, 1, 2, 5, 10, 20, 50].map((v) => (
                  <option key={v} value={v}>
                    {v}x
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <span className='text-sm text-slate-400'>시점 이동</span>
            <input
              placeholder={isoNowNoMs}
              value={seekInput}
              onChange={(e) => setSeekInput(e.target.value)}
              onKeyDown={handleEnter}
              disabled={loading}
              className='w-64 px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-sm outline-none focus:border-blue-500 disabled:opacity-50'
            />
          </div>
        </div>
      </div>
    </div>
  );
}
