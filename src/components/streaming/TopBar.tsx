'use client';

import React, { useEffect, useRef, useState } from 'react';

type TimeRange = '24h' | '7d' | '30d';

type Props = {
  playing: boolean;
  speed: number;
  online: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSpeedChange: (v: number) => void;
  onSeek: (iso: string) => void;
  virtualTime: string;
  // 새로운 props
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  currentPosition: number; // 0-100 (%)
  onPositionChange: (position: number) => void;
  totalDuration: number; // 전체 기간 (시간 단위)
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
  timeRange,
  onTimeRangeChange,
  currentPosition,
  onPositionChange,
  totalDuration,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  // 시간 범위별 라벨
  const timeRangeLabels = {
    '24h': '24시간',
    '7d': '7일',
    '30d': '30일',
  };

  // 배속 옵션
  const speedOptions = [0.5, 1, 2, 5, 10, 20, 50];

  // 프로그레스 바 클릭/드래그 핸들러
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(100, (x / width) * 100));

    onPositionChange(percentage);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressClick(e);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(100, (x / width) * 100));

    onPositionChange(percentage);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // 시간 포맷팅
  const formatTime = (percentage: number) => {
    const hours = Math.floor((totalDuration * percentage) / 100);
    const minutes = Math.floor((hours % 1) * 60);
    const displayHours = Math.floor(hours);

    if (totalDuration >= 24) {
      const days = Math.floor(displayHours / 24);
      const remainingHours = displayHours % 24;
      return `${days}일 ${remainingHours}시간`;
    }

    return `${displayHours}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleSeekKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSeek((e.target as HTMLInputElement).value);
  };

  return (
    <div className='space-y-4'>
      {/* 상단: 제목과 기본 정보 */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Fraud Detection Dashboard</h1>
          <p className='text-sm text-slate-400'>
            Virtual Time: {virtualTime || '-'} · Speed: {speed}x
            {!online && (
              <span className='ml-2 text-amber-300'>
                오프라인/서버 이슈 감지
              </span>
            )}
          </p>
        </div>

        {/* 시간 범위 선택 */}
        <div className='flex rounded-lg bg-slate-800 border border-slate-700 p-1'>
          {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
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

      {/* 중간: 재생 컨트롤과 프로그레스 바 */}
      <div className='space-y-3'>
        {/* 프로그레스 바 */}
        <div className='space-y-2'>
          <div className='flex justify-between text-xs text-slate-400'>
            <span>0</span>
            <span className='text-slate-300'>
              {formatTime(currentPosition)} / {formatTime(100)}
            </span>
            <span>{timeRangeLabels[timeRange]}</span>
          </div>

          <div
            ref={progressRef}
            className='relative h-2 bg-slate-700 rounded-full cursor-pointer'
            onMouseDown={handleMouseDown}
          >
            {/* 프로그레스 */}
            <div
              className='absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all'
              style={{ width: `${currentPosition}%` }}
            />

            {/* 드래그 핸들 */}
            <div
              className='absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-lg cursor-grab active:cursor-grabbing transition-transform hover:scale-110'
              style={{ left: `calc(${currentPosition}% - 8px)` }}
            />
          </div>
        </div>

        {/* 재생 컨트롤 */}
        <div className='flex items-center justify-between'>
          {/* 좌측: 재생/일시정지, 배속 */}
          <div className='flex items-center gap-3'>
            <div className='flex gap-1'>
              <button
                type='button'
                onClick={onPlay}
                disabled={playing}
                className='px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1'
              >
                <span>▶</span>
                <span>재생</span>
              </button>
              <button
                type='button'
                onClick={onPause}
                disabled={!playing}
                className='px-4 py-2 rounded-lg border border-slate-600 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1'
              >
                <span>⏸</span>
                <span>일시정지</span>
              </button>
            </div>

            {/* 배속 드롭다운 */}
            <div className='flex items-center gap-2'>
              <span className='text-sm text-slate-400'>배속</span>
              <select
                value={speed}
                onChange={(e) => onSpeedChange(Number(e.target.value))}
                className='px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-sm outline-none focus:border-blue-500'
              >
                {speedOptions.map((option) => (
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
              placeholder={new Date().toISOString()}
              onKeyDown={handleSeekKeyDown}
              className='w-48 px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-sm outline-none focus:border-blue-500'
            />
          </div>
        </div>
      </div>

      {/* 하단: 추가 정보 (선택사항) */}
      {playing && (
        <div className='flex items-center justify-center'>
          <div className='flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-700/50 rounded-full text-sm text-blue-200'>
            <div className='w-2 h-2 bg-blue-400 rounded-full animate-pulse' />
            <span>실시간 재생 중</span>
          </div>
        </div>
      )}
    </div>
  );
}
