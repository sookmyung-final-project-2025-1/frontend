import { useApiQuery } from '../useApi';

/** 조회 간격 */
export type FraudTrendInterval = 'hourly' | 'daily' | 'weekly' | 'monthly';

/** 서버가 주는 한 버킷(row) */
export type TrendPoint = {
  date: string; // "YYYY-MM-DD" 또는 "YYYY-MM-DDTHH:mm"
  fraudRate: number; // 0~1 또는 이미 %
  fraudCount: number;
  totalCount: number;
};

export type FraudTrendResponse = {
  interval: FraudTrendInterval;
  startTime: string; // ISO
  endTime: string; // ISO
  trends: TrendPoint[]; // ✅ 객체 배열로 수정
};

export type FraudTrendParameter = {
  startTime: string;
  endTime: string;
  interval: FraudTrendInterval; // default 'daily'
};

export const useFraudTrend = (args: FraudTrendParameter) => {
  const { startTime, endTime, interval } = args;

  const params = new URLSearchParams({
    startTime,
    endTime,
    interval,
  }).toString();

  return useApiQuery<FraudTrendResponse>({
    queryKey: ['fraudTrend', args],
    queryOptions: {
      endpoint: `/proxy/dashboard/fraud-trends?${params}`,
      // authorization: true, // 필요 시 주석 해제
    },
  });
};
