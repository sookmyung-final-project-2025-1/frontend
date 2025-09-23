'use client';

import { ChartRow } from '@/lib/faudTrendUtils';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Props = {
  chartData: ChartRow[];
};

function formatRate(value: number) {
  return `${value.toFixed(1)}%`;
}

// YYYY-MM-DD 또는 MM/DD HH:mm 등 들어와도 그대로 보여주되,
// YYYY-MM-DD면 그대로, MM/DD HH:mm이면 그대로 표시.
// 필요하면 여기서 d.slice(5)처럼 커스터마이즈 가능.
const tickLabel = (s: string) => s;

export default function ChartsGrid({ chartData }: Props) {
  // 안전 가드: 숫자 보정
  const data = (chartData ?? []).map((d) => ({
    time: String(d.time ?? ''),
    fraudCount: Number.isFinite(d.fraudCount as any) ? Number(d.fraudCount) : 0,
    totalCount: Number.isFinite(d.totalCount as any) ? Number(d.totalCount) : 0,
    fraudRatePct: Number.isFinite(d.fraudRatePct as any)
      ? Number(d.fraudRatePct)
      : 0,
  }));

  return (
    <>
      {/* 1) 사기 거래 트렌드 (라인) */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
          <h4 className='text-slate-300 font-medium mb-2'>사기 거래 트렌드</h4>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray='3 3' stroke='#334155' />
                <XAxis
                  dataKey='time'
                  stroke='#64748b'
                  fontSize={12}
                  interval='preserveStartEnd'
                  tickFormatter={tickLabel}
                />
                <YAxis allowDecimals={false} stroke='#64748b' fontSize={12} />
                <Tooltip
                  formatter={(v: any) => [
                    Number(v).toLocaleString(),
                    '사기 건수',
                  ]}
                  labelFormatter={(label) => `날짜: ${label as string}`}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                />
                <Legend />
                <Line
                  type='monotone'
                  dataKey='fraudCount'
                  stroke='#EF4444'
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#EF4444' }}
                  name='사기 건수'
                  isAnimationActive
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2) 전체 거래량 (에어리어) */}
        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
          <h4 className='text-slate-300 font-medium mb-2'>전체 거래량</h4>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray='3 3' stroke='#334155' />
                <XAxis
                  dataKey='time'
                  stroke='#64748b'
                  fontSize={12}
                  interval='preserveStartEnd'
                  tickFormatter={tickLabel}
                />
                <YAxis allowDecimals={false} stroke='#64748b' fontSize={12} />
                <Tooltip
                  formatter={(v: any) => [
                    Number(v).toLocaleString(),
                    '전체 건수',
                  ]}
                  labelFormatter={(label) => `날짜: ${label as string}`}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                />
                <Area
                  type='monotone'
                  dataKey='totalCount'
                  stroke='#38BDF8'
                  fill='#38BDF8'
                  strokeWidth={2}
                  fillOpacity={0.25}
                  name='전체 건수'
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3) 사기 비율 추이 (라인, % 축 0~100) */}
      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4 mt-6'>
        <h4 className='text-slate-300 font-medium mb-2'>사기 비율 추이</h4>
        <div className='h-96'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray='3 3' stroke='#334155' />
              <XAxis
                dataKey='time'
                stroke='#64748b'
                fontSize={12}
                interval='preserveStartEnd'
                tickFormatter={tickLabel}
              />
              <YAxis
                allowDecimals={false}
                stroke='#64748b'
                fontSize={12}
                domain={[0, 100]} // 🔥 % 값이므로 0~100 고정
                tickFormatter={formatRate}
              />
              <Tooltip
                formatter={(v: any) => [formatRate(Number(v)), '사기 비율']}
                labelFormatter={(label) => `날짜: ${label as string}`}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                }}
              />
              <Legend />
              <Line
                type='monotone'
                dataKey='fraudRatePct'
                stroke='#F97316'
                strokeWidth={2}
                dot={{ r: 3, fill: '#F97316' }}
                name='사기 비율'
                isAnimationActive
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
