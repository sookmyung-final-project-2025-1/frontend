'use client';

import { useFraudTrend } from '@/hooks/queries/dashboard/useFraudTrend';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/** ---------------- Utils ---------------- */
const pad = (n: number) => String(n).padStart(2, '0');

// 서버 요구사항: 오프셋 없는 LocalDateTime 문자열(YYYY-MM-DDTHH:mm:ss)
const toLocalDateTimeParam = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

type FraudTrendInterval = 'hourly' | 'daily' | 'weekly' | 'monthly';

/** 선택한 'YYYY-MM-DD'와 interval에 맞춰 start/end 계산 */
function makeRange(ymd: string, interval: FraudTrendInterval) {
  const [y, m, d] = ymd.split('-').map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0);
  const end = new Date(start.getTime());

  switch (interval) {
    case 'hourly': // 1일
      end.setDate(end.getDate() + 1);
      break;
    case 'daily': // 1개월
      end.setMonth(end.getMonth() + 1);
      break;
    case 'weekly': // 7일
      end.setDate(end.getDate() + 7);
      break;
    case 'monthly': // 1개월
      end.setMonth(end.getMonth() + 1);
      break;
  }

  return {
    startTime: toLocalDateTimeParam(start),
    endTime: toLocalDateTimeParam(end),
  };
}

/** ---------------- Types ---------------- */
type TrendPoint = {
  date: string;
  fraudRate: number; // 0~1 또는 0~100 둘 다 올 수 있음
  fraudCount: number;
  totalCount: number;
};

export default function FraudTrend() {
  // 단일 날짜 선택(날짜만)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [interval, setInterval] = useState<FraudTrendInterval>('daily');

  // interval에 맞는 범위 계산
  const { startTime, endTime } = makeRange(selectedDate, interval);

  // 실제 훅 호출
  const { data, isLoading, error } = useFraudTrend({
    startTime,
    endTime,
    interval,
  });

  /** ---- 차트 데이터 가공: trends(TrendPoint[]) → [{time, fraudCount, totalCount, fraudRatePct}] ---- */
  type ChartRow = {
    time: string;
    fraudCount: number;
    totalCount: number;
    fraudRatePct: number; // 0~100
  };

  const chartData: ChartRow[] = useMemo(() => {
    if (!data || !Array.isArray((data as any).trends)) return [];
    return (data!.trends as unknown as TrendPoint[]).map((t) => {
      const rate = Number(t.fraudRate ?? 0);
      const pct = rate <= 1 ? rate * 100 : rate;
      return {
        time: String(t.date ?? ''),
        fraudCount: Number(t.fraudCount ?? 0),
        totalCount: Number(t.totalCount ?? 0),
        fraudRatePct: Number.isFinite(pct) ? pct : 0,
      };
    });
  }, [data]);

  /** ---- 통계 ---- */
  const totalFraud = useMemo(
    () => chartData.reduce((s, r) => s + r.fraudCount, 0),
    [chartData]
  );
  const averageFraud = useMemo(
    () => (chartData.length ? Math.round(totalFraud / chartData.length) : 0),
    [totalFraud, chartData.length]
  );
  const maxFraud = useMemo(
    () =>
      chartData.length ? Math.max(...chartData.map((r) => r.fraudCount)) : 0,
    [chartData]
  );
  const { trendUp, trendPct } = useMemo(() => {
    const recent = chartData.slice(-7).map((r) => r.fraudCount);
    const previous = chartData.slice(-14, -7).map((r) => r.fraudCount);
    const recentAvg = recent.length
      ? recent.reduce((a, b) => a + b, 0) / recent.length
      : 0;
    const prevAvg = previous.length
      ? previous.reduce((a, b) => a + b, 0) / previous.length
      : recentAvg;
    const up = recentAvg > prevAvg;
    const pct =
      prevAvg > 0
        ? ((Math.abs(recentAvg - prevAvg) / prevAvg) * 100).toFixed(1)
        : '0.0';
    return { trendUp: up, trendPct: pct };
  }, [chartData]);

  if (isLoading)
    return <div className='p-6 text-slate-300'>불러오는 중...</div>;
  if (error)
    return (
      <div className='p-6 text-red-300'>데이터를 불러오지 못했습니다.</div>
    );
  if (chartData.length === 0)
    return <div className='p-6 text-slate-300'>표시할 데이터가 없습니다.</div>;

  return (
    <div className='space-y-8'>
      {/* 헤더 */}
      <div>
        <h2 className='text-xl font-semibold text-slate-200'>
          사기 거래 트렌드 분석
        </h2>
        <p className='text-slate-400 text-sm'>
          {new Date(selectedDate).toLocaleDateString('ko-KR')}
          {' · '}
          {interval}
          {' · '}
          <span className='text-slate-500'>
            start={startTime}, end={endTime}
          </span>
        </p>
      </div>

      {/* 컨트롤 */}
      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='block text-sm text-slate-300 mb-1'>
              조회 일자
            </label>
            <input
              type='date'
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className='w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          <div>
            <label className='block text-sm text-slate-300 mb-1'>간격</label>
            <select
              value={interval}
              onChange={(e) =>
                setInterval(e.target.value as FraudTrendInterval)
              }
              className='w-full h-[44px] rounded-lg border border-slate-700 bg-slate-800 pl-3 pr-5 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='hourly'>시간별 (1일)</option>
              <option value='daily'>일별 (1개월)</option>
              <option value='weekly'>주별 (7일)</option>
              <option value='monthly'>월별 (1개월)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 카드들 */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-400'>총 사기 건수</p>
              <p className='text-2xl font-semibold text-red-400'>
                {totalFraud.toLocaleString()}
              </p>
            </div>
            <BarChart3 className='w-6 h-6 text-red-400' />
          </div>
        </div>
        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-400'>평균 사기 건수</p>
              <p className='text-2xl font-semibold text-sky-400'>
                {averageFraud.toLocaleString()}
              </p>
            </div>
            <AlertTriangle className='w-6 h-6 text-sky-400' />
          </div>
        </div>
        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-400'>최고 사기 건수</p>
              <p className='text-2xl font-semibold text-orange-400'>
                {maxFraud.toLocaleString()}
              </p>
            </div>
            <TrendingUp className='w-6 h-6 text-orange-400' />
          </div>
        </div>
        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-slate-400'>최근 트렌드</p>
              <div className='flex items-center gap-2'>
                {trendUp ? (
                  <TrendingUp className='w-6 h-6 text-red-400' />
                ) : (
                  <TrendingDown className='w-6 h-6 text-emerald-400' />
                )}
                <span
                  className={`text-2xl font-semibold ${trendUp ? 'text-red-400' : 'text-emerald-400'}`}
                >
                  {trendPct}%
                </span>
              </div>
            </div>
            <Calendar className='w-6 h-6 text-violet-400' />
          </div>
        </div>
      </div>

      {/* 차트: 공통 chartData 사용 */}
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
                  formatter={(v) => [Number(v).toLocaleString(), '사기 건수']}
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
                  stroke='#ef4444'
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#ef4444' }}
                  name='사기 건수'
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
          <h4 className='text-slate-300 font-medium mb-2'>
            사기 거래량(에어리어)
          </h4>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' stroke='#334155' />
                <XAxis dataKey='time' stroke='#64748b' fontSize={12} />
                <YAxis allowDecimals={false} stroke='#64748b' fontSize={12} />
                <Tooltip
                  formatter={(v) => [Number(v).toLocaleString(), '사기 건수']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                />
                <Area
                  type='monotone'
                  dataKey='fraudCount'
                  stroke='#8b5cf6'
                  fill='#8b5cf6'
                  strokeWidth={2}
                  fillOpacity={0.25}
                  name='사기 건수'
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
        <h4 className='text-slate-300 font-medium mb-2'>사기 거래량(막대)</h4>
        <div className='h-96'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray='3 3' stroke='#334155' />
              <XAxis dataKey='time' stroke='#64748b' fontSize={12} />
              <YAxis allowDecimals={false} stroke='#64748b' fontSize={12} />
              <Tooltip
                formatter={(v) => [Number(v).toLocaleString(), '사기 건수']}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                }}
              />
              <Bar
                dataKey='fraudCount'
                fill='#3b82f6'
                radius={[4, 4, 0, 0]}
                name='사기 건수'
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
