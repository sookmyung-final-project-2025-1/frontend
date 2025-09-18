'use client';

import {
  useMetricRealtime,
  type RealtimeMetric,
} from '@/hooks/queries/dashboard/useMetricRealtime';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function RealtimeOverview() {
  const { data: snap, refetch } = useMetricRealtime();
  const [series, setSeries] = useState<RealtimeMetric[]>([]);
  const lastTsRef = useRef<string | null>(null);

  // 스냅샷 버퍼링 (최근 60포인트)
  useEffect(() => {
    if (!snap?.timestamp) return;
    if (lastTsRef.current === snap.timestamp) return;
    lastTsRef.current = snap.timestamp;
    setSeries((prev) => {
      const next = [...prev, snap];
      return next.length > 60 ? next.slice(-60) : next;
    });
  }, [snap]);

  // ===== 시계열: 처리량/사기율 =====
  const throughputFraud = useMemo(
    () =>
      series.map((d) => ({
        time: new Date(d.timestamp).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        throughput: d.hourly.throughputPerHour ?? 0,
        fraudRatePct: (d.hourly.fraudRate ?? 0) * 100,
      })),
    [series]
  );

  // ===== 시계열: 최근 거래 수 =====
  const recentTxs = useMemo(
    () =>
      series.map((d) => ({
        time: new Date(d.timestamp).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        fraud: d.recentFraudTransactions ?? 0,
        total: (d.recentTransactions ?? 0) - (d.recentFraudTransactions ?? 0),
        totalAll: d.recentTransactions ?? 0,
      })),
    [series]
  );

  // ===== 우측 게이지: 평균 신뢰도 =====
  const avgConfPct = Math.max(
    0,
    Math.min(100, (snap?.hourly.averageConfidenceScore ?? 0) * 100)
  );

  // 최신 통계 요약
  const latestStats = snap
    ? {
        totalTransactions: snap.hourly.totalTransactions ?? 0,
        fraudRate: ((snap.hourly.fraudRate ?? 0) * 100).toFixed(2),
        throughput: snap.hourly.throughputPerHour ?? 0,
        recentTransactions: snap.recentTransactions ?? 0,
        recentFraud: snap.recentFraudTransactions ?? 0,
      }
    : null;

  return (
    <div className='space-y-6'>
      {/* 상단: 주요 지표 카드 */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatCard
          title='시간당 처리량'
          value={latestStats?.throughput.toLocaleString() ?? '-'}
          unit='건'
          trend={
            series.length >= 2
              ? (series[series.length - 1]?.hourly.throughputPerHour ?? 0) -
                (series[series.length - 2]?.hourly.throughputPerHour ?? 0)
              : 0
          }
        />
        <StatCard
          title='사기율'
          value={latestStats?.fraudRate ?? '-'}
          unit='%'
          trend={
            series.length >= 2
              ? (series[series.length - 1]?.hourly.fraudRate ?? 0) * 100 -
                (series[series.length - 2]?.hourly.fraudRate ?? 0) * 100
              : 0
          }
          isPercentage
        />
        <StatCard
          title='최근 거래'
          value={latestStats?.recentTransactions.toLocaleString() ?? '-'}
          unit='건'
        />
        <StatCard
          title='최근 사기 탐지'
          value={latestStats?.recentFraud.toLocaleString() ?? '-'}
          unit='건'
        />
      </div>

      {/* 메인 차트 영역 */}
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
        {/* 처리량/사기율 시계열 - 2컬럼 */}
        <div className='xl:col-span-2'>
          <Card title='처리량 및 사기율 추이'>
            <div className='h-80'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart
                  data={throughputFraud}
                  margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray='3 3'
                    stroke='#374151'
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey='time'
                    stroke='#9CA3AF'
                    fontSize={11}
                    tick={{ fill: '#9CA3AF' }}
                    axisLine={{ stroke: '#4B5563' }}
                  />
                  <YAxis
                    yAxisId='left'
                    stroke='#3B82F6'
                    fontSize={11}
                    tick={{ fill: '#3B82F6' }}
                    axisLine={{ stroke: '#3B82F6' }}
                  />
                  <YAxis
                    yAxisId='right'
                    orientation='right'
                    domain={[0, 'dataMax']}
                    tickFormatter={(v) => `${v.toFixed(1)}%`}
                    stroke='#EF4444'
                    fontSize={11}
                    tick={{ fill: '#EF4444' }}
                    axisLine={{ stroke: '#EF4444' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                    }}
                    labelStyle={{ color: '#cbd5e1' }}
                    formatter={(v: any, name: any) => {
                      if (name === '사기율(%)')
                        return [`${Number(v).toFixed(2)}%`, name];
                      return [Number(v).toLocaleString(), name];
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId='left'
                    type='monotone'
                    dataKey='throughput'
                    name='처리량(건/시간)'
                    stroke='#3B82F6'
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, stroke: '#3B82F6' }}
                  />
                  <Line
                    yAxisId='right'
                    type='monotone'
                    dataKey='fraudRatePct'
                    name='사기율(%)'
                    stroke='#EF4444'
                    strokeWidth={2}
                    dot={{ fill: '#EF4444', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, stroke: '#EF4444' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* 신뢰도 게이지 - 1컬럼 */}
        <div className='xl:col-span-1'>
          <Card title='평균 신뢰도 점수'>
            <div className='h-80 flex flex-col items-center justify-center'>
              <div className='relative'>
                <RadialBarChart
                  width={240}
                  height={240}
                  cx='50%'
                  cy='50%'
                  innerRadius='65%'
                  outerRadius='95%'
                  barSize={16}
                  data={[{ name: 'Confidence', value: avgConfPct }]}
                  startAngle={180}
                  endAngle={0}
                >
                  <PolarAngleAxis
                    type='number'
                    domain={[0, 100]}
                    tick={false}
                  />
                  <RadialBar
                    dataKey='value'
                    cornerRadius={8}
                    background={{ fill: '#374151' }}
                    fill={
                      avgConfPct >= 80
                        ? '#22C55E'
                        : avgConfPct >= 60
                          ? '#F59E0B'
                          : '#EF4444'
                    }
                  />
                  <text
                    x='50%'
                    y='50%'
                    textAnchor='middle'
                    dominantBaseline='middle'
                    fill='#e2e8f0'
                    fontSize={28}
                    fontWeight={700}
                  >
                    {Number.isFinite(avgConfPct)
                      ? `${avgConfPct.toFixed(0)}%`
                      : '--'}
                  </text>
                </RadialBarChart>
              </div>

              {/* 상세 지표 */}
              <div className='mt-4 w-full space-y-3'>
                <div className='flex justify-between items-center text-sm'>
                  <span className='text-slate-400'>총 거래 수</span>
                  <span className='text-slate-200 font-medium'>
                    {latestStats?.totalTransactions.toLocaleString() ?? '-'}
                  </span>
                </div>
                <div className='flex justify-between items-center text-sm'>
                  <span className='text-slate-400'>현재 사기율</span>
                  <span
                    className={`font-medium ${
                      Number(latestStats?.fraudRate ?? 0) > 5
                        ? 'text-red-400'
                        : Number(latestStats?.fraudRate ?? 0) > 2
                          ? 'text-yellow-400'
                          : 'text-green-400'
                    }`}
                  >
                    {latestStats?.fraudRate}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 하단: 거래량 바차트 */}
      <Card title='최근 거래 현황'>
        <div className='h-64'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={recentTxs}
              margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
            >
              <CartesianGrid
                strokeDasharray='3 3'
                stroke='#374151'
                opacity={0.3}
              />
              <XAxis
                dataKey='time'
                stroke='#9CA3AF'
                fontSize={11}
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis
                stroke='#9CA3AF'
                fontSize={11}
                tick={{ fill: '#9CA3AF' }}
              />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                }}
                labelStyle={{ color: '#cbd5e1' }}
                formatter={(v: any, name: any) => [
                  Number(v).toLocaleString(),
                  name,
                ]}
              />
              <Legend />
              <Bar
                dataKey='total'
                name='정상 거래'
                fill='#3B82F6'
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey='fraud'
                name='사기 거래'
                fill='#EF4444'
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className='rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm'>
      <div className='p-6'>
        <div className='text-base font-semibold text-slate-200 mb-4'>
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  unit,
  trend,
  isPercentage = false,
}: {
  title: string;
  value: string | number;
  unit: string;
  trend?: number;
  isPercentage?: boolean;
}) {
  const trendColor =
    trend === undefined
      ? ''
      : trend > 0
        ? 'text-green-400'
        : trend < 0
          ? 'text-red-400'
          : 'text-slate-400';

  const trendIcon =
    trend === undefined ? '' : trend > 0 ? '↗' : trend < 0 ? '↘' : '→';

  return (
    <div className='bg-slate-900/60 border border-slate-700 rounded-lg p-4'>
      <div className='text-xs text-slate-400 mb-1'>{title}</div>
      <div className='flex items-baseline justify-between'>
        <div className='flex items-baseline'>
          <span className='text-xl font-bold text-slate-100'>{value}</span>
          <span className='text-sm text-slate-400 ml-1'>{unit}</span>
        </div>
        {trend !== undefined && (
          <div className={`text-xs ${trendColor} flex items-center`}>
            <span className='mr-1'>{trendIcon}</span>
            <span>{Math.abs(trend).toFixed(isPercentage ? 2 : 0)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
