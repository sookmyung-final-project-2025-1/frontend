'use client';

import {
  useStatsHourlyQuery,
  type HourlyResponse,
} from '@/hooks/queries/dashboard/useStatsHourlyQuery';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/* -------------------- 시간 유틸 -------------------- */
type Preset =
  | 'last24h'
  | 'today'
  | 'yesterday'
  | 'last7d'
  | 'last30d'
  | 'custom';

const toLocalInputValue = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const toISOFromLocalInput = (local: string) => {
  const d = new Date(local);
  return isNaN(d.getTime()) ? '' : d.toISOString();
};

// 로컬 자정 범위 같은 걸 만들 때 씀 (오늘 00:00 등)
const startOfDayLocal = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
const addDays = (d: Date, n: number) =>
  new Date(d.getTime() + n * 24 * 3600 * 1000);
const addHours = (d: Date, n: number) =>
  new Date(d.getTime() + n * 3600 * 1000);

/* -------------------- 컴포넌트 -------------------- */
export default function ProbChart() {
  // 프리셋/커스텀 상태
  const [preset, setPreset] = useState<Preset>('last24h');
  const [startISO, setStartISO] = useState<string>('');
  const [endISO, setEndISO] = useState<string>('');

  // 프리셋이 바뀌면 자동으로 범위 계산
  useEffect(() => {
    const now = new Date();
    if (preset === 'last24h') {
      const end = now;
      const start = addHours(end, -24);
      setStartISO(start.toISOString());
      setEndISO(end.toISOString());
      return;
    }
    if (preset === 'today') {
      const start = startOfDayLocal(now);
      const end = addDays(start, 1);
      setStartISO(start.toISOString());
      setEndISO(end.toISOString());
      return;
    }
    if (preset === 'yesterday') {
      const end = startOfDayLocal(now);
      const start = addDays(end, -1);
      setStartISO(start.toISOString());
      setEndISO(end.toISOString());
      return;
    }
    if (preset === 'last7d') {
      const end = now;
      const start = addDays(end, -7);
      setStartISO(start.toISOString());
      setEndISO(end.toISOString());
      return;
    }
    if (preset === 'last30d') {
      const end = now;
      const start = addDays(end, -30);
      setStartISO(start.toISOString());
      setEndISO(end.toISOString());
      return;
    }
    // custom은 사용자가 직접 입력
  }, [preset]);

  // 데이터 호출
  const {
    data = [],
    isLoading,
    error,
  } = useStatsHourlyQuery({
    startTime: startISO,
    endTime: endISO,
  });

  // HourlyResponse[] -> 차트 데이터로 매핑
  const chartData = useMemo(
    () =>
      (data as HourlyResponse[]).map((d) => {
        const date = new Date(d.timestamp);
        const hourLabel = date.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        return {
          hourLabel, // X축 라벨 (HH:mm)
          totalCount: Number(d.totalCount) || 0, // 막대: 전체 거래수
          confidence: Number(d.avgConfidenceScore) || 0, // 면적: 0~1
          procSec: (Number(d.avgProcessingTime) || 0) / 1000, // Tooltip용 표시(초)
          timestamp: d.timestamp, // 필요 시 참조
        };
      }),
    [data]
  );

  const hasRange = Boolean(startISO && endISO);

  return (
    <div className='rounded-2xl border border-slate-800 bg-slate-900/40 xl:col-span-2 h-fit'>
      <div className='p-6'>
        <div className='text-xl font-semibold text-slate-200'>
          시간대별 사기확률 · 거래수
        </div>

        {/* 컨트롤 패널 */}
        <div className='mb-3 grid grid-cols-1 md:grid-cols-4 gap-3'>
          <div>
            <label className='block text-xs text-slate-400 mb-1'>프리셋</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as Preset)}
              className='w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100'
            >
              <option value='last24h'>최근 24시간</option>
              <option value='today'>오늘</option>
              <option value='yesterday'>어제</option>
              <option value='last7d'>지난 7일</option>
              <option value='last30d'>지난 30일</option>
              <option value='custom'>커스텀…</option>
            </select>
          </div>

          {/* 커스텀일 때만 노출 */}
          <div className='md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div>
              <label className='block text-xs text-slate-400 mb-1'>시작</label>
              <input
                type='datetime-local'
                value={toLocalInputValue(startISO)}
                onChange={(e) =>
                  setStartISO(toISOFromLocalInput(e.target.value))
                }
                className='w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100'
                disabled={preset !== 'custom'}
                max={toLocalInputValue(endISO)}
              />
            </div>
            <div>
              <label className='block text-xs text-slate-400 mb-1'>종료</label>
              <input
                type='datetime-local'
                value={toLocalInputValue(endISO)}
                onChange={(e) => setEndISO(toISOFromLocalInput(e.target.value))}
                className='w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100'
                disabled={preset !== 'custom'}
                min={toLocalInputValue(startISO)}
              />
            </div>
          </div>
        </div>

        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
          {/* 현재 범위 표시 */}
          <div className='text-xs text-slate-500 mb-2'>
            startTime: <code className='text-slate-300'>{startISO || '-'}</code>{' '}
            | endTime: <code className='text-slate-300'>{endISO || '-'}</code>
          </div>

          <div className='h-64'>
            {(!hasRange || isLoading) && (
              <div className='h-full flex items-center justify-center text-slate-400'>
                {hasRange ? '불러오는 중…' : '시간 범위를 선택해 주세요'}
              </div>
            )}
            {error && (
              <div className='h-full flex items-center justify-center text-red-400'>
                데이터를 불러오지 못했습니다.
              </div>
            )}
            {!isLoading && !error && hasRange && (
              <ResponsiveContainer width='100%' height='100%'>
                <ComposedChart
                  data={chartData}
                  margin={{ top: 8, right: 12, left: 12, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray='3 3' stroke='#374151' />
                  <XAxis dataKey='hourLabel' stroke='#9CA3AF' fontSize={12} />

                  {/* 왼쪽 Y: 거래수 */}
                  <YAxis
                    yAxisId='left'
                    stroke='#9CA3AF'
                    fontSize={12}
                    width={48}
                    allowDecimals={false}
                  />

                  {/* 오른쪽 Y: 사기확률(0~1) → %로 표기 */}
                  <YAxis
                    yAxisId='right'
                    orientation='right'
                    stroke='#9CA3AF'
                    fontSize={12}
                    width={56}
                    domain={[0, 1]}
                    tickFormatter={(v) => `${Math.round((v as number) * 100)}%`}
                  />

                  <Tooltip
                    formatter={(value, name, entry) => {
                      const key = entry?.dataKey;
                      if (key === 'confidence') {
                        const v =
                          typeof value === 'number' ? value : Number(value);
                        return [`${(v * 100).toFixed(1)}%`, '사기확률'];
                      }
                      if (key === 'totalCount') {
                        const v =
                          typeof value === 'number' ? value : Number(value);
                        return [v.toLocaleString(), '거래건수'];
                      }
                      if (key === 'procSec') {
                        const v =
                          typeof value === 'number' ? value : Number(value);
                        return [`${v.toFixed(2)} s`, '평균 처리시간'];
                      }
                      return [value as any, name as string];
                    }}
                    labelFormatter={(label, payload) => {
                      const ts = payload?.[0]?.payload?.timestamp as
                        | string
                        | undefined;
                      return ts ? `시간: ${label} (${ts})` : `시간: ${label}`;
                    }}
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid #334155',
                    }}
                    labelStyle={{ color: '#cbd5e1' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />

                  <Legend
                    formatter={(value) => {
                      if (value === 'totalCount') return '거래건수';
                      if (value === 'confidence') return '사기확률';
                      if (value === 'procSec') return '평균 처리시간';
                      return value;
                    }}
                  />

                  {/* 거래수(막대) */}
                  <Bar
                    yAxisId='left'
                    dataKey='totalCount'
                    name='거래건수'
                    fill='#60A5FA'
                    radius={[4, 4, 0, 0]}
                  />

                  {/* 사기확률(면적) */}
                  <Area
                    yAxisId='right'
                    type='monotone'
                    dataKey='confidence'
                    name='사기확률'
                    stroke='#34D399'
                    fill='#34D399'
                    fillOpacity={0.2}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive
                  />

                  {/* 평균 처리시간(초) — 보조로 라인 추가하고 싶으면 주석 해제
                <Line
                  yAxisId='left'
                  type='monotone'
                  dataKey='procSec'
                  name='평균 처리시간'
                  stroke='#EAB308'
                  strokeWidth={2}
                  dot={false}
                />
                */}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
