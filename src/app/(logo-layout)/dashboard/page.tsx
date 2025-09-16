'use client';

import {
  DashboardActionsProvider,
  useDashboard,
} from '@/contexts/DashboardActionsContext';
import { useMemo, useState } from 'react';

import ConfidenceChart from '@/components/dashboard/ConfidenceChart';
import FeatureImportanceChart from '@/components/dashboard/FeatureImportanceChart';
import KpiCards from '@/components/dashboard/KpiCards';
import ProbChart from '@/components/dashboard/ProbChart';
import TablePlaceholder from '@/components/dashboard/TablePlaceholder';
import ThresholdSettings from '@/components/dashboard/ThresholdSettings';
import TopBar from '@/components/dashboard/TopBar';
import WeightsSettings from '@/components/dashboard/WeightsSettings';

function DashboardInner() {
  // 컨텍스트에서 모든 쿼리/액션 접근
  const {
    kpi,
    confidence,
    featureImportance,
    seriesProb,
    online,
    loading,
    error,
    actions,
    refetch,
  } = useDashboard();

  // Local UI state
  const [toast, setToast] = useState<string>('');
  const [speed, setSpeed] = useState<number>(10);
  const [playing, setPlaying] = useState<boolean>(false);
  const [virtualTime, setVirtualTime] = useState<string>('');

  // 모델 weights & threshold
  const [weights, setWeights] = useState<Record<string, number>>({
    lgbm: 0.34,
    xgb: 0.33,
    cat: 0.33,
  });
  const [threshold, setThreshold] = useState<number>(0.5);

  // 정규화된 가중치 계산
  const normalized = useMemo(() => {
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    const safe = sum > 0 ? sum : 1;
    return {
      lgbm: (weights.lgbm ?? 0) / safe,
      xgb: (weights.xgb ?? 0) / safe,
      cat: (weights.cat ?? 0) / safe,
    };
  }, [weights]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  // Local actions
  const onPlay = () => setPlaying(true);
  const onPause = () => setPlaying(false);
  const onSeek = (iso: string) => setVirtualTime(iso);

  // 시간 범위 변경 핸들러들
  const handleTimeRangeChange = (range: 'last24h' | 'last7d' | 'last30d') => {
    const now = new Date();
    let startTime: string;

    switch (range) {
      case 'last24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'last7d':
        startTime = new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000
        ).toISOString();
        break;
      case 'last30d':
        startTime = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        ).toISOString();
        break;
    }

    const endTime = now.toISOString();

    // 모든 범위 업데이트
    actions.setKpiRange({ startTime, endTime });
    actions.setConfidenceRange({
      startTime,
      endTime,
      period:
        range === 'last24h'
          ? 'hourly'
          : range === 'last7d'
            ? 'daily'
            : 'weekly',
    });
    actions.setSeriesProbRange({ startTime, endTime });
  };

  // API 액션들
  const onSaveWeights = async () => {
    try {
      await actions.saveWeights(weights);
      showToast('가중치 저장 완료');
    } catch (e: any) {
      showToast(`가중치 저장 실패: ${e?.message || 'unknown'}`);
    }
  };

  const onSaveThreshold = async () => {
    try {
      await actions.saveThreshold(threshold);
      showToast('임계치 저장 완료');
    } catch (e: any) {
      showToast(`임계치 저장 실패: ${e?.message || 'unknown'}`);
    }
  };

  const onRefreshAll = async () => {
    try {
      await refetch.all();
      showToast('데이터 새로고침 완료');
    } catch (e: any) {
      showToast(`새로고침 실패: ${e?.message || 'unknown'}`);
    }
  };

  // 가중치 변경 핸들러
  const handleWeightChange = (key: string, value: number) => {
    setWeights((prev) => ({ ...prev, [key]: value }));
  };

  const resetWeights = () => {
    setWeights({
      lgbm: 0.34,
      xgb: 0.33,
      cat: 0.33,
    });
  };

  return (
    <div className='min-h-screen py-6 space-y-6 w-full'>
      {/* 상단 바 - 시간 범위 선택 추가 */}
      <div className='flex justify-between items-center'>
        <TopBar
          playing={playing}
          speed={speed}
          online={online}
          virtualTime={virtualTime}
          onPlay={onPlay}
          onPause={onPause}
          onSpeedChange={setSpeed}
          onSeek={onSeek}
        />

        {/* 시간 범위 선택 버튼들 */}
        <div className='flex space-x-2'>
          <button
            onClick={() => handleTimeRangeChange('last24h')}
            className='px-3 py-1 text-sm border border-slate-600 rounded hover:bg-slate-700'
            disabled={loading.any}
          >
            24시간
          </button>
          <button
            onClick={() => handleTimeRangeChange('last7d')}
            className='px-3 py-1 text-sm border border-slate-600 rounded hover:bg-slate-700'
            disabled={loading.any}
          >
            7일
          </button>
          <button
            onClick={() => handleTimeRangeChange('last30d')}
            className='px-3 py-1 text-sm border border-slate-600 rounded hover:bg-slate-700'
            disabled={loading.any}
          >
            30일
          </button>
          <button
            onClick={onRefreshAll}
            className='px-3 py-1 text-sm bg-blue-600 rounded hover:bg-blue-700'
            disabled={loading.any}
          >
            {loading.any ? '새로고침 중...' : '새로고침'}
          </button>
        </div>
      </div>
      {/* 에러 상태 표시 */}
      {error.any && (
        <div className='bg-red-900 border border-red-700 rounded p-3 text-red-200'>
          일부 데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      )}
      {/* KPI 카드 */}
      {/* <KpiCards kpi={kpi ?? null} loading={loading.kpi} /> */}{' '}
      <KpiCards kpi={kpi ?? null} />
      {/* 차트 그리드 */}
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
        {/* <ProbChart data={seriesProb ?? []} loading={loading.seriesProb} /> */}
        <ProbChart range={actions.seriesProbRange} />
        <ConfidenceChart
          data={confidence}
          // loading={loading.confidence}
          // onRangeChange={actions.setConfidenceRange}
          // currentRange={actions.confidenceRange}
        />
      </div>
      {/* 설정 그리드 */}
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
        <FeatureImportanceChart
          data={featureImportance}
          // loading={loading.featureImportance}
        />
        <WeightsSettings
          weights={weights}
          normalized={normalized}
          onChange={handleWeightChange}
          onSave={onSaveWeights}
          onReset={resetWeights}
          // saving={actions.savingWeights}
        />
      </div>
      {/* 임계치 설정 */}
      <ThresholdSettings
        threshold={threshold}
        onChange={setThreshold}
        onSave={onSaveThreshold}
        // saving={actions.savingThreshold}
      />
      <TablePlaceholder />
      {/* 토스트 메시지 */}
      {toast && (
        <div className='fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2 text-sm shadow-lg z-50'>
          {toast}
        </div>
      )}
      {/* 로딩 오버레이 */}
      {loading.any && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40'>
          <div className='bg-slate-800 border border-slate-700 rounded-lg p-6 text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
            <p>데이터를 불러오는 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  // 초기 시간 범위 설정 (최근 24시간)
  const initialTimeRange = {
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date().toISOString(),
  };

  return (
    <DashboardActionsProvider
      initialConfidenceRange={{
        ...initialTimeRange,
        period: 'hourly',
      }}
      initialKpiRange={initialTimeRange}
      initialSeriesProbRange={initialTimeRange}
    >
      <DashboardInner />
    </DashboardActionsProvider>
  );
}
