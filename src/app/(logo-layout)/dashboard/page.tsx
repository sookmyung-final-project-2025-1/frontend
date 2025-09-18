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
import { useDashboardData } from '@/contexts/DashboardActionsContext';
import { useStreaming } from '@/contexts/StreamingContext';
import { useMemo, useState } from 'react';

function DashboardInner() {
  // 스트리밍(실시간/타임머신) 상태 & 데이터
  const { mode, data: streamingData, status: streamingStatus } = useStreaming();

  // 대시보드 데이터(기존 KPI/Confidence/FeatureImportance 등)
  const {
    kpi,
    confidence,
    featureImportance,
    online,
    loading,
    error,

    // 범위 (ProbChart, KPI 등에서 사용)
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

  // --- Local UI state: weights & threshold ---
  const [weights, setWeights] = useState<Record<string, number>>({
    lgbm: 0.34,
    xgb: 0.33,
    cat: 0.33,
  });
  const [threshold, setThreshold] = useState<number>(0.5);

  // 정규화된 가중치 (UI 표시용)
  const normalized = useMemo(() => {
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    const safe = sum > 0 ? sum : 1;
    return {
      lgbm: (weights.lgbm ?? 0) / safe,
      xgb: (weights.xgb ?? 0) / safe,
      cat: (weights.cat ?? 0) / safe,
    };
  }, [weights]);

  const handleSaveThreshold = async () => {
    await saveThreshold(threshold);
  };

  const timeRangeForChart: '24h' | '7d' | '30d' = '24h';

  return (
    <div className='min-h-screen py-8 space-y-8 w-full px-6'>
      {/* 상단 컨트롤 바 */}
      <TopBarContainer />

      {/* 에러 표시 */}
      {error.any && (
        <div className='bg-red-900 border border-red-700 rounded-lg p-4 text-red-200'>
          일부 데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      {/* 메인 스트리밍 차트와 설정 */}
      <div className='grid grid-cols-12 gap-8'>
        {/* 스트리밍 탐지 차트 */}
        <div className='col-span-12 xl:col-span-9'>
          <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
            <h2 className='text-xl font-semibold text-slate-200 mb-6'>
              실시간 사기 탐지
            </h2>
            <div className='h-[450px]'>
              <StreamingDetectionChart
                data={streamingData}
                playing={mode === 'realtime' ? streamingStatus.playing : false}
                currentPosition={100}
                threshold={threshold}
                timeRange={timeRangeForChart}
                virtualTime={streamingStatus.virtualTime ?? ''}
              />
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

      {/* 분석 차트들 */}
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-8'>
        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
          <h3 className='text-xl font-semibold text-slate-200 mb-6'>
            확률 분석
          </h3>
          <div className='h-[400px]'>
            <ProbChart range={seriesProbRange} />
          </div>
        </div>

        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
          <h3 className='text-xl font-semibold text-slate-200 mb-6'>
            신뢰도 분석
          </h3>
          <div className='h-[400px]'>
            <ConfidenceChart range={confidenceRange} />
          </div>
        </div>
      </div>

      {/* 하단 영역 */}
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-8'>
        {/* 특성 중요도 */}
        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
          <h3 className='text-xl font-semibold text-slate-200 mb-6'>
            특성 중요도
          </h3>
          <div className='h-[350px]'>
            <FeatureImportanceChart data={featureImportance} />
          </div>
        </div>

        {/* 실시간 메트릭 */}
        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
          <h3 className='text-xl font-semibold text-slate-200 mb-6'>
            실시간 메트릭
          </h3>
          <div className='h-[350px]'>
            <RealtimeMetricsPanel />
          </div>
        </div>

        {/* 빈 공간 또는 추가 위젯 */}
        <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
          <h3 className='text-xl font-semibold text-slate-200 mb-6'>
            시스템 상태
          </h3>
          <div className='h-[350px] flex items-center justify-center'>
            <div className='text-slate-400'>추가 위젯 영역</div>
          </div>
        </div>
      </div>

      {/* 테이블 - 전체 너비 */}
      <div className='bg-slate-900/40 border border-slate-800 rounded-xl p-8'>
        <h3 className='text-xl font-semibold text-slate-200 mb-6'>거래 내역</h3>
        <div className='min-h-[500px]'>
          <TablePlaceholder />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  // 초기 시간 범위 (최근 24시간)
  const initialTimeRange = {
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date().toISOString(),
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
