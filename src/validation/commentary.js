import { z } from 'zod';

// Query: optional limit (coerced positive int, max 100)
export const listCommentaryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// Create commentary payload
// - minute: coerced non-negative integer (e.g., 0..n)
// - sequence: coerced non-negative integer used for ordering within the same minute
// - period, eventType, actor, team: required non-empty strings
// - message: required non-empty string
// - metadata: record of arbitrary values
// - tags: array of strings
export const createCommentarySchema = z.object({
  minute: z.coerce.number().int().nonnegative(),
  sequence: z.coerce.number().int().optional(),
  period: z.string().optional(),
  eventType: z.string().optional(),
  actor: z.string().optional(),
  team: z.string().optional(),
  message: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string()).optional(),
});
