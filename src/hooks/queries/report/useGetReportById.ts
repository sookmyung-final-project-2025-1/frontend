// hooks/queries/report/useGetReportById.ts
import { useApiQuery } from '../useApi';

/** ---------------- Types ---------------- */
export type ReportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
export type ReportSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
export type ReportStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | string;

export type ReportDetail = {
  reportId: number;
  transactionId: number;
  reportedBy: string;
  reason: string;
  description: string;
  status: ReportStatus;
  reviewedBy: string | null;
  reviewComment: string | null;
  isFraudConfirmed: boolean;
  reportedAt: string; // ISO datetime
  reviewedAt: string | null; // ISO datetime or null
  transactionDetails: Record<string, unknown>; // 추가 필드 자유형
  priority: ReportPriority | null;
  severity: ReportSeverity | null;
  category: string | null;
  message: string | null;
};

/** ---------------- Hook ---------------- */
export const useGetReportById = (reportId: number) =>
  useApiQuery<ReportDetail>({
    queryKey: ['reportDetail', reportId],
    queryOptions: {
      endpoint: `/proxy/reports/${reportId}`,
      authorization: true,
    },
  });
