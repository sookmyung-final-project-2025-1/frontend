'use client';

import {
  useFraudTrend,
  type FraudTrendInterval,
  type TrendPoint,
} from '@/hooks/queries/dashboard/useFraudTrend';
import { useMemo } from 'react';
import ChartsGrid from '../ui/trend/ChartsGrid';
import StatsCards from '../ui/trend/StatsCards';

/** 외부에서 쓰는 차트 row 타입(동일 유지) */
export type ChartRow = {
  time: string; // 축 라벨
  fraudCount: number;
  totalCount: number;
  fraudRatePct: number; // 0~100
};

type Props = {
  startTime: string;
  endTime: string;
  interval: FraudTrendInterval;
};

/** 앞자리 연도를 2025로 강제 */
function forceYear2025(isoLike: string) {
  return /^\d{4}-/.test(isoLike) ? isoLike.replace(/^\d{4}/, '2025') : isoLike;
}

/** 보여줄 라벨 포맷(연도 강제 후, interval별로) */
function toDisplayLabel(dateStr: string, interval: FraudTrendInterval) {
  const s = forceYear2025(String(dateStr));
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return s;

  const d = new Date(t);
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const hh = d.getHours();
  const mi = d.getMinutes().toString().padStart(2, '0');

  switch (interval) {
    case 'hourly':
      return `${mm}/${dd} ${hh}:${mi}`;
    case 'daily':
    case 'weekly':
      return `${mm}/${dd}`;
    case 'monthly':
    default:
      return `${mm}`;
  }
}

export default function DataPanel({ startTime, endTime, interval }: Props) {
  const { data, isLoading, error } = useFraudTrend({
    startTime,
    endTime,
    interval,
  });

  const chartData: ChartRow[] = useMemo(() => {
    if (!data || !Array.isArray(data.trends)) return [];
    return (data.trends as TrendPoint[]).map((t) => {
      const rate = Number(t.fraudRate ?? 0);
      const pct = rate <= 1 ? rate * 100 : rate; // 0~1 → %
      return {
        time: toDisplayLabel(String(t.date ?? ''), interval),
        fraudCount: Number(t.fraudCount ?? 0),
        totalCount: Number(t.totalCount ?? 0),
        fraudRatePct: Number.isFinite(pct) ? pct : 0,
      };
    });
  }, [data, interval]);

  // 카드용 집계
  const { totalTransactions, totalFraud, averageFraud, fraudRatio } =
    useMemo(() => {
      const totals = chartData.reduce(
        (acc, r) => {
          acc.tx += r.totalCount || 0;
          acc.fr += r.fraudCount || 0;
          return acc;
        },
        { tx: 0, fr: 0 }
      );
      const buckets = chartData.length || 1;
      return {
        totalTransactions: totals.tx,
        totalFraud: totals.fr,
        averageFraud: Math.round(totals.fr / buckets),
        fraudRatio: totals.tx > 0 ? totals.fr / totals.tx : 0,
      };
    }, [chartData]);

  const rangeLabelMap: Record<FraudTrendInterval, string> = {
    hourly: '1시간 기준',
    daily: '1일 기준',
    weekly: '7일 기준',
    monthly: '30일 기준',
  };

  if (error) {
    return (
      <div className='rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-[#FCA5A5]'>
        데이터를 불러오지 못했습니다.
      </div>
    );
  }
  if (isLoading && chartData.length === 0) {
    return (
      <div className='rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400'>
        불러오는 중…
      </div>
    );
  }
  if (chartData.length === 0) {
    return (
      <div className='rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400'>
        표시할 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <StatsCards
        totalTransactions={totalTransactions}
        totalFraud={totalFraud}
        averageFraud={averageFraud}
        fraudRatio={fraudRatio}
        rangeLabel={rangeLabelMap[interval]}
      />
      <ChartsGrid chartData={chartData} />
    </div>
  );
}
