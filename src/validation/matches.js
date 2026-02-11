import { z } from 'zod';

// Constant with lowercase values
export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
};

// Query: optional limit (coerced positive int, max 100)
export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// Route param: required id (coerced positive int)
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Create match payload
export const createMatchSchema = z.object({
    sport: z.string().min(1, 'sport is required'),
    homeTeam: z.string().min(1, 'homeTeam is required'),
    awayTeam: z.string().min(1, 'awayTeam is required'),
    // Require ISO strings for times
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
    // Optional scores: coerced non-negative integers
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),
  })
  .superRefine((val, ctx) => {
    // Ensure endTime is after startTime
    const start = new Date(val.startTime);
    const end = new Date(val.endTime);
    if (!(end > start)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endTime must be after startTime',
        path: ['endTime'],
      });
    }
  });

// Update scores payload: both required, coerced non-negative integers
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});
