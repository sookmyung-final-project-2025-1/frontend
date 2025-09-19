/** ---------------- Utils ---------------- */
export const pad = (n: number) => String(n).padStart(2, '0');

// 서버 요구사항: 오프셋 없는 LocalDateTime 문자열(YYYY-MM-DDTHH:mm:ss)
export const toLocalDateTimeParam = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

export type FraudTrendInterval = 'hourly' | 'daily' | 'weekly' | 'monthly';

/** 선택한 'YYYY-MM-DD'와 interval에 맞춰 start/end 계산 */
export function makeRange(ymd: string, interval: FraudTrendInterval) {
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
