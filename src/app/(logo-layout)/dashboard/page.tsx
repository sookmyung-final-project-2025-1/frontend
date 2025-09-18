'use client';

import AppProviders from '@/contexts/AppProviders';

import StreamingDetectionChart from '@/components/dashboard/streaming/StreamingDetectionChart';
import TopBarContainer from '@/components/dashboard/TopBarContainer';

import ConfidenceChart from '@/components/dashboard/ConfidenceChart';
import FeatureImportanceChart from '@/components/dashboard/FeatureImportanceChart';
import KpiCards from '@/components/dashboard/KpiCards';
import ProbChart from '@/components/dashboard/ProbChart';
import TablePlaceholder from '@/components/dashboard/TablePlaceholder';
import ThresholdSettings from '@/components/dashboard/ThresholdSettings';
import WeightsSettings from '@/components/dashboard/WeightsSettings';

import RealtimeMetricsPanel from '@/components/dashboard/RealtimeMatricsPanel';
import SystemHealth from '@/components/dashboard/SystemHealth';
import { useDashboardData } from '@/contexts/DashboardActionsContext';
import { useStreaming } from '@/contexts/StreamingContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function DashboardInner() {
  const router = useRouter();

  // 스트리밍(실시간/타임머신)
  const { mode, data: streamingData, status: streamingStatus } = useStreaming();

  // 대시보드 데이터
  const {
    kpi,
    confidence,
    featureImportance,
    error,

    // 범위 (확률/신뢰도 그래프)
    confidenceRange,
    setConfidenceRange,
    kpiRange,
    setKpiRange,
    seriesProbRange,
    setSeriesProbRange,

    // 저장 액션
    saveWeights,
    savingWeights,
    saveThreshold,
    savingThreshold,
  } = useDashboardData();

  const [threshold, setThreshold] = useState<number>(0.5);
  const handleSaveThreshold = async () => {
    await saveThreshold(threshold);
  };

  const timeRangeForChart: '24h' | '7d' | '30d' = '24h';

  return (
    <div className='min-h-screen py-8 space-y-8 w-full px-6'>
      {/* 에러 표시 */}
      {error.any && (
        <div className='bg-red-900 border border-red-700 rounded-lg p-4 text-red-200'>
          일부 데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      {/* 상단 컨트롤 바 */}
      <TopBarContainer />

      {/* 메인 스트리밍 차트 + 사이드 설정 */}
      <div className='grid grid-cols-12 gap-8'>
        {/* 스트리밍 탐지 차트 */}
        <div className='col-span-12 xl:col-span-9'>
          <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
            <h2 className='text-xl font-semibold text-slate-200 mb-4'>
              실시간 사기 탐지
            </h2>
            <div className='relative'>
              <div className='h-[450px]'>
                <StreamingDetectionChart
                  data={streamingData}
                  playing={
                    mode === 'realtime' ? streamingStatus.playing : false
                  }
                  currentPosition={100}
                  threshold={threshold}
                  timeRange={timeRangeForChart}
                  virtualTime={streamingStatus.virtualTime ?? ''}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 설정 패널 */}
        <div className='col-span-12 xl:col-span-3 space-y-6'>
          <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-6'>
            <h3 className='text-lg font-semibold text-slate-200 mb-4'>
              임계치 설정
            </h3>
            <ThresholdSettings
              onChange={setThreshold}
              onSave={handleSaveThreshold}
            />
          </div>

          <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-6'>
            <h3 className='text-lg font-semibold text-slate-200 mb-4'>
              모델 가중치
            </h3>
            <WeightsSettings />
          </div>
        </div>
      </div>

      {/* KPI 카드들 */}
      <KpiCards kpi={kpi ?? null} />

      {/* 실시간 메트릭 */}
      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8 relative'>
        <div className='flex items-start gap-3 mb-6'>
          <h3 className='text-xl font-semibold text-slate-200 flex-1 min-w-0 truncate'>
            실시간 메트릭
          </h3>
        </div>
        <RealtimeMetricsPanel />
      </div>

      {/* 분석 차트들 (확률 / 신뢰도) */}
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-8'>
        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8 relative'>
          <div className='flex items-start gap-3 mb-6'>
            <h3 className='text-xl font-semibold text-slate-200 flex-1 min-w-0 truncate'>
              확률 분석
            </h3>
          </div>
          <ProbChart range={seriesProbRange} />
        </div>

        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8 relative'>
          <div className='flex items-start gap-3 mb-6'>
            <h3 className='text-xl font-semibold text-slate-200 flex-1 min-w-0 truncate'>
              신뢰도 분석
            </h3>
          </div>
          <ConfidenceChart range={confidenceRange} />
        </div>
      </div>

      {/* 하단 영역 (두 카드만) */}
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-8'>
        {/* 특성 중요도 */}
        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8 relative'>
          <div className='flex items-start gap-3 mb-6'>
            <h3 className='text-xl font-semibold text-slate-200 flex-1 min-w-0 truncate'>
              특성 중요도
            </h3>
          </div>
          <div className='h-[350px]'>
            <FeatureImportanceChart data={featureImportance} />
          </div>
        </div>

        {/* 추가 위젯 자리 */}
        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8 relative'>
          <div className='flex items-start gap-3 mb-6'>
            <h3 className='text-xl font-semibold text-slate-200 flex-1 min-w-0 truncate'>
              시스템 상태
            </h3>
          </div>
          <div className='min-h-[500px]'>
            <SystemHealth />
          </div>
        </div>
      </div>

      {/* 거래 내역 - 항상 전체 화면 섹션만 노출 */}
      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8 relative'>
        <div className='flex items-start gap-3 mb-6'>
          <h3 className='text-xl font-semibold text-slate-200 flex-1 min-w-0 truncate'>
            고위험 거래 내역
          </h3>
          <button
            type='button'
            className='px-3 py-1 rounded-xl border border-slate-600 hover:bg-slate-800 text-sm shrink-0'
            onClick={() => router.push('/transactions')}
          >
            전체 거래 내역 보기
          </button>
        </div>
        <div className='min-h-[500px]'>
          <TablePlaceholder />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const initialTimeRange = {
    startTime: '2017-01-01T00:00:00+09:00',
    endTime: '2018-09-16T23:59:59.999+09:00',
  };

  return (
    <AppProviders
      initialConfidenceRange={{ ...initialTimeRange, period: 'hourly' }}
      initialKpiRange={initialTimeRange}
      initialSeriesProbRange={initialTimeRange}
    >
      <DashboardInner />
    </AppProviders>
  );
}
