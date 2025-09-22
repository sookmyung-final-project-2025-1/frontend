'use client';

import { memo, useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Props<T extends Record<string, unknown>> = {
  data: T[];
  dataKey: keyof T;
  color: string;
  name: string;
  xKey?: keyof T;
  windowSize?: number;
};

function SlidingLineChartComponent<T extends Record<string, unknown>>({
  data,
  dataKey,
  color,
  name,
  xKey = 'timestamp' as keyof T,
  windowSize = 20,
}: Props<T>) {
  const windowed = useMemo(() => {
    if (!data?.length) return [] as T[];
    const start = Math.max(0, data.length - windowSize);
    return data.slice(start);
  }, [data, windowSize]);

  return (
    <ResponsiveContainer width='100%' height='100%'>
      <LineChart data={windowed} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray='3 3' stroke='#334155' />
        <XAxis
          dataKey={xKey as string}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          stroke='#64748b'
        />
        <YAxis
          domain={['dataMin', 'dataMax']}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          stroke='#64748b'
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#e2e8f0',
          }}
        />
        <Line
          type='monotone'
          dataKey={dataKey as string}
          stroke={color}
          strokeWidth={2}
          dot={{ r: 2, fill: color }}
          isAnimationActive={false}
          name={name}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

const SlidingLineChart = memo(SlidingLineChartComponent) as typeof SlidingLineChartComponent;

export default SlidingLineChart;
