// src/components/streaming/StreamingTopBar.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';

type TimeRange = '24h' | '7d' | '30d';

export type StreamMeta = {
  currentVirtualTime: string; // ISO
  isPaused: boolean;
  isStreaming: boolean;
  mode: 'TIMEMACHINE' | 'REALTIME' | string;
  progress?: number; // 0..1  ← 옵셔널
  speedMultiplier: number;
  updatedAt: string; // ISO
};

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
  onPositionChange: (position: number) => void;

  totalDuration: number; // hours
  onRefresh: () => void;
  loading: boolean;

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
  onRefresh,
  loading,
  streamMeta,
}: Props) {
  const [previewPos, setPreviewPos] = useState<number>(currentPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [seekInput, setSeekInput] = useState('');
  const progressRef = useRef<HTMLDivElement>(null);

  const modeLabel =
    streamMeta?.mode === 'TIMEMACHINE'
      ? 'TIMEMACHINE'
      : streamMeta?.mode === 'REALTIME'
        ? 'REALTIME'
        : (streamMeta?.mode ?? '');

  // 외부 값 동기화 (드래그 중이면 유지)
  useEffect(() => {
    if (!isDragging) setPreviewPos(currentPosition);
  }, [currentPosition, isDragging]);

  const resolvedPlaying =
    streamMeta != null
      ? streamMeta.isStreaming && !streamMeta.isPaused
      : playing;
  const resolvedSpeed = streamMeta?.speedMultiplier ?? speed;
  const resolvedVirtualTime = streamMeta?.currentVirtualTime ?? virtualTime;

  useEffect(() => {
    if (streamMeta?.currentVirtualTime)
      setSeekInput(streamMeta.currentVirtualTime);
  }, [streamMeta?.currentVirtualTime]);

  const timeRangeLabels: Record<TimeRange, string> = {
    '24h': '24시간',
    '7d': '7일',
    '30d': '30일',
  };

  const clientXToPercent = (clientX: number) => {
    if (!progressRef.current) return previewPos;
    const rect = progressRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    return Math.max(0, Math.min(100, (x / width) * 100));
  };

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const pct = clientXToPercent(e.clientX);
    setPreviewPos(pct);
    onPositionChange(pct);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault(); // 드래그 시 기본선택 방지
    setIsDragging(true);
    setPreviewPos(clientXToPercent(e.clientX));
  };
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPreviewPos(clientXToPercent(e.clientX));
  };
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onPositionChange(previewPos);
    }
  };

  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, previewPos]);

  const formatTime = (percentage: number) => {
    const totalSeconds = totalDuration * 3600;
    const currentSeconds = (totalSeconds * percentage) / 100;
    if (totalDuration >= 24) {
      const days = Math.floor(currentSeconds / 86400);
      const hours = Math.floor((currentSeconds % 86400) / 3600);
      return `${days}일 ${hours}시간`;
    }
    const hours = Math.floor(currentSeconds / 3600);
    const minutes = Math.floor((currentSeconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleSeekKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // ✅ form submit/네비게이션 방지
      e.stopPropagation();
      onSeek(seekInput);
    }
  };

  const updatedBadge = streamMeta?.updatedAt
    ? ` · Updated ${timeAgo(streamMeta.updatedAt)}`
    : '';

  return (
    <div className='space-y-4'>
      {/* 상단: 제목/상태 */}
      <div className='flex items-start justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Fraud Detection Dashboard</h1>
          <p className='text-sm text-slate-400'>
            Virtual Time: {resolvedVirtualTime || '-'} · Speed: {resolvedSpeed}x
            {streamMeta && (
              <>
                {' · '}
                <span className='uppercase'>{modeLabel}</span>
                {updatedBadge}
              </>
            )}
            {!online && (
              <span className='ml-2 text-amber-300'>
                오프라인/서버 이슈 감지
              </span>
            )}
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <div className='flex rounded-lg bg-slate-800 border border-slate-700 p-1'>
            {(['24h', '7d', '30d'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                disabled={loading}
                className={`px-3 py-1 text-sm rounded-md transition-colors disabled:opacity-50 ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {timeRangeLabels[range]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 프로그레스 + 컨트롤 */}
      <div className='space-y-3'>
        <div className='space-y-2'>
          <div className='flex justify-between text-xs text-slate-400'>
            <span>시작</span>
            <span className='text-slate-300'>
              {formatTime(previewPos)} / {formatTime(100)}
            </span>
            <span>현재</span>
          </div>

          <div
            ref={progressRef}
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

        <div className='flex items-center justify-between'>
          {/* 좌측: 재생/일시정지 + 배속 */}
          <div className='flex items-center gap-3'>
            <div className='flex gap-1'>
              <button
                type='button'
                onClick={onPlay}
                disabled={resolvedPlaying || loading}
                className='px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
              >
                <span>▶</span>
                <span>재생</span>
              </button>
              <button
                type='button'
                onClick={onPause}
                disabled={!resolvedPlaying || loading}
                className='px-4 py-2 rounded-lg border border-slate-600 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
              >
                <span>⏸</span>
                <span>일시정지</span>
              </button>
            </div>

            <div className='flex items-center gap-2'>
              <span className='text-sm text-slate-400'>배속</span>
              <select
                value={resolvedSpeed}
                onChange={(e) => onSpeedChange(Number(e.target.value))}
                disabled={loading}
                className='px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-sm outline-none focus:border-blue-500 disabled:opacity-50'
              >
                {[0.5, 1, 2, 5, 10, 20, 50].map((option) => (
                  <option key={option} value={option}>
                    {option}x
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 우측: 직접 시점 이동 */}
          <div className='flex items-center gap-2'>
            <span className='text-sm text-slate-400'>시점 이동</span>
            <input
              placeholder='2018-02-03T12:00:00Z'
              value={seekInput}
              onChange={(e) => setSeekInput(e.target.value)}
              onKeyDown={handleSeekKeyDown}
              disabled={loading}
              className='w-64 px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-sm outline-none focus:border-blue-500 disabled:opacity-50'
            />
          </div>
        </div>
      </div>

      {resolvedPlaying && (
        <div className='flex items-center justify-center'>
          <div className='flex items-center gap-2 px-4 py-2 bg-blue-900/30 border border-blue-700/50 rounded-full text-sm text-blue-200'>
            <div className='w-2 h-2 bg-blue-400 rounded-full animate-pulse' />
            <span>
              스트리밍 재생 중 ({resolvedSpeed}x 배속
              {streamMeta?.mode ? ` · ${streamMeta.mode}` : ''})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  if (!Number.isFinite(diff)) return '';
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h / 24);
  return `${dd}d ago`;
}
