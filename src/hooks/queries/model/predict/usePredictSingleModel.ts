// src/hooks/queries/model/usePredictSingleModel.ts
import { useMutation } from '@tanstack/react-query';

export type ModelType = 'lgbm' | 'xgboost' | 'catboost';

/** 서버가 요구하는 단일 모델 예측 요청 바디 */
export interface TransactionRequest {
  transactionId: number;
  transactionDT: number;
  amount: number;
  productCode: string;

  card1: string;
  card2: string;
  card3: string;
  card4: number;
  card5: string;
  card6: number;

  addr1: number;
  addr2: number;
  dist1: number;
  dist2: number;

  purchaserEmailDomain: string;
  recipientEmailDomain: string;

  countingFeatures: Record<string, number>;
  timeDeltas: Record<string, number>;
  matchFeatures: Record<string, string>;
  vestaFeatures: Record<string, number>;
  identityFeatures: Record<string, number>;

  deviceType: string;
  deviceInfo: string;
  userId: string;
  merchant: string;
  merchantCategory: string;

  transactionTime: string; // ISO e.g. "2025-09-21T18:42:05.741Z"
  latitude: number;
  longitude: number;

  deviceFingerprint: string;
  ipAddress: string;

  modelWeights: Record<string, number>;
  threshold: number;
  modelVersion: string;
}

/** 단일 모델 예측 응답 */
export interface SingleModelResponse {
  modelType: string;
  score: number;
  transactionId: string | number;
  processingTimeMs: number;
  modelVersion: string;
}

/** 훅: 단일 모델 예측 */
export function usePredictSingleModel() {
  return useMutation({
    mutationKey: ['predict-single-model'],
    mutationFn: async (vars: {
      model: ModelType;
      payload: TransactionRequest;
    }): Promise<SingleModelResponse> => {
      const res = await fetch(
        `/proxy/model/predict/single?modelType=${encodeURIComponent(vars.model)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(vars.payload),
        }
      );
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Request failed: ${res.status}`);
      }
      return res.json();
    },
  });
}
