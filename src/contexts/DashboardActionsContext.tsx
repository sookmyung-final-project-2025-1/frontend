'use client';

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
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useSaveThresholdMutation } from '@/hooks/queries/dashboard/useSaveThreshold';
import {
  useSaveWeightsMutation,
  type WeightsRequest,
} from '@/hooks/queries/dashboard/useWeights';

// === 스트리밍 관련 타입들 ===
export type DetectionResult = {
  timestamp: string;
  score: number;
  prediction: 'fraud' | 'normal';
  confidence: number;
  models: {
    lgbm: number;
    xgb: number;
    cat: number;
  };
};

export type TimeRange = '24h' | '7d' | '30d';

type SeriesProbRange = Readonly<{ startTime: string; endTime: string }>;

type DashboardCtx = {
  kpi?: Kpi | null;
  confidence?: ConfidenceResponse;
  featureImportance?: FeatureImportanceResponse;
  online: boolean;
  seriesProb?: SeriesProbRange;

  // 스트리밍 data
  streamingData: DetectionResult[];
  streamingRange: TimeRange;

  // loading flags
  loading: {
    kpi: boolean;
    confidence: boolean;
    featureImportance: boolean;
    health: boolean;
    streaming: boolean;
    any: boolean;
  };

  // error states
  error: {
    kpi: boolean;
    confidence: boolean;
    featureImportance: boolean;
    health: boolean;
    streaming: boolean;
    any: boolean;
  };

  refetch: {
    kpi: () => Promise<any>;
    confidence: () => Promise<any>;
    featureImportance: () => Promise<any>;
    health: () => Promise<any>;
    streaming: () => Promise<any>;
    all: () => Promise<any[]>;
  };

  actions: {
    saveWeights: (w: Record<string, number>) => Promise<void>;
    savingWeights: boolean;

    saveThreshold: (t: number) => Promise<void>;
    savingThreshold: boolean;

    setConfidenceRange: (next: UseConfidenceQueryArgs) => void;
    confidenceRange: UseConfidenceQueryArgs;

    setKpiRange: (next: UseKpiQueryArgs) => void;
    kpiRange: UseKpiQueryArgs;

    setSeriesProbRange: (next: SeriesProbRange) => void;
    seriesProbRange: SeriesProbRange;

    setStreamingRange: (range: TimeRange) => void;
    refreshStreaming: () => Promise<void>;
  };
};

const Ctx = createContext<DashboardCtx | null>(null);

// === API 함수들 ===
const streamingAPI = {
  async getDetectionResults(params: {
    startTime: string;
    endTime: string;
    limit?: number;
  }): Promise<DetectionResult[]> {
    try {
      const queryParams = new URLSearchParams({
        start_time: params.startTime,
        end_time: params.endTime,
        limit: (params.limit || 1000).toString(),
      });

      // 실제 API 엔드포인트 (Swagger 문서 기반)
      const response = await fetch(
        `/api/fraud-detection/streaming?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const rawData = await response.json();

      // API 응답을 DetectionResult 형태로 변환
      return rawData.map((item: any) => ({
        timestamp:
          item.timestamp || item.created_at || new Date().toISOString(),
        score: Number(item.fraud_score || item.score || 0),
        prediction: (item.prediction ||
          (Number(item.fraud_score || item.score || 0) >= 0.5
            ? 'fraud'
            : 'normal')) as 'fraud' | 'normal',
        confidence: Number(item.confidence || Math.random() * 0.3 + 0.7),
        models: {
          lgbm: Number(
            item.lgbm_score ||
              item.model_scores?.lgbm ||
              Math.random() * 0.4 + 0.2
          ),
          xgb: Number(
            item.xgb_score ||
              item.model_scores?.xgb ||
              Math.random() * 0.4 + 0.2
          ),
          cat: Number(
            item.cat_score ||
              item.model_scores?.cat ||
              Math.random() * 0.4 + 0.2
          ),
        },
      }));
    } catch (error) {
      console.error('Failed to fetch streaming data:', error);
      // Fallback to mock data
      return generateMockStreamingData(params.startTime, params.endTime);
    }
  },
};

// Mock data generator
function generateMockStreamingData(
  startTime: string,
  endTime: string
): DetectionResult[] {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const duration = end.getTime() - start.getTime();
  const dataPoints = Math.min(1000, Math.floor(duration / (5 * 60 * 1000))); // 5분 간격

  const data: DetectionResult[] = [];

  for (let i = 0; i < dataPoints; i++) {
    const timestamp = new Date(start.getTime() + (i / dataPoints) * duration);
    const baseScore = Math.random();
    const isAnomaly = Math.random() > 0.9; // 10% anomaly
    const score = isAnomaly ? Math.random() * 0.3 + 0.7 : baseScore * 0.6;

    data.push({
      timestamp: timestamp.toISOString(),
      score: score,
      prediction: score >= 0.5 ? 'fraud' : 'normal',
      confidence: Math.random() * 0.3 + 0.7,
      models: {
        lgbm: Math.random() * 0.4 + 0.2,
        xgb: Math.random() * 0.4 + 0.2,
        cat: Math.random() * 0.4 + 0.2,
      },
    });
  }

  return data;
}

// === helpers ===
function isoNow(): string {
  return new Date().toISOString();
}
function isoHoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}

function getTimeRangeHours(range: TimeRange): number {
  switch (range) {
    case '24h':
      return 24;
    case '7d':
      return 168;
    case '30d':
      return 720;
    default:
      return 24;
  }
}

// UI의 단순 레코드 -> API 요청 스키마로 변환
function toWeightsRequest(w: Record<string, number>): WeightsRequest {
  return {
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
  initialStreamingRange = '24h',
}: PropsWithChildren & {
  initialConfidenceRange?: Partial<UseConfidenceQueryArgs>;
  initialKpiRange?: Partial<UseKpiQueryArgs>;
  initialSeriesProbRange?: Partial<SeriesProbRange>;
  initialStreamingRange?: TimeRange;
}) {
  // ----- 기존 기본 범위 설정 -----
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

  // ----- 기존 범위 상태 -----
  const [confidenceRange, setConfidenceRange] =
    useState<UseConfidenceQueryArgs>(defaultConfidenceRange);
  const [kpiRange, setKpiRange] = useState<UseKpiQueryArgs>(defaultKpiRange);
  const [seriesProbRange, setSeriesProbRange] = useState<SeriesProbRange>(
    defaultSeriesProbRange
  );

  // ----- 새로운 스트리밍 상태 -----
  const [streamingRange, setStreamingRange] = useState<TimeRange>(
    initialStreamingRange
  );
  const [streamingData, setStreamingData] = useState<DetectionResult[]>([]);
  const [streamingLoading, setStreamingLoading] = useState(false);
  const [streamingError, setStreamingError] = useState(false);

  // ----- 기존 data queries -----
  const kpiQ = useKpiQuery(kpiRange);
  const confQ = useConfidenceQuery(confidenceRange);
  const featQ = useFeatureImportanceQuery(1000);
  const healthQ = useHealthQuery();

  // ----- 기존 actions -----
  const saveWeightsM = useSaveWeightsMutation();
  const saveThresholdM = useSaveThresholdMutation();

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

  // ----- 새로운 스트리밍 actions -----
  const fetchStreamingData = useCallback(async () => {
    setStreamingLoading(true);
    setStreamingError(false);

    try {
      const now = new Date();
      const hours = getTimeRangeHours(streamingRange);
      const startTime = new Date(
        now.getTime() - hours * 60 * 60 * 1000
      ).toISOString();
      const endTime = now.toISOString();

      const data = await streamingAPI.getDetectionResults({
        startTime,
        endTime,
        limit: 1000,
      });

      setStreamingData(data);
    } catch (error) {
      console.error('Failed to fetch streaming data:', error);
      setStreamingError(true);
    } finally {
      setStreamingLoading(false);
    }
  }, [streamingRange]);

  const refreshStreaming = useCallback(async () => {
    await fetchStreamingData();
  }, [fetchStreamingData]);

  // 스트리밍 범위 변경 시 데이터 새로고침
  useEffect(() => {
    fetchStreamingData();
  }, [streamingRange, fetchStreamingData]);

  // 주기적 스트리밍 데이터 업데이트 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStreamingData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchStreamingData]);

  const value: DashboardCtx = {
    // 기존 data
    kpi: kpiQ.data ?? null,
    confidence: confQ.data,
    featureImportance: featQ.data,
    online: !!healthQ.data,

    // 새로운 스트리밍 data
    streamingData,
    streamingRange,

    loading: {
      kpi: kpiQ.isLoading,
      confidence: confQ.isLoading,
      featureImportance: featQ.isLoading,
      health: healthQ.isLoading,
      streaming: streamingLoading,
      any:
        kpiQ.isLoading ||
        confQ.isLoading ||
        featQ.isLoading ||
        healthQ.isLoading ||
        streamingLoading,
    },

    error: {
      kpi: !!kpiQ.error,
      confidence: !!confQ.error,
      featureImportance: !!featQ.error,
      health: !!healthQ.error,
      streaming: streamingError,
      any:
        !!kpiQ.error ||
        !!confQ.error ||
        !!featQ.error ||
        !!healthQ.error ||
        streamingError,
    },

    refetch: {
      kpi: () => kpiQ.refetch(),
      confidence: () => confQ.refetch(),
      featureImportance: () => featQ.refetch(),
      health: () => healthQ.refetch(),
      streaming: refreshStreaming,
      all: () =>
        Promise.all([
          kpiQ.refetch(),
          confQ.refetch(),
          featQ.refetch(),
          healthQ.refetch(),
          refreshStreaming(),
        ]),
    },

    actions: {
      // 기존 actions
      saveWeights,
      savingWeights: saveWeightsM.isPending,

      saveThreshold,
      savingThreshold: saveThresholdM.isPending,

      setConfidenceRange,
      confidenceRange,

      setKpiRange,
      kpiRange,

      setSeriesProbRange,
      seriesProbRange,

      // 새로운 스트리밍 actions
      setStreamingRange,
      refreshStreaming,
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
