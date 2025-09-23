'use client';

import { type ChartRow } from '@/components/dashboard/DataPanel';
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

const formatRate = (v: number) => `${v.toFixed(1)}%`;

/** "2025-09-01" → "9/1", "09/01" → "9/1" */
const toMD = (s: string) => {
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const m = Number(s.slice(5, 7));
    const d = Number(s.slice(8, 10));
    return `${m}/${d}`;
  }
  if (/^\d{2}\/\d{2}$/.test(s)) {
    const [mm, dd] = s.split('/');
    return `${Number(mm)}/${Number(dd)}`;
  }
  return s;
};

export default function ChartsGrid({ chartData }: Props) {
  const data = (chartData ?? []).map((d) => ({
    time: String(d.time ?? ''),
    fraudCount: Number(d.fraudCount ?? 0),
    totalCount: Number(d.totalCount ?? 0),
    fraudRatePct: Number(d.fraudRatePct ?? 0),
  }));

  return (
    <>
      {/* 1) 사기 거래 트렌드 */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
          <h4 className='text-slate-300 font-medium mb-2'>사기 거래 트렌드</h4>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray='3 3' stroke='#334155' />
                <XAxis
                  dataKey='time'
                  tickFormatter={toMD}
                  allowDuplicatedCategory={false}
                  stroke='#64748b'
                  fontSize={12}
                  interval='preserveStartEnd'
                  tickMargin={8}
                  minTickGap={12}
                />
                <YAxis allowDecimals={false} stroke='#64748b' fontSize={12} />
                <Tooltip
                  formatter={(v: any) => [
                    Number(v).toLocaleString(),
                    '사기 건수',
                  ]}
                  labelFormatter={(label) => `날짜: ${toMD(String(label))}`}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
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

        {/* 2) 전체 거래량 */}
        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
          <h4 className='text-slate-300 font-medium mb-2'>전체 거래량</h4>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray='3 3' stroke='#334155' />
                <XAxis
                  dataKey='time'
                  tickFormatter={toMD}
                  allowDuplicatedCategory={false}
                  stroke='#64748b'
                  fontSize={12}
                  interval='preserveStartEnd'
                  tickMargin={8}
                  minTickGap={12}
                />
                <YAxis allowDecimals={false} stroke='#64748b' fontSize={12} />
                <Tooltip
                  formatter={(v: any) => [
                    Number(v).toLocaleString(),
                    '전체 건수',
                  ]}
                  labelFormatter={(label) => `날짜: ${toMD(String(label))}`}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
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

      {/* 3) 사기 비율 추이 (0~100%) */}
      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4 mt-6'>
        <h4 className='text-slate-300 font-medium mb-2'>사기 비율 추이</h4>
        <div className='h-96'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray='3 3' stroke='#334155' />
              <XAxis
                dataKey='time'
                tickFormatter={toMD}
                allowDuplicatedCategory={false}
                stroke='#64748b'
                fontSize={12}
                interval='preserveStartEnd'
                tickMargin={8}
                minTickGap={12}
              />
              <YAxis
                stroke='#64748b'
                fontSize={12}
                domain={[0, 100]}
                tickFormatter={(v) => `${Number(v).toFixed(0)}%`}
              />
              <Tooltip
                formatter={(v: any) => [formatRate(Number(v)), '사기 비율']}
                labelFormatter={(label) => `날짜: ${toMD(String(label))}`}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
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
