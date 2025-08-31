'use client';

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COMMONSTYLE =
  'bg-[#ffffff] rounded-[10px] py-[20px] px-[25px] flex flex-col gap-[20px]';

export default function MainGraph() {
  const data = [
    {
      name: 'Page A',
      uv: 4000,
      pv: 2400,
      amt: 2400,
    },
    {
      name: 'Page B',
      uv: 3000,
      pv: 1398,
      amt: 2210,
    },
    {
      name: 'Page C',
      uv: 2000,
      pv: 9800,
      amt: 2290,
    },
    {
      name: 'Page D',
      uv: 2780,
      pv: 3908,
      amt: 2000,
    },
    {
      name: 'Page E',
      uv: 1890,
      pv: 4800,
      amt: 2181,
    },
    {
      name: 'Page F',
      uv: 2390,
      pv: 3800,
      amt: 2500,
    },
    {
      name: 'Page G',
      uv: 3490,
      pv: 4300,
      amt: 2100,
    },
  ];

  return (
    <div className='grid grid-rows-1 grid-cols-2 gap-5 w-full h-[400px]'>
      {/* 좌측 그래프 */}
      <div className={`${COMMONSTYLE}`}>
        <p className='font-semibold'>시간대별 평균 사기 확률</p>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart
            width={500}
            height={300}
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='name' />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type='monotone'
              dataKey='pv'
              stroke='#8884d8'
              activeDot={{ r: 8 }}
            />
            <Line type='monotone' dataKey='uv' stroke='#82ca9d' />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 우측 그래프 */}
      <div className={`${COMMONSTYLE}`}>
        <p className='font-semibold'>시간대별 사기 거래 건수</p>
        <ResponsiveContainer width='100%' height='100%'>
          <ComposedChart
            width={500}
            height={400}
            data={data}
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            }}
          >
            <CartesianGrid stroke='#f5f5f5' />
            <XAxis dataKey='name' scale='band' />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey='uv' barSize={20} fill='#413ea0' />
            <Line type='monotone' dataKey='uv' stroke='#ff7300' />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
