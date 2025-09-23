// src/components/dashboard/ProbChartWeekly.tsx
'use client';

import { useStatsWeeeklyQuery } from '@/hooks/queries/dashboard/useStatsWeeklyQuery';
import { useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const pad = (n: number) => String(n).padStart(2, '0');
const toLocalDateInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfDayLocal = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
const addDays = (d: Date, n: number) =>
  new Date(d.getTime() + n * 24 * 3600 * 1000);

// ✅ 들어온 날짜 문자열의 연도를 무조건 2025로 강제
const forceYear2025 = (s: string) =>
  /^\d{4}-/.test(s) ? s.replace(/^\d{4}/, '2025') : s;

type WeeklyPoint = {
  week: string; // "YYYY-MM-DD"
  totalCount: number;
  fraudCount: number;
  fraudRate: number; // 0~1
  totalAmount?: number;
  avgAmount?: number;
};

export default function WeeklyStatsChart() {
  const today = new Date();
  const defaultStart = addDays(startOfDayLocal(today), -6);
  const [startLocal, setStartLocal] = useState<string>(
    toLocalDateInput(defaultStart)
  );

  const startISO = useMemo(
    () => new Date(`${startLocal}T00:00:00`).toISOString(),
    [startLocal]
  );
  const endISO = useMemo(
    () => addDays(new Date(startISO), 7).toISOString(),
    [startISO]
  );
  const endLocalDisplay = useMemo(
    () => toLocalDateInput(addDays(new Date(startISO), 6)),
    [startISO]
  );

  const {
    data = [],
    isLoading,
    error,
  } = useStatsWeeeklyQuery({ startTime: startISO, endTime: endISO });

  // ✅ X축/툴팁 표시는 항상 2025년
  const chartData = useMemo(() => {
    const rows = (data as unknown as WeeklyPoint[]).map((p) => {
      const raw = String(p.week).slice(0, 10); // "YYYY-MM-DD"
      return {
        weekLabel: forceYear2025(raw), // ← 표시용 라벨(연도 2025)
        origWeek: raw, // (필요 시 원본)
        totalCount: Number(p.totalCount) || 0,
        fraudCount: Number(p.fraudCount) || 0,
        fraudRate: Number(p.fraudRate) || 0, // 0~1
        totalAmount: Number(p.totalAmount ?? 0),
        avgAmount: Number(p.avgAmount ?? 0),
      };
    });
    rows.sort((a, b) => a.weekLabel.localeCompare(b.weekLabel));
    return rows;
  }, [data]);

  const maxRate = useMemo(() => {
    const m = Math.max(0, ...chartData.map((d) => d.fraudRate));
    if (m === 0) return 1;
    if (m < 0.05) return 0.05;
    return Math.min(1, m * 1.2);
  }, [chartData]);

  const fmtPct = (v: number) => `${(v * 100).toFixed(2)}%`;

  return (
    <div className='rounded-2xl border border-slate-800 bg-slate-900/40 xl:col-span-2 h-fit'>
      <div className='p-6'>
        <div className='text-xl font-semibold text-slate-200'>
          주간 지표 (전체 거래 & 사기율)
        </div>

        {/* 컨트롤 */}
        <div className='mb-3 grid grid-cols-1 md:grid-cols-3 gap-3'>
          <div className='md:col-span-1'>
            <label className='block text-xs text-slate-400 mb-1'>시작일</label>
            <input
              type='date'
              value={startLocal}
              onChange={(e) => setStartLocal(e.target.value)}
              className='w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100'
              max={toLocalDateInput(today)}
            />
          </div>
          <div className='md:col-span-2 grid grid-cols-2 gap-3'>
            <div>
              <label className='block text-xs text-slate-400 mb-1'>
                종료일(자동)
              </label>
              <input
                type='date'
                value={endLocalDisplay}
                className='w-full rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-slate-400'
                disabled
              />
            </div>
            <div>
              <label className='block text-xs text-slate-400 mb-1'>기간</label>
              <div className='h-[38px] flex items-center px-3 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-400'>
                7일 범위 (주간 집계 응답 사용)
              </div>
            </div>
          </div>
        </div>

        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
          <div className='text-xs text-slate-500 mb-2'>
            범위: <code className='text-slate-300'>{startLocal}</code> ~{' '}
            <code className='text-slate-300'>{endLocalDisplay}</code>
          </div>

          <div className='h-64'>
            {isLoading ? (
              <div className='h-full flex items-center justify-center text-slate-400'>
                불러오는 중…
              </div>
            ) : error ? (
              <div className='h-full flex items-center justify-center text-red-400'>
                데이터를 불러오지 못했습니다.
              </div>
            ) : (
              <ResponsiveContainer width='100%' height='100%'>
                <ComposedChart
                  data={chartData}
                  margin={{ top: 8, right: 12, left: 12, bottom: 8 }}
                  barCategoryGap='25%'
                  barGap={6}
                >
                  <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                  <XAxis
                    dataKey='weekLabel'
                    stroke='#9CA3AF'
                    fontSize={12}
                    interval='preserveStartEnd'
                  />
                  <YAxis
                    yAxisId='left'
                    stroke='#9CA3AF'
                    fontSize={12}
                    width={56}
                    allowDecimals={false}
                  />
                  <YAxis
                    yAxisId='right'
                    orientation='right'
                    stroke='#9CA3AF'
                    fontSize={12}
                    width={64}
                    domain={[0, maxRate]}
                    tickFormatter={(v) => fmtPct(Number(v))}
                  />

                  <Tooltip
                    labelFormatter={(label) => `주 기준일: ${label as string}`}
                    formatter={(value, _name, entry) => {
                      const key = entry?.dataKey;
                      if (key === 'fraudRate')
                        return [fmtPct(Number(value)), '사기율'];
                      if (key === 'totalCount')
                        return [Number(value).toLocaleString(), '전체 거래'];
                      if (key === 'fraudCount')
                        return [Number(value).toLocaleString(), '사기 거래'];
                      if (key === 'totalAmount')
                        return [Number(value).toLocaleString(), '총 금액'];
                      if (key === 'avgAmount')
                        return [Number(value).toLocaleString(), '평균 금액'];
                      return [value as any, key as string];
                    }}
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid #334155',
                    }}
                    labelStyle={{ color: '#cbd5e1' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />

                  <Legend
                    formatter={(value) =>
                      value === 'totalCount'
                        ? '전체 거래'
                        : value === 'fraudCount'
                          ? '사기 거래'
                          : value === 'fraudRate'
                            ? '사기율'
                            : value
                    }
                  />

                  <Bar
                    yAxisId='left'
                    dataKey='totalCount'
                    name='전체 거래'
                    fill='#60A5FA'
                    radius={[4, 4, 0, 0]}
                    barSize={18}
                  />
                  <Bar
                    yAxisId='right'
                    dataKey='fraudRate'
                    name='사기율'
                    fill='#34D399'
                    radius={[4, 4, 0, 0]}
                    barSize={12}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
