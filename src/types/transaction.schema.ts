import z from 'zod';

enum Status {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

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
  hadGoldLabel: z.boolean(),
  anonymizedFeatures: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  deviceFingerprint: z.string(),
  ipAddress: z.string(),
  status: z.enum(Status),
  externalTransactionOd: z.string(),
  goldLabel: z.boolean(),
});

export type TransactionType = z.infer<typeof TransactionSchema>;
