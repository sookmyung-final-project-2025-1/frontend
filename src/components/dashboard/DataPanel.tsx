'use client';

import { useFraudTrend } from '@/hooks/queries/dashboard/useFraudTrend';
import {
  ChartRow,
  FraudTrendInterval,
  TrendPoint,
  pad,
} from '@/lib/faudTrendUtils';
import { useMemo } from 'react';
import ChartsGrid from '../ui/trend/ChartsGrid';
import StatsCards from '../ui/trend/StatsCards';

type Props = {
  startTime: string;
  endTime: string;
  interval: FraudTrendInterval;
};

function shiftToCurrentYearLabel(
  dateStr: string,
  interval: FraudTrendInterval
) {
  if (!dateStr) return dateStr;
  const parsed = Date.parse(dateStr);
  if (!Number.isFinite(parsed)) return dateStr;
  const d = new Date(parsed);
  const now = new Date();
  d.setFullYear(now.getFullYear());

  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const HH = pad(d.getHours());
  const MI = pad(d.getMinutes());

  switch (interval) {
    case 'hourly':
      return `${MM}/${DD} ${HH}:${MI}`;
    case 'daily':
    case 'weekly':
      return `${MM}/${DD}`;
    case 'monthly':
    default:
      return `${MM}`;
  }
}

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
        time: shiftToCurrentYearLabel(String(t.date ?? ''), interval),
        fraudCount: Number(t.fraudCount ?? 0),
        totalCount: Number(t.totalCount ?? 0),
        fraudRatePct: Number.isFinite(pct) ? pct : 0,
      };
    });
  }, [data, interval]);

  // ───────── 집계: 전체 거래/사기/평균/사기비율 ─────────
  const { totalTransactions, totalFraud, averageFraud, fraudRatio } =
    useMemo(() => {
      const totals = chartData.reduce(
        (acc, r) => {
          acc.totalTx += r.totalCount || 0;
          acc.totalFraud += r.fraudCount || 0;
          return acc;
        },
        { totalTx: 0, totalFraud: 0 }
      );
      const buckets = chartData.length || 1;
      const avgFraud = Math.round(totals.totalFraud / buckets);
      const ratio = totals.totalTx > 0 ? totals.totalFraud / totals.totalTx : 0;

      return {
        totalTransactions: totals.totalTx,
        totalFraud: totals.totalFraud,
        averageFraud: avgFraud,
        fraudRatio: ratio,
      };
    }, [chartData]);

  const rangeLabelMap: Record<FraudTrendInterval, string> = {
    hourly: '1시간 기준',
    daily: '1일 기준',
    weekly: '7일 기준',
    monthly: '30일 기준',
  };
  const rangeLabel = rangeLabelMap[interval];

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
            totalTransactions={totalTransactions}
            totalFraud={totalFraud}
            averageFraud={averageFraud}
            fraudRatio={fraudRatio}
            rangeLabel={rangeLabel}
          />
          <ChartsGrid chartData={chartData} />
        </>
      )}
    </div>
  );
}
