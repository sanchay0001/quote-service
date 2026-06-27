import { z } from 'zod/v4';

export const VALID_STATUSES = ['New', 'In Review', 'Needs Info', 'Completed'] as const;
export type QuoteStatus = typeof VALID_STATUSES[number];

export const createQuoteSchema = z.object({
  customer: z.string().min(1, 'customer is required and cannot be empty'),
  project: z.string().min(1, 'project is required and cannot be empty'),
  status: z.enum(VALID_STATUSES).optional().default('New'),
  estimated_value: z
    .number('estimated_value must be a number')
    .nonnegative('estimated_value cannot be negative'),
});

export const updateStatusSchema = z.object({
  status: z.enum(VALID_STATUSES, `status must be one of: ${VALID_STATUSES.join(', ')}`),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().optional(),
  status: z.enum(VALID_STATUSES).optional(),
});

export type CreateQuoteDTO = z.infer<typeof createQuoteSchema>;
export type UpdateStatusDTO = z.infer<typeof updateStatusSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
