'use client';

import { useStreaming } from '@/contexts/StreamingContext';
import { useMemo } from 'react';
import {
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function tsLabel(ts?: string) {
  if (!ts) return '';
  const d = new Date(ts);
  return Number.isNaN(d.getTime())
    ? ts
    : `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

export default function DetectionLineChart() {
  const { data } = useStreaming();

  // 그래프 데이터: 시간순 정렬 + 표시용 필드 가공
  const chartData = useMemo(() => {
    // 안전하게 복사 후 정렬
    const sorted = [...data].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    return sorted.map((d) => ({
      t: d.timestamp,
      label: tsLabel(d.timestamp),
      score: d.score,
      lgbm: d.models.lgbm,
      xgb: d.models.xgb,
      cat: d.models.cat,
      fraud: d.prediction === 'fraud' ? d.score : undefined, // fraud만 따로 찍어보려면
    }));
  }, [data]);

  return (
    <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
      <div className='flex items-center justify-between mb-3'>
        <h3 className='text-slate-100 font-semibold'>
          Detection Score (Realtime)
        </h3>
        <div className='text-xs text-slate-300'>points: {chartData.length}</div>
      </div>

      <div className='h-72'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='label' tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {/* 전체 score */}
            <Line type='monotone' dataKey='score' dot={false} name='score' />
            {/* 모델별 기여(원하면 숨기거나 토글 UI 추가) */}
            <Line type='monotone' dataKey='lgbm' dot={false} name='lgbm' />
            <Line type='monotone' dataKey='xgb' dot={false} name='xgb' />
            <Line type='monotone' dataKey='cat' dot={false} name='cat' />
            {/* 사기만 강조하고 싶다면 점으로 찍기 */}
            <Line
              type='linear'
              dataKey='fraud'
              name='fraudOnly'
              strokeDasharray='4 2'
            />
            {/* 참고선 예: 임계값 0.5 */}
            <ReferenceLine y={0.5} strokeOpacity={0.4} strokeDasharray='3 3' />
            <Brush dataKey='label' height={20} travellerWidth={10} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
