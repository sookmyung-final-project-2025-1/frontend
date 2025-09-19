import { useApiMutation } from '../useApi';

type CreateRequest = {
  reportedBy: string;
  reason: string;
  description: string;
};

// 공통 enum들
export type ReportStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// 필요하면 더 확장: 다른 값도 올 수 있으면 string 허용
export type ReportReason = 'SUSPICIOUS_TRANSACTION' | string;

// 상세 필드
export interface ReportTransactionDetails {
  amount: number; // 예: 150000
  merchant: string; // 예: "WorldWide_Store_123"
  userId: string; // 예: "USER_12345"
  transactionTime: string; // ISO-like string, e.g. "2025-09-18T14:25:00"
  [k: string]: unknown; // 서버가 확장 필드를 추가할 수 있을 경우 대비
}

// 응답 전체
export interface CreateResponse {
  reportId: number;
  transactionId: number;
  reportedBy: string; // 이메일/사용자 식별자
  reason: ReportReason;
  description: string;
  status: ReportStatus; // "PENDING" 등
  reviewedBy: string | null;
  reviewComment: string | null;
  isFraudConfirmed: boolean;
  reportedAt: string; // "2025-09-18T14:30:00"
  reviewedAt: string | null;

  transactionDetails: ReportTransactionDetails;

  priority: PriorityLevel | null; // 서버 미설정 시 null
  severity: SeverityLevel | null; // 서버 미설정 시 null
  category: string | null; // 분류가 없으면 null

  message: string; // "신고가 성공적으로 접수되었습니다"
}

export const useCreateReport = () =>
  useApiMutation<CreateResponse, CreateRequest>({
    method: 'POST',
    endpoint: '/proxy/reports',
  });
