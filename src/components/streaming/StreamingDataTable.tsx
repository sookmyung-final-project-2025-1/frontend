'use client';

import type { DetectionResult } from './types';

export default function StreamingDataTable({
  data,
}: {
  data: DetectionResult[];
}) {
  return (
    <div className='bg-slate-900 border border-slate-700 rounded-xl p-4'>
      <h4 className='font-semibold mb-3'>최근 거래 (표)</h4>
      <div className='overflow-x-auto'>
        <table className='min-w-full text-sm'>
          <thead className='text-left text-slate-300'>
            <tr>
              <th className='py-2 pr-4'>시간</th>
              <th className='py-2 pr-4'>예측</th>
              <th className='py-2 pr-4'>스코어</th>
              <th className='py-2 pr-4'>신뢰도</th>
              <th className='py-2 pr-4'>LGBM</th>
              <th className='py-2 pr-4'>XGB</th>
              <th className='py-2 pr-4'>CAT</th>
            </tr>
          </thead>
          <tbody className='text-slate-200'>
            {data
              .slice(-200)
              .reverse()
              .map((r, i) => (
                <tr
                  key={`${r.timestamp}-${i}`}
                  className='border-t border-slate-800'
                >
                  <td className='py-2 pr-4'>
                    {new Date(r.timestamp).toLocaleString('ko-KR', {
                      hour12: false,
                    })}
                  </td>
                  <td className='py-2 pr-4'>
                    <span
                      className={`px-2 py-0.5 rounded text-white ${
                        r.prediction === 'fraud'
                          ? 'bg-red-600'
                          : 'bg-emerald-600'
                      }`}
                    >
                      {r.prediction === 'fraud' ? '사기' : '정상'}
                    </span>
                  </td>
                  <td className='py-2 pr-4'>{r.score.toFixed(3)}</td>
                  <td className='py-2 pr-4'>
                    {(r.confidence * 100).toFixed(1)}%
                  </td>
                  <td className='py-2 pr-4'>
                    {(r.models.lgbm * 100).toFixed(1)}%
                  </td>
                  <td className='py-2 pr-4'>
                    {(r.models.xgb * 100).toFixed(1)}%
                  </td>
                  <td className='py-2 pr-4'>
                    {(r.models.cat * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className='py-6 text-center text-slate-400'>
                  아직 데이터가 없습니다. 재생을 눌러보세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
