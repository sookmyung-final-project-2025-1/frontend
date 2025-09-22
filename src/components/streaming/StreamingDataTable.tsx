'use client';

import { useCallback, useMemo } from 'react';
import type { DetectionResult } from './types';

export default function StreamingDataTable({
  data,
}: {
  data: DetectionResult[];
}) {
  const formatDisplayTime = useCallback((iso: string) => {
    if (!iso) return '-';
    const parsed = Date.parse(iso);
    if (!Number.isFinite(parsed)) return iso;
    const d = new Date(parsed);
    const now = new Date();
    d.setFullYear(now.getFullYear());
    return d.toLocaleString('ko-KR', {
      hour12: false,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, []);

  const displayData = useMemo(() => data.slice(-200).reverse(), [data]); // 최근 200개, 최신 위로

  const stats = useMemo(() => {
    if (!data.length) return { total: 0, fraud: 0, normal: 0, fraudRate: 0 };
    const fraud = data.filter((d) => d.prediction === 'fraud').length;
    const normal = data.length - fraud;
    const fraudRate = (fraud / data.length) * 100;
    return { total: data.length, fraud, normal, fraudRate };
  }, [data]);

  return (
    <div className='rounded-xl border border-slate-700 bg-slate-900 p-4'>
      <div className='mb-4 flex items-center justify-between'>
        <h4 className='font-semibold'>최근 거래 내역</h4>
        <div className='flex gap-4 text-sm text-slate-400'>
          <span>전체: {stats.total}</span>
          <span className='text-red-400'>사기: {stats.fraud}</span>
          <span className='text-emerald-400'>정상: {stats.normal}</span>
          <span>사기율: {stats.fraudRate.toFixed(1)}%</span>
        </div>
      </div>

      <div className='overflow-x-auto'>
        <table className='min-w-full text-sm'>
          <thead className='text-left text-slate-300 border-b border-slate-700'>
            <tr>
              <th className='py-2 pr-4 font-medium'>시간</th>
              <th className='py-2 pr-4 font-medium'>예측</th>
              <th className='py-2 pr-4 font-medium'>스코어</th>
              <th className='py-2 pr-4 font-medium'>신뢰도</th>
              <th className='py-2 pr-4 font-medium'>LGBM</th>
              <th className='py-2 pr-4 font-medium'>XGB</th>
              <th className='py-2 pr-4 font-medium'>CAT</th>
            </tr>
          </thead>
          <tbody className='text-slate-200'>
            {displayData.map((r, i) => (
              <tr
                key={`${r.timestamp}-${i}`}
                className={`border-t border-slate-800 hover:bg-slate-800/30 ${i === 0 ? 'bg-slate-800/20' : ''}`}
              >
                <td className='py-2 pr-4 text-slate-300'>
                  {formatDisplayTime(r.timestamp)}
                </td>
                <td className='py-2 pr-4'>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.prediction === 'fraud'
                        ? 'bg-red-900/40 text-red-300 border border-red-800/50'
                        : 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/50'
                    }`}
                  >
                    {r.prediction === 'fraud' ? '🚨 사기' : '✅ 정상'}
                  </span>
                </td>
                <td className='py-2 pr-4 font-mono'>
                  <span
                    className={
                      r.score > 0.5 ? 'text-red-300' : 'text-slate-300'
                    }
                  >
                    {r.score.toFixed(3)}
                  </span>
                </td>
                <td className='py-2 pr-4'>
                  <span className='text-slate-300'>
                    {(r.confidence * 100).toFixed(1)}%
                  </span>
                </td>
                <td className='py-2 pr-4 text-emerald-400 font-mono'>
                  {(r.models.lgbm * 100).toFixed(1)}%
                </td>
                <td className='py-2 pr-4 text-yellow-400 font-mono'>
                  {(r.models.xgb * 100).toFixed(1)}%
                </td>
                <td className='py-2 pr-4 text-purple-400 font-mono'>
                  {(r.models.cat * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className='py-12 text-center text-slate-400'>
                  <div className='flex flex-col items-center gap-2'>
                    <div className='text-4xl'>📊</div>
                    <div>아직 데이터가 없습니다.</div>
                    <div className='text-sm'>
                      재생 버튼을 눌러 스트리밍을 시작하세요.
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {data.length > 0 && displayData.length === 0 && (
              <tr>
                <td colSpan={7} className='py-12 text-center text-slate-400'>
                  <div className='flex flex-col items-center gap-2'>
                    <div className='text-4xl'>⏳</div>
                    <div>선택한 시간 범위에 데이터가 없습니다.</div>
                    <div className='text-sm'>
                      다른 시간 범위를 선택하거나 위치를 조정해보세요.
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data.length > 200 && (
        <div className='mt-3 text-center text-xs text-slate-500'>
          최근 200개 거래만 표시 중 (전체: {data.length}개)
        </div>
      )}
    </div>
  );
}
