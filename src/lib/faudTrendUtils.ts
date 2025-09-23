/** ---------------- Utils ---------------- */
export const pad = (n: number) => String(n).padStart(2, '0');

// 서버 요구사항: 오프셋 없는 LocalDateTime 문자열(YYYY-MM-DDTHH:mm:ss)
export const toLocalDateTimeParam = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

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

// 문자열 리터럴로 고정해 <select>와 정확히 매칭되게 함
export const FRAUD_INTERVALS = [
  'hourly',
  'daily',
  'weekly',
  'monthly',
] as const;
export type FraudTrendInterval = (typeof FRAUD_INTERVALS)[number];

// 날짜 유틸
const startOfDay = (d: Date) => {
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  return dd;
};

const endOfDay = (d: Date) => {
  const dd = new Date(d);
  dd.setHours(23, 59, 59, 999);
  return dd;
};

function addDays(d: Date, n: number) {
  const dd = new Date(d);
  dd.setDate(dd.getDate() + n);
  return dd;
}

function addMonths(d: Date, n: number) {
  const dd = new Date(d);
  dd.setMonth(dd.getMonth() + n);
  return dd;
}

/**
 * makeRange
 * - hourly: 선택 날짜 1일 범위(시간 단위 집계)
 * - daily:  선택 날짜 1일 범위(일 단위 집계)
 * - weekly: 선택 날짜 포함 최근 7일
 * - monthly: 선택 날짜 기준 최근 1개월
 * 반환은 ISO 문자열(UTC)로.
 */
export function makeRange(selectedDate: string, interval: FraudTrendInterval) {
  const base = new Date(`${selectedDate}T00:00:00`);
  let start: Date;
  let end: Date;

  switch (interval) {
    case 'hourly': {
      start = startOfDay(base);
      end = endOfDay(base);
      break;
    }
    case 'daily': {
      start = startOfDay(base);
      end = endOfDay(base);
      break;
    }
    case 'weekly': {
      end = endOfDay(base);
      start = startOfDay(addDays(base, -6)); // 총 7일(선택일 포함)
      break;
    }
    case 'monthly': {
      end = endOfDay(base);
      start = startOfDay(addMonths(base, -1)); // 대략 최근 1개월
      break;
    }
    default: {
      start = startOfDay(base);
      end = endOfDay(base);
    }
  }

  return {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
}
