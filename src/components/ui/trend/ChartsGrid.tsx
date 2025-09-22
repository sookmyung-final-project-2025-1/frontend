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

export default function ChartsGrid({ chartData }: Props) {
  return (
    <>
      {/* 라인 + 에어리어 */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
          <h4 className='text-slate-300 font-medium mb-2'>사기 거래 트렌드</h4>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' stroke='#334155' />
                <XAxis dataKey='time' stroke='#64748b' fontSize={12} />
                <YAxis allowDecimals={false} stroke='#64748b' fontSize={12} />
                <Tooltip
                  formatter={(v: any) => [
                    Number(v).toLocaleString(),
                    '사기 건수',
                  ]}
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
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
          <h4 className='text-slate-300 font-medium mb-2'>전체 거래량</h4>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' stroke='#334155' />
                <XAxis dataKey='time' stroke='#64748b' fontSize={12} />
                <YAxis allowDecimals={false} stroke='#64748b' fontSize={12} />
                <Tooltip
                  formatter={(v: any) => [
                    Number(v).toLocaleString(),
                    '전체 건수',
                  ]}
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
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 바 차트 */}
      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
        <h4 className='text-slate-300 font-medium mb-2'>사기 비율 추이</h4>
        <div className='h-96'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray='3 3' stroke='#334155' />
              <XAxis dataKey='time' stroke='#64748b' fontSize={12} />
              <YAxis
                allowDecimals={false}
                stroke='#64748b'
                fontSize={12}
                tickFormatter={formatRate}
              />
              <Tooltip
                formatter={(v: any) => [formatRate(Number(v)), '사기 비율']}
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
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
