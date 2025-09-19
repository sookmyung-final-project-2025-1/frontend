'use client';

import DailyStatsPanel from '@/components/dashboard/DailyStatsPanel';
import FraudTrend from '@/components/dashboard/FraudTrend';
import KpiCards from '@/components/dashboard/KpiCards';
import ProbChart from '@/components/dashboard/ProbChart';
import RealtimeOverview from '@/components/dashboard/RealtimeMatricsPanel';
import SystemHealth from '@/components/dashboard/SystemHealth';
import TablePlaceholder from '@/components/dashboard/TablePlaceholder';
import { useDashboardData } from '@/contexts/DashboardActionsContext';

export default function DashboardPage() {
  const { kpi, error, seriesProbRange } = useDashboardData();

  return (
    <div className='space-y-8'>
      {error.any && (
        <div className='bg-red-900 border border-red-700 rounded-lg p-4 text-red-200'>
          일부 데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      <section>
        <KpiCards kpi={kpi ?? null} />
      </section>

      <section className='grid grid-cols-1 gap-8'>
        <div className='col-span-1'>
          <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8 relative'>
            <h2 className='text-xl font-semibold text-slate-200'>
              사기 거래 트렌드 분석
            </h2>
            <div>
              <FraudTrend />
            </div>
          </div>
        </div>
      </section>

      <section className='grid grid-cols-1 gap-8'>
        <div className='col-span-1'>
          <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8 relative'>
            <h3 className='text-xl font-semibold text-slate-200 mb-6'>
              시스템 헬스 상태
            </h3>
            <div className='min-h-[500px]'>
              <SystemHealth />
            </div>
          </div>
        </div>
      </section>

      <section className='grid grid-cols-1 gap-8'>
        <div className='col-span-1'>
          <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8 relative'>
            <h3 className='text-xl font-semibold text-slate-200 mb-6'>
              실시간 메트릭
            </h3>
            <div className='min-h-[500px]'>
              <RealtimeOverview />
            </div>
          </div>
        </div>
      </section>

      <section className='grid grid-cols-1 gap-8'>
        <div className='col-span-1'>
          <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8 relative'>
            <h3 className='text-xl font-semibold text-slate-200 mb-6'>
              확률 분석
            </h3>
            <div className='flex flex-col space-y-6 w-full'>
              <ProbChart />
              <DailyStatsPanel />
            </div>
          </div>
        </div>
      </section>

      <section className='grid grid-cols-1 gap-8'>
        <div className='col-span-1'>
          <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8 relative'>
            <h3 className='text-xl font-semibold text-slate-200 mb-6'>
              고위험 거래 조회
            </h3>
            <div className='min-h-[500px]'>
              <TablePlaceholder />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
