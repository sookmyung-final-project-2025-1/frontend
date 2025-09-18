'use client';

import { useHealthQuery } from '@/hooks/queries/dashboard/useHealthQuery';
import {
  useKpiQuery,
  type Kpi,
  type UseKpiQueryArgs,
} from '@/hooks/queries/dashboard/useKpiQuery';
import {
  useConfidenceQuery,
  type ConfidenceResponse,
  type UseConfidenceQueryArgs,
} from '@/hooks/queries/model/useConfidenceQuery';
import {
  useFeatureImportanceQuery,
  type FeatureImportanceResponse,
} from '@/hooks/queries/model/useFeatureImportanceQuery';
import {
  ThresholdResponse,
  useSaveThresholdMutation,
} from '@/hooks/queries/model/useSaveThreshold';
import {
  useSaveWeightsMutation,
  WeightsResponse,
  type WeightsRequest,
} from '@/hooks/queries/model/useWeights';
import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from 'react';

type SeriesProbRange = Readonly<{ startTime: string; endTime: string }>;

type Ctx = {
  kpi?: Kpi | null;
  confidence?: ConfidenceResponse | null;
  featureImportance?: FeatureImportanceResponse;
  online: boolean;

  // ranges
  confidenceRange: UseConfidenceQueryArgs;
  setConfidenceRange: (next: UseConfidenceQueryArgs) => void;
  kpiRange: UseKpiQueryArgs;
  setKpiRange: (next: UseKpiQueryArgs) => void;
  seriesProbRange: SeriesProbRange;
  setSeriesProbRange: (next: SeriesProbRange) => void;

  // loading/error
  loading: { any: boolean };
  error: { any: boolean };

  // mutations (API 스펙 그대로)
  saveWeights: (req: WeightsRequest) => Promise<WeightsResponse>;
  savingWeights: boolean;
  saveThreshold: (t: number) => Promise<ThresholdResponse>;
  savingThreshold: boolean;
};

const DashboardDataCtx = createContext<Ctx | null>(null);

// ---- helpers (필요하면 컴포넌트에서 import해서 사용) ----
export function isoNow() {
  return new Date().toISOString();
}
export function isoHoursAgo(h: number) {
  const baseMs = new Date('2017-01-01T00:00:00+09:00').getTime(); // ✅ ms로
  const target = new Date(baseMs - h * 3600 * 1000);
  return target.toISOString(); // 항상 Z(UTC)로 나옴
}

/** 도메인 형태 { lgbm, xgb, cat } -> API 스펙(WeightsRequest) 변환기 */
export function toWeightsRequest(w: Record<string, number>): WeightsRequest {
  return {
    lgbmWeight: w.lgbm ?? 0,
    xgboostWeight: w.xgb ?? 0,
    catboostWeight: w.cat ?? 0,
    autoNormalize: true,
    validWeightSum: true,
  };
}

export function DashboardDataProvider({
  children,
  initialConfidenceRange,
  initialKpiRange,
  initialSeriesProbRange,
}: PropsWithChildren & {
  initialConfidenceRange?: Partial<UseConfidenceQueryArgs>;
  initialKpiRange?: Partial<UseKpiQueryArgs>;
  initialSeriesProbRange?: Partial<SeriesProbRange>;
}) {
  const defaultConfidenceRange: UseConfidenceQueryArgs = useMemo(
    () => ({
      startTime: initialConfidenceRange?.startTime ?? isoHoursAgo(24),
      endTime: initialConfidenceRange?.endTime ?? isoNow(),
      period: initialConfidenceRange?.period ?? 'hourly',
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

  const [confidenceRange, setConfidenceRange] = useState(
    defaultConfidenceRange
  );
  const [kpiRange, setKpiRange] = useState(defaultKpiRange);
  const [seriesProbRange, setSeriesProbRange] = useState(
    defaultSeriesProbRange
  );

  const kpiQ = useKpiQuery(kpiRange);
  const confQ = useConfidenceQuery(confidenceRange);
  const featQ = useFeatureImportanceQuery(1000);
  const healthQ = useHealthQuery();

  const saveWeightsM = useSaveWeightsMutation();
  const saveThresholdM = useSaveThresholdMutation();

  const value: Ctx = {
    kpi: kpiQ.data ?? null,
    confidence: confQ.data ?? null,
    featureImportance: featQ.data,
    online: !!healthQ.data,

    confidenceRange,
    setConfidenceRange,
    kpiRange,
    setKpiRange,
    seriesProbRange,
    setSeriesProbRange,

    loading: {
      any:
        kpiQ.isLoading ||
        confQ.isLoading ||
        featQ.isLoading ||
        healthQ.isLoading,
    },
    error: {
      any: !!kpiQ.error || !!confQ.error || !!featQ.error || !!healthQ.error,
    },

    saveWeights: async (req) => saveWeightsM.mutateAsync(req),
    savingWeights: saveWeightsM.isPending,

    saveThreshold: async (t) => saveThresholdM.mutateAsync(t),
    savingThreshold: saveThresholdM.isPending,
  };

  return (
    <DashboardDataCtx.Provider value={value}>
      {children}
    </DashboardDataCtx.Provider>
  );
}

export function useDashboardData() {
  const ctx = useContext(DashboardDataCtx);
  if (!ctx) {
    throw new Error(
      'useDashboardData must be used within DashboardDataProvider'
    );
  }
  return ctx;
}
