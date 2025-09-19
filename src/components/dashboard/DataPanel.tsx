'use client';

import { useFraudTrend } from '@/hooks/queries/dashboard/useFraudTrend';
import { ChartRow, FraudTrendInterval, TrendPoint } from '@/lib/faudTrendUtils';
import { useMemo } from 'react';
import ChartsGrid from '../ui/trend/ChartsGrid';
import StatsCards from '../ui/trend/StatsCards';

type Props = {
  startTime: string;
  endTime: string;
  interval: FraudTrendInterval;
};

export default function DataPanel({ startTime, endTime, interval }: Props) {
  // 실제 데이터 fetch (로딩/에러/빈 상태는 이 컨테이너에서만 처리)
  const { data, isLoading, error } = useFraudTrend({
    startTime,
    endTime,
    interval,
  });

  // chartData 가공
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

  // 통계 계산
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

  return (
    <div className='space-y-6'>
      {/* 결과 박스: 이 안에서만 로딩/에러/빈 처리 */}
      {error ? (
        <div className='rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-[#FCA5A5]'>
          데이터를 불러오지 못했습니다.
        </div>
      ) : isLoading && chartData.length === 0 ? (
        <div className='rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400'>
          불러오는 중…
        </div>
      ) : chartData.length === 0 ? (
        <div className='rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400'>
          표시할 데이터가 없습니다.
        </div>
      ) : (
        <>
          <StatsCards
            totalFraud={totalFraud}
            averageFraud={averageFraud}
            maxFraud={maxFraud}
            trendUp={trendUp}
            trendPct={trendPct}
          />
          <ChartsGrid chartData={chartData} />
        </>
      )}
    </div>
  );
}
