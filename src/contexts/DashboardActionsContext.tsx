'use client';

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

// Queries
import {
  useConfidenceQuery,
  type ConfidenceResponse,
  type UseConfidenceQueryArgs,
} from '@/hooks/queries/dashboard/useConfidenceQuery';
import {
  useFeatureImportanceQuery,
  type FeatureImportanceResponse,
} from '@/hooks/queries/dashboard/useFeatureImportanceQuery';
import { useHealthQuery } from '@/hooks/queries/dashboard/useHealthQuery';
import {
  useKpiQuery,
  type Kpi,
  type UseKpiQueryArgs,
} from '@/hooks/queries/dashboard/useKpiQuery';
// NOTE: seriesProb는 "범위"만 다루므로 쿼리 훅이 필요 없다면 import 제거해도 됨
// 만약 /series/prob가 진짜로 범위를 돌려주는 GET이라면 타입은 아래 Range 타입과 동일해야 함.

import { useSaveThresholdMutation } from '@/hooks/queries/dashboard/useSaveThreshold';
import {
  useSaveWeightsMutation,
  type WeightsRequest,
} from '@/hooks/queries/dashboard/useWeights';

// === types ===
type SeriesProbRange = Readonly<{ startTime: string; endTime: string }>;

type DashboardCtx = {
  // data
  kpi?: Kpi | null;
  confidence?: ConfidenceResponse;
  featureImportance?: FeatureImportanceResponse;
  online: boolean;
  seriesProb?: SeriesProbRange;

  // loading flags
  loading: {
    kpi: boolean;
    confidence: boolean;
    featureImportance: boolean;
    health: boolean;
    any: boolean;
  };

  // error states
  error: {
    kpi: boolean;
    confidence: boolean;
    featureImportance: boolean;
    health: boolean;
    any: boolean;
  };

  // refetch
  refetch: {
    kpi: () => Promise<any>;
    confidence: () => Promise<any>;
    featureImportance: () => Promise<any>;
    health: () => Promise<any>;
    all: () => Promise<any[]>;
  };

  // actions
  actions: {
    saveWeights: (w: Record<string, number>) => Promise<void>;
    savingWeights: boolean;

    saveThreshold: (t: number) => Promise<void>;
    savingThreshold: boolean;

    // confidence 범위 제어
    setConfidenceRange: (next: UseConfidenceQueryArgs) => void;
    confidenceRange: UseConfidenceQueryArgs;

    // kpi 범위 제어
    setKpiRange: (next: UseKpiQueryArgs) => void;
    kpiRange: UseKpiQueryArgs;

    // seriesProb "범위" 제어 (데이터 아님)
    setSeriesProbRange: (next: SeriesProbRange) => void;
    seriesProbRange: SeriesProbRange;
  };
};

const Ctx = createContext<DashboardCtx | null>(null);

// === helpers ===
function isoNow(): string {
  return new Date().toISOString();
}
function isoHoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}

// UI의 단순 레코드 -> API 요청 스키마로 변환
function toWeightsRequest(w: Record<string, number>): WeightsRequest {
  return {
    // 오타 주의: lgbm
    lgbmWeight: w.lgbm ?? 0,
    xgboostWeight: w.xgb ?? 0,
    catboostWeight: w.cat ?? 0,
    autoNormalize: true,
    validWeightSum: true,
  };
}

export function DashboardActionsProvider({
  children,
  initialConfidenceRange,
  initialKpiRange,
  initialSeriesProbRange,
}: PropsWithChildren & {
  initialConfidenceRange?: Partial<UseConfidenceQueryArgs>;
  initialKpiRange?: Partial<UseKpiQueryArgs>;
  initialSeriesProbRange?: Partial<SeriesProbRange>;
}) {
  // ----- 기본 범위 설정 -----
  const defaultConfidenceRange: UseConfidenceQueryArgs = useMemo(
    () => ({
      startTime: initialConfidenceRange?.startTime ?? isoHoursAgo(24),
      endTime: initialConfidenceRange?.endTime ?? isoNow(),
      period: initialConfidenceRange?.period ?? 'hourly',
      // 필요하면 enabled/staleTime도 여기에 포함 가능
    }),
    [initialConfidenceRange]
  );

  const defaultKpiRange: UseKpiQueryArgs = useMemo(
    () => ({
      startTime: initialKpiRange?.startTime ?? isoHoursAgo(24),
      endTime: initialKpiRange?.endTime ?? isoNow(),
    }),
    [initialKpiRange]
  );

  const defaultSeriesProbRange: SeriesProbRange = useMemo(
    () => ({
      startTime: initialSeriesProbRange?.startTime ?? isoHoursAgo(24),
      endTime: initialSeriesProbRange?.endTime ?? isoNow(),
    }),
    [initialSeriesProbRange]
  );

  // ----- 범위 상태 -----
  const [confidenceRange, setConfidenceRange] =
    useState<UseConfidenceQueryArgs>(defaultConfidenceRange);
  const [kpiRange, setKpiRange] = useState<UseKpiQueryArgs>(defaultKpiRange);
  const [seriesProbRange, setSeriesProbRange] = useState<SeriesProbRange>(
    defaultSeriesProbRange
  );

  // ----- data queries -----
  const kpiQ = useKpiQuery(kpiRange);
  const confQ = useConfidenceQuery(confidenceRange);
  const featQ = useFeatureImportanceQuery(1000); // sampleSize 기본값
  const healthQ = useHealthQuery();

  // ----- actions -----
  const saveWeightsM = useSaveWeightsMutation();
  const saveThresholdM = useSaveThresholdMutation(); // 훅은 콜백 내부에서 호출하지 말 것

  const saveWeights = useCallback(
    async (w: Record<string, number>) => {
      await saveWeightsM.mutateAsync(toWeightsRequest(w));
    },
    [saveWeightsM]
  );

  const saveThreshold = useCallback(
    async (t: number) => {
      await saveThresholdM.mutateAsync(t);
    },
    [saveThresholdM]
  );

  const value: DashboardCtx = {
    kpi: kpiQ.data ?? null,
    confidence: confQ.data,
    featureImportance: featQ.data,
    online: !!healthQ.data,

    loading: {
      kpi: kpiQ.isLoading,
      confidence: confQ.isLoading,
      featureImportance: featQ.isLoading,
      health: healthQ.isLoading,
      any:
        kpiQ.isLoading ||
        confQ.isLoading ||
        featQ.isLoading ||
        healthQ.isLoading,
    },

    error: {
      kpi: !!kpiQ.error,
      confidence: !!confQ.error,
      featureImportance: !!featQ.error,
      health: !!healthQ.error,
      any: !!kpiQ.error || !!confQ.error || !!featQ.error || !!healthQ.error,
    },

    refetch: {
      kpi: () => kpiQ.refetch(),
      confidence: () => confQ.refetch(),
      featureImportance: () => featQ.refetch(),
      health: () => healthQ.refetch(),
      all: () =>
        Promise.all([
          kpiQ.refetch(),
          confQ.refetch(),
          featQ.refetch(),
          healthQ.refetch(),
        ]),
    },

    actions: {
      saveWeights,
      savingWeights: saveWeightsM.isPending,

      saveThreshold,
      savingThreshold: saveThresholdM.isPending,

      setConfidenceRange,
      confidenceRange,

      setKpiRange,
      kpiRange,

      setSeriesProbRange,
      seriesProbRange, // ← 범위를 그대로 노출(데이터 아님)
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboard() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error(
      'useDashboard must be used within DashboardActionsProvider'
    );
  return ctx;
}
