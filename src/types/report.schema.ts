import z from 'zod';
import { TransactionSchema } from './transaction.schema';

export const UserReportRequestSchema = z.object({
  reportedBy: z.string(),
  reason: z.string(),
  description: z.string(),
});

enum Status {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
}

export const UserReportResponseSchema = z.object({
  createdAt: z.string(),
  updatedAt: z.string(),
  id: z.number(),
  transaction: TransactionSchema,
  reportedBy: z.string(),
  reason: z.string(),
  description: z.string(),
  status: z.enum(Status),
  reviewedBy: z.string(),
  reviewComment: z.string(),
  isFraudConfirmed: z.boolean(),
});

export type UserReportRequestType = z.infer<typeof UserReportRequestSchema>;
export type UserReportResponseType = z.infer<typeof UserReportResponseSchema>;
