import z from 'zod';
import { TransactionSchema } from './transaction.schema';

export const FraudDetectionResultSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
  id: z.number(),
  transaction: TransactionSchema,
  lgbmScore: z.number(),
  xgboostScore: z.number(),
  catboostScore: z.number(),
  finalScore: z.number(),
  finalPrediction: z.number(),
  confidenceScore: z.number(),
  lgbmWeight: z.number(),
  xgboostWeight: z.number(),
  catboostWeight: z.number(),
  threshold: z.number(),
  predictionTime: z.string(),
  processingTimeMs: z.number(),
  featureImportance: z.string(),
  attentionScores: z.string(),
  modelVersion: z.string(),
});
