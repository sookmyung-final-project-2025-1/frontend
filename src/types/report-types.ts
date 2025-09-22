// src/types/report-types.ts
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ReportItemStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'UNDER_REVIEW';

export type ReportReason =
  | 'UNAUTHORIZED_CHARGE'
  | 'SUSPICIOUS_TRANSACTION'
  | 'WRONG_AMOUNT'
  | 'DUPLICATE_CHARGE'
  | 'OTHER';

export type ReportItem = {
  reportId: number;
  transactionId: number;

  // reporter & meta
  reportedBy: string;
  reportedAt: string; // ISO
  status: ReportItemStatus;

  // review info (없을 수 있음)
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewComment: string | null;

  // content
  reason: string; // 백엔드가 enum 외 문자열도 줄 수 있으니 string 유지
  description: string;

  // flags
  isFraudConfirmed: boolean;

  // optional extra
  transactionDetails?: {
    amount?: number;
    merchant?: string;
    userId?: string;
    transactionTime?: string; // ISO
  };

  priority?: PriorityLevel | null;
  severity?: string | null;
  category?: string | null;
  message?: string | null;
};

export type ReportDetail = ReportItem;

export type PendingCounts = {
  pendingCount: number; // 대기중
  underReviewCount: number; // 검토중
  totalUnprocessed: number; // 처리 대기 총합
};

export type ReportStats = {
  totalReports: number;
  approvedReports: number;
  rejectedReports: number;
  pendingReports: number;

  approvalRate: number; // 0~1 또는 %
  goldLabelAccuracy: number; // %
  averageProcessingHours: number;

  period: string; // "7 days"
  calculatedAt: string; // ISO

  // 알려진 키는 부분 유니온으로, 새로운 키가 와도 안전하게 수용
  reportReasons: Partial<Record<ReportReason, number>> & Record<string, number>;
};

// 페이지네이션 응답(목록용)
export type PaginatedReports = {
  content: ReportItem[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
};
