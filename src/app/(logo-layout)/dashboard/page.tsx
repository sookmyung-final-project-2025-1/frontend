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
import WeightsSettings from '@/components/dashboard/WeightsSettings';

import StreamingDetectionChart from '@/components/dashboard/StreamingDetectionChart';
import StreamingTopBar from '@/components/dashboard/StreamingTopBar';

type TimeRange = '24h' | '7d' | '30d';

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

  // 스트리밍 관련 상태들
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [currentPosition, setCurrentPosition] = useState<number>(100); // 시작을 100%로 설정

  // 모델 weights & threshold - 기본값
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

  // 시간 범위별 총 시간 (시간 단위)
  const totalDuration = useMemo(() => {
    switch (timeRange) {
      case '24h':
        return 24;
      case '7d':
        return 168; // 7 * 24
      case '30d':
        return 720; // 30 * 24
      default:
        return 24;
    }
  }, [timeRange]);

  // 스트리밍 데이터 생성 (실제로는 컨텍스트에서 관리되어야 함)
  const mockStreamingData = useMemo(() => {
    const data = [];
    const now = new Date();
    let hours: number;

    switch (timeRange) {
      case '24h':
        hours = 24;
        break;
      case '7d':
        hours = 168;
        break;
      case '30d':
        hours = 720;
        break;
      default:
        hours = 24;
    }

    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
    const dataPoints = Math.min(1000, hours * 6);

    for (let i = 0; i < dataPoints; i++) {
      const timestamp = new Date(
        startTime.getTime() +
          (i / dataPoints) * (now.getTime() - startTime.getTime())
      );

      const baseScore = Math.random();
      const isAnomaly = Math.random() > 0.9;
      const score = isAnomaly ? Math.random() * 0.3 + 0.7 : baseScore * 0.6;

      data.push({
        timestamp: timestamp.toISOString(),
        score: score,
        prediction: (score >= threshold ? 'fraud' : 'normal') as
          | 'fraud'
          | 'normal',
        confidence: Math.random() * 0.3 + 0.7,
        models: {
          lgbm: Math.random() * 0.4 + 0.2,
          xgb: Math.random() * 0.4 + 0.2,
          cat: Math.random() * 0.4 + 0.2,
        },
      });
    }

    return data;
  }, [timeRange, threshold]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  // Local actions
  const onPlay = () => setPlaying(true);
  const onPause = () => setPlaying(false);
  const onSeek = (iso: string) => setVirtualTime(iso);

  // 스트리밍 시간 범위 변경 - 기존 컨텍스트 actions 사용
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    setCurrentPosition(100); // 최신 시점으로 이동

    const now = new Date();
    let startTime: string;

    switch (range) {
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        break;
      case '7d':
        startTime = new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000
        ).toISOString();
        break;
      case '30d':
        startTime = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        ).toISOString();
        break;
    }

    const endTime = now.toISOString();

    // 기존 컨텍스트의 actions 사용
    actions.setKpiRange({ startTime, endTime });
    actions.setConfidenceRange({
      startTime,
      endTime,
      period: range === '24h' ? 'hourly' : range === '7d' ? 'daily' : 'weekly',
    });
    actions.setSeriesProbRange({ startTime, endTime });
  };

  // 기존 컨텍스트의 API 액션들 사용
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
      {/* 새로운 스트리밍 컨트롤 TopBar */}
      <StreamingTopBar
        playing={playing}
        speed={speed}
        online={online}
        virtualTime={virtualTime}
        onPlay={onPlay}
        onPause={onPause}
        onSpeedChange={setSpeed}
        onSeek={onSeek}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        currentPosition={currentPosition}
        onPositionChange={setCurrentPosition}
        totalDuration={totalDuration}
        onRefresh={onRefreshAll}
        loading={loading.any}
      />

      {/* 에러 상태 표시 */}
      {error.any && (
        <div className='bg-red-900 border border-red-700 rounded p-3 text-red-200'>
          일부 데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      {/* 스트리밍 탐지 결과 차트 */}
      <StreamingDetectionChart
        data={mockStreamingData}
        playing={playing}
        currentPosition={currentPosition}
        threshold={threshold}
        timeRange={timeRange}
        virtualTime={virtualTime}
      />

      {/* KPI 카드 */}
      <KpiCards kpi={kpi ?? null} />

      {/* 기존 차트 그리드 */}
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
        <ProbChart range={actions.seriesProbRange} />
        <ConfidenceChart data={confidence} />
      </div>

      {/* 설정 그리드 */}
      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
        <FeatureImportanceChart data={featureImportance} />
        <WeightsSettings
          weights={weights}
          normalized={normalized}
          onChange={handleWeightChange}
          onSave={onSaveWeights}
          onReset={resetWeights}
        />
      </div>

      {/* 임계치 설정 */}
      <ThresholdSettings
        threshold={threshold}
        onChange={setThreshold}
        onSave={onSaveThreshold}
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
