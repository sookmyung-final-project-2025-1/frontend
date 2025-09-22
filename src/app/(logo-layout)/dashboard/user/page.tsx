// src/app/(logo-layout)/dashboard/reports/page.tsx
'use client';

import { ReportFiltersValue } from '@/components/report/ReportFilters';
import ReportStatsCards from '@/components/report/ReportStatsCards';
import { useGetPendingCount } from '@/hooks/queries/report/useGetPendingCount';
import { useGetReport } from '@/hooks/queries/report/useGetReport';
import { useGetReportStats } from '@/hooks/queries/report/useGetReportStats';
import { useMemo, useState } from 'react';

/** ===================== 시간 유틸 ===================== */
// 'YYYY-MM-DD' → 로컬 기준 자정/종료시각을 UTC ISO로 변환
const toISOStartOfDay = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0); // local
  return dt.toISOString(); // UTC ISO → 전역 useApi가 1970 시프트
};
const toISOEndOfDay = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1, 23, 59, 59, 999); // local inclusive
  return dt.toISOString();
};

// 페이지 기본 페이지네이션
const DEFAULT_PAGEABLE = {
  page: 0,
  size: 10,
  sort: [] as string[],
};

export default function ReportsPage() {
  // 필터 상태
  const [filters, setFilters] = useState<ReportFiltersValue>({
    status: 'PENDING',
    reportedBy: '',
    startDate: '',
    endDate: '',
  });

  // 페이지네이션 상태
  const [pageable, setPageable] = useState(DEFAULT_PAGEABLE);

  // 상세 Drawer 상태
  const [activeReportId, setActiveReportId] = useState<number | null>(null);

  // ✅ ISO로 변환 (서버 요구사항 충족)
  const startISO = filters.startDate?.trim()
    ? toISOStartOfDay(filters.startDate.trim())
    : undefined;
  const endISO = filters.endDate?.trim()
    ? toISOEndOfDay(filters.endDate.trim())
    : undefined;

  // 리스트 데이터
  const listQuery = useGetReport({
    status: filters.status,
    reportedBy: filters.reportedBy || undefined,
    // ⬇️ 형식 문제 해결: ISO(UTC)로 전달
    startDate: startISO,
    endDate: endISO,
    pageable,
  });

  // 통계/카운트
  const statsQuery = useGetReportStats(7);
  const pendingQuery = useGetPendingCount();

  const content = useMemo(
    () => listQuery.data?.content ?? [],
    [listQuery.data]
  );

  // 필터 적용 → 페이지 0으로
  const applyFilters = (v: ReportFiltersValue) => {
    setFilters(v);
    setPageable((p) => ({ ...p, page: 0 }));
  };

  // 새로고침 (리스트만)
  const refresh = () => listQuery.refetch();

  return (
    <div className='space-y-8 bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
      {/* 상단 헤더 */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>신고 관리</h1>
          <p className='text-sm text-slate-400'>신고 접수/검토/우선순위 관리</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <ReportStatsCards
        stats={statsQuery.data ?? null}
        statsLoading={statsQuery.isLoading}
        pendingCount={pendingQuery.data?.pendingCount ?? 0}
        pendingLoading={pendingQuery.isLoading}
      />
    </div>
  );
}
