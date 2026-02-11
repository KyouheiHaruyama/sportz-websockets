import { pgTable, serial, text, timestamp, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// Enum for match status
export const matchStatus = pgEnum('match_status', ['scheduled', 'live', 'finished']);

// Matches table
export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  sport: text('sport').notNull(),
  homeTeam: text('home_team').notNull(),
  awayTeam: text('away_team').notNull(),
  status: matchStatus('status').notNull(),
  startTime: timestamp('start_time', { withTimezone: false }).notNull(),
  endTime: timestamp('end_time', { withTimezone: false }),
  homeScore: integer('home_score').notNull().default(0),
  awayScore: integer('away_score').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Commentary table
export const commentary = pgTable('commentary', {
  id: serial('id').primaryKey(),
  matchId: integer('match_id')
    .notNull()
    .references(() => matches.id),
  minute: integer('minute'),
  sequence: integer('sequence'),
  period: integer('period'),
  eventType: text('event_type'),
  actor: text('actor'),
  team: text('team'),
  message: text('message'),
  metadata: jsonb('metadata'),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
