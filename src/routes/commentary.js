import { Router } from 'express';
import { db } from '../db/db.js';
import { commentary, matches } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { matchIdParamSchema } from '../validation/matches.js';
import { createCommentarySchema, listCommentaryQuerySchema } from '../validation/commentary.js';

export const commentaryRouter = Router();

const MAX_LIMIT = 100;

// GET /matches/:id/commentary
commentaryRouter.get('/:id/commentary', async (req, res) => {
  // Validate params
  const paramsParsed = matchIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json({
      error: 'Invalid route params',
      details: { message: paramsParsed.error.message, issues: paramsParsed.error.issues },
    });
  }

  // Validate query
  const queryParsed = listCommentaryQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    return res.status(400).json({
      error: 'Invalid query',
      details: { message: queryParsed.error.message, issues: queryParsed.error.issues },
    });
  }

  const matchId = paramsParsed.data.id;
  const limit = Math.min(queryParsed.data.limit ?? 100, MAX_LIMIT);

  try {
    const data = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    return res.json({ data });
  } catch (err) {
    console.error(`Failed to list commentary: ${err}, stack: ${err?.stack}`);
    return res.status(500).json({
      error: 'Failed to list commentary',
      details: { message: err?.message },
    });
  }
});

// POST /matches/:id/commentary
commentaryRouter.post('/:id/commentary', async (req, res) => {
  // Validate params
  const paramsParsed = matchIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json({
      error: 'Invalid route params',
      details: { message: paramsParsed.error.message, issues: paramsParsed.error.issues },
    });
  }

  // Validate body
  const bodyParsed = createCommentarySchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({
      error: 'Invalid payload',
      details: { message: bodyParsed.error.message, issues: bodyParsed.error.issues },
    });
  }

  const matchId = paramsParsed.data.id;
  const data = bodyParsed.data;

  // period is now validated/coerced as an integer in the schema

  try {
    // Ensure the referenced match exists; if not, return 404
    const existingMatch = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    if (existingMatch.length === 0) {
      return res.status(404).json({ error: 'Match not found', details: { matchId } });
    }

      // Convert period (string in validation) to integer column; null if not numeric
      const periodInt = Number.isNaN(Number.parseInt(data.period, 10))
          ? null
          : Number.parseInt(data.period, 10);

    const [row] = await db
      .insert(commentary)
      .values({
        matchId,
        minute: data.minute,
        sequence: data.sequence,
        period: periodInt,
        eventType: data.eventType,
        actor: data.actor,
        team: data.team,
        message: data.message,
        metadata: data.metadata,
        tags: data.tags,
      })
      .returning();

    if (res.app.locals.broadcastCommentary) {
        res.app.locals.broadcastCommentary(matchId, row);
    }

    return res.status(201).json({ data: row });
  } catch (err) {
    // If the DB reports a foreign key violation (e.g., Postgres 23503), map to 404
    if (err && (err.code === '23503' || err?.name === 'ForeignKeyViolationError')) {
      return res.status(404).json({ error: 'Match not found', details: { matchId } });
    }

    console.error(`Failed to create commentary: ${err}, stack: ${err?.stack}`);
    return res.status(500).json({
      error: 'Failed to create commentary',
      details: { message: err?.message },
    });
  }
});
