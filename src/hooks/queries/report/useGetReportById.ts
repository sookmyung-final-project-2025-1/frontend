// hooks/queries/report/useGetReportById.ts
import { useApiQuery } from '../useApi';

export type ReportDetail = {
  reportId: number;
  transactionId: number;
  reportedBy: string | null;
  reason: string | null;
  description: string | null;
  status: string | null;
  reviewedBy: string | null;
  reviewComment: string | null;
  isFraudConfirmed: boolean;
  reportedAt: string | null; // ISO
  reviewedAt: string | null; // ISO
  transactionDetails?: {
    amount?: number | null;
    merchant?: string | null;
    userId?: string | null;
    transactionTime?: string | null;
  } | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
  severity?: string | null;
  category?: string | null;
  message?: string | null;
};

export const useGetReportById = (reportId: number | null) => {
  const enabled = typeof reportId === 'number' && reportId > 0;

  return useApiQuery<ReportDetail>({
    queryKey: ['reportDetail', reportId ?? 0],
    queryOptions: {
      endpoint: enabled ? `/proxy/report/${reportId}` : '', // endpoint는 enabled일 때만 의미 있음
      authorization: true,
    },
    fetchOptions: {
      enabled, // 🔴 이게 핵심: 유효 ID일 때만 호출
    },
  });
};
