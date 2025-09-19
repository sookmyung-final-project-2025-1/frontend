import z from 'zod';

enum Status {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const PageableSchema = z.object({
  page: z.number(),
  size: z.number(),
  sort: z.array(z.string()),
});

// 거래 요청
export const TransactionRequestSchema = z.object({
  userId: z.string().optional(),
  merchant: z.string().optional(),
  category: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  isFraud: z.boolean().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  pageable: PageableSchema,
});

// 거래 응답
export const TransactionSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
  id: z.number(),
  userId: z.string(),
  amount: z.number(),
  merchant: z.string(),
  merchantCategory: z.string(),
  transactionTime: z.string(),
  virtualTime: z.string(),
  isFraud: z.boolean(),
  hasGoldLabel: z.boolean(),
  anonymizedFeatures: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  deviceFingerprint: z.string(),
  ipAddress: z.string(),
  status: z.string(),
  externalTransactionId: z.string(),
});
export type PageableType = z.infer<typeof PageableSchema>;
export type TransactionRequestType = z.infer<typeof TransactionRequestSchema>;
export type TransactionType = z.infer<typeof TransactionSchema>;
