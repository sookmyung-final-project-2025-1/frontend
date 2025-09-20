// hooks/queries/report/useGetReportsByTransactionId.ts
import { useApiQuery } from '../useApi';

/** 공통 타입 (이미 있다면 import 해서 재사용하세요) */
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
  reportedAt: string; // ISO
  reviewedAt: string | null; // ISO 또는 null
  transactionDetails: Record<string, unknown>;
  priority: ReportPriority | null;
  severity: ReportSeverity | null;
  category: string | null;
  message: string | null;
};

export const useGetReportsByTransactionId = (transactionId: number) =>
  useApiQuery<ReportDetail[]>({
    queryKey: ['reports', 'by-transaction', transactionId],
    queryOptions: {
      endpoint: `/proxy/reports/transaction/${transactionId}`,
      authorization: true,
    },
  });
