import { QUERY_KEYS } from '@/hooks/queryKeys';
import { useApiMutation } from '../../useApi';

export type UserWeightRequest = {
  transactionRequest: TransactionRequest;
  lgbmWeight: number;
  xgboostWeight: number;
  catboostWeight: number;
  autoNormalize: boolean;
  weightSum: number;
  validWeightSum: boolean;
};

export type TransactionRequest = {
  transactionId: number;
  transactionDT: number;
  amount: number;
  productCode: string;

  // Card-related fields
  card1: string;
  card2: string;
  card3: string;
  card4: number;
  card5: string;
  card6: number;

  // Address / distance
  addr1: number;
  addr2: number;
  dist1: number;
  dist2: number;

  // Email domains
  purchaserEmailDomain: string;
  recipientEmailDomain: string;

  // Feature groups
  countingFeatures: Record<string, number>;
  timeDeltas: Record<string, number>;
  matchFeatures: Record<string, string>;
  vestaFeatures: Record<string, number>;
  identityFeatures: Record<string, number>;

  // Device / user / merchant
  deviceType: string;
  deviceInfo: string;
  userId: string;
  merchant: string;
  merchantCategory: string;

  // Time & geo
  transactionTime: string; // ISO datetime string (e.g., "2025-09-21T17:49:09.873Z")
  latitude: number;
  longitude: number;

  // Misc
  deviceFingerprint: string;
  ipAddress: string;

  // Model configuration
  modelWeights: Record<string, number>;
  threshold: number;
  modelVersion: string;
};

export type UserWeightResponse = {
  // 공통
  transactionId: number | string;
  finalScore: number;
  finalPrediction: boolean;
  threshold: number;
  processingTimeMs: number;
  modelVersion: string;

  // 상태/메타
  success?: boolean;
  errorMessage?: string | null;
  predictionTime?: string;

  // (신규) 평탄화된 스코어/가중치
  lgbmScore?: number;
  xgboostScore?: number;
  catboostScore?: number;
  lgbmWeight?: number;
  xgboostWeight?: number;
  catboostWeight?: number;

  // (이전 포맷 호환) 중첩 포맷도 올 수 있음
  modelScores?: {
    lgbm?: number;
    xgboost?: number;
    catboost?: number;
    [k: string]: number | undefined;
  };
  weights?: {
    lgbm?: number;
    xgboost?: number;
    catboost?: number;
    [k: string]: number | undefined;
  };

  // 부가 정보(옵셔널)
  attentionScores?: number[] | Record<string, number> | null;
  featureImportance?: Record<string, number> | null;
  confidenceScore?: number | null;
};

export const usePredictUserWeight = () =>
  useApiMutation<UserWeightResponse, UserWeightRequest>({
    method: 'POST',
    endpoint: `/proxy/model/predict/custom-weights`,
    authorization: true,
    invalidateKeys: [QUERY_KEYS.model],
  });
