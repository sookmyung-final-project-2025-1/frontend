'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Point = {
  date: string;
  isFraudMean: number;
  transactionAmtMean: number;
};

export default function FraudAmtDualAxis({ data }: { data: Point[] }) {
  return (
    <div className='w-full h-[480px] py-[20px] pl-[20px] bg-[#ffffff] rounded-[10px] border border-black/5 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-md transition'>
      <p className='font-semibold text-[20px] mb-[20px]'>
        시간대별 평균 사기 확률
      </p>
      <ResponsiveContainer width='100%' height='90%'>
        <LineChart
          data={data}
          margin={{ top: 16, right: 32, left: 32, bottom: 16 }}
        >
          <CartesianGrid stroke='rgba(0,0,0,0.06)' strokeDasharray='3 3' />
          <XAxis dataKey='date' tick={{ fill: '#6A6A6A', fontSize: 12 }} />
          {/* 왼쪽 축: 사기율(%) */}
          <YAxis
            yAxisId='left'
            orientation='left'
            tick={{ fill: '#FA8072' }}
            tickFormatter={(v) => `${(v * 100).toFixed(2)}%`}
            label={{
              value: 'isFraud mean by day',
              angle: -90,
              dx: -45,
              fill: '#FA8072',
            }}
          />
          {/* 오른쪽 축: 평균 거래금액 */}
          <YAxis
            yAxisId='right'
            orientation='right'
            tick={{ fill: '#0E2975' }}
            label={{
              value: 'TransactionAmt mean by day',
              angle: 90,
              dx: 30,
              fill: '#0E2975',
            }}
          />

          <Tooltip
            formatter={(value, name) => {
              if (name === 'isFraudMean')
                return [
                  `${((value as number) * 100).toFixed(2)}%`,
                  'isFraud mean',
                ];
              return [(value as number).toFixed(2), 'TransactionAmt mean'];
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />

          {/* 왼쪽 축(사기율) */}
          <Line
            yAxisId='left'
            type='monotone'
            dataKey='isFraudMean'
            name='isFraud mean'
            stroke='#FA8072'
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          {/* 오른쪽 축(평균 거래금액)*/}
          <Line
            yAxisId='right'
            type='monotone'
            dataKey='transactionAmtMean'
            name='TransactionAmt mean'
            stroke='#0E2975'
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
