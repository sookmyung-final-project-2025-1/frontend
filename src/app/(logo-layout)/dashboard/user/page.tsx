'use client';

import ReportDetailDrawer from '@/components/report/ReportDetailDrawer';
import ReportFilters, {
  ReportFiltersValue,
} from '@/components/report/ReportFilters';
import ReportsTable from '@/components/report/ReportsTable';
import ReportStatsCards from '@/components/report/ReportStatsCards';
import { useGetPendingCount } from '@/hooks/queries/report/useGetPendingCount';
import { useGetReport } from '@/hooks/queries/report/useGetReport';
import { useGetReportStats } from '@/hooks/queries/report/useGetReportStats';
import { AlertTriangle, Clock, Filter, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

// 페이지 기본 페이지네이션
const DEFAULT_PAGEABLE = {
  page: 0,
  size: 10,
  sort: ['reportedAt,desc'],
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

  // 리스트 데이터
  const listQuery = useGetReport({
    status: filters.status,
    reportedBy: filters.reportedBy || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
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

        <button
          onClick={refresh}
          className='inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700'
        >
          <RefreshCw className='w-4 h-4' />
          새로고침
        </button>
      </div>

      {/* 통계 카드 */}
      <ReportStatsCards
        stats={statsQuery.data ?? null}
        statsLoading={statsQuery.isLoading}
        pendingCount={pendingQuery.data?.pendingCount ?? 0}
        pendingLoading={pendingQuery.isLoading}
      />

      {/* 필터 */}
      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
        <div className='flex items-center gap-2 mb-3 text-slate-300'>
          <Filter className='w-4 h-4' />
          <span className='text-sm'>필터</span>
        </div>
        <ReportFilters
          value={filters}
          onChange={applyFilters}
          isLoading={listQuery.isFetching}
        />
      </div>

      {/* 리스트 테이블 (로딩 중에도 상단은 유지, 표 영역만 상태 표시) */}
      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-4'>
        <div className='flex items-center justify-between mb-3'>
          <div className='text-sm text-slate-400 flex items-center gap-2'>
            <Clock className='w-4 h-4' />
            {listQuery.isFetching ? '불러오는 중...' : '목록'}
          </div>

          <div className='text-sm text-slate-400'>
            총{' '}
            <span className='text-slate-200 font-medium'>
              {listQuery.data?.totalElements?.toLocaleString() ?? 0}
            </span>
            건
          </div>
        </div>

        <ReportsTable
          rows={content}
          loading={listQuery.isFetching && !listQuery.data}
          page={pageable.page}
          size={pageable.size}
          totalPages={listQuery.data?.totalPages ?? 0}
          onPageChange={(page) => setPageable((p) => ({ ...p, page }))}
          onPageSizeChange={(size) =>
            setPageable((p) => ({ ...p, page: 0, size }))
          }
          onRowClick={(id) => setActiveReportId(id)}
        />
      </div>

      {/* 상세 Drawer */}
      <ReportDetailDrawer
        reportId={activeReportId}
        onClose={() => setActiveReportId(null)}
        onChanged={refresh}
      />

      {/* 에러 표시(최소화) */}
      {(listQuery.error || statsQuery.error || pendingQuery.error) && (
        <div className='bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-200 text-sm flex items-center gap-2'>
          <AlertTriangle className='w-4 h-4' />
          일부 데이터를 불러오지 못했습니다.
        </div>
      )}
    </div>
  );
}
