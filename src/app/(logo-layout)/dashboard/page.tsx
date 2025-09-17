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

  // (필요 시) 상단 필터와 동기화할 때 대시보드 범위도 같이 바꾸고 싶다면 아래처럼 호출하면 됨:
  // setKpiRange({ startTime, endTime });
  // setConfidenceRange({ startTime, endTime, period: 'hourly' | 'daily' | ... });
  // setSeriesProbRange({ startTime, endTime });

  const timeRangeForChart: '24h' | '7d' | '30d' = '24h'; // 스트리밍 차트 x축 라벨링용

  return (
    <div className='min-h-screen py-6 space-y-6 w-full'>
      {/* 상단 스트리밍 컨트롤(재생/일시정지/배속/리얼타임/타임머신) */}
      <TopBarContainer />

      {/* 에러/로딩 배지 (선택) */}
      {error.any && (
        <div className='bg-red-900 border border-red-700 rounded p-3 text-red-200'>
          일부 데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      {/* 스트리밍 탐지 결과 차트 (실시간/타임머신 모두 여기에서 표시) */}
      <StreamingDetectionChart
        data={streamingData}
        playing={mode === 'realtime' ? streamingStatus.playing : false}
        currentPosition={100}
        threshold={threshold}
        timeRange={timeRangeForChart}
        virtualTime={streamingStatus.virtualTime ?? ''}
      />

      {/* 임계치 설정 */}
      <ThresholdSettings onChange={setThreshold} onSave={handleSaveThreshold} />

      {/* KPI 카드 */}
      <KpiCards kpi={kpi ?? null} />

      {/* 확률/신뢰 차트 */}
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
        <ProbChart range={seriesProbRange} />
        <ConfidenceChart range={confidenceRange} />
      </div>

      {/* 중요도 + 가중치 설정 */}
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
        <FeatureImportanceChart data={featureImportance} />
        <WeightsSettings />
      </div>

      {/* (예시) 표 자리 */}
      <TablePlaceholder />
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
