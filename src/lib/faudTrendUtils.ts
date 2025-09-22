/** ---------------- Utils ---------------- */
export const pad = (n: number) => String(n).padStart(2, '0');

// 서버 요구사항: 오프셋 없는 LocalDateTime 문자열(YYYY-MM-DDTHH:mm:ss)
export const toLocalDateTimeParam = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

export type FraudTrendInterval = 'hourly' | 'daily' | 'weekly' | 'monthly';

/**
 * 조회 윈도우를 "지금 기준으로 뒤로 가서" 계산
 * - hourly  : 최근 1일
 * - daily   : 최근 30일
 * - weekly  : 최근 7일
 * - monthly : 최근 30일
 *
 * endTime  = now
 * startTime = now - lookback
 */
export function makeRange(_ymd: string, interval: FraudTrendInterval) {
  // ❗ ymd는 무시하고, 항상 현재를 endTime으로 사용
  const now = new Date(); // 로컬 타임
  const end = new Date(now);

  const DAY = 24 * 60 * 60 * 1000;
  let lookbackDays = 30;

  switch (interval) {
    case 'hourly':
      lookbackDays = 1;
      break;
    case 'daily':
      lookbackDays = 30;
      break;
    case 'weekly':
      lookbackDays = 7;
      break;
    case 'monthly':
      lookbackDays = 30;
      break;
  }

  const start = new Date(end.getTime() - lookbackDays * DAY);

  return {
    startTime: toLocalDateTimeParam(start),
    endTime: toLocalDateTimeParam(end),
  };
}

/** ---- 차트/가공 타입 ---- */
export type TrendPoint = {
  date: string;
  fraudRate: number; // 0~1 또는 0~100
  fraudCount: number;
  totalCount: number;
};

export type ChartRow = {
  time: string;
  fraudCount: number;
  totalCount: number;
  fraudRatePct: number; // 0~100
};
