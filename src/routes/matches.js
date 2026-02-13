import { Router } from 'express';
import {createMatchSchema, listMatchesQuerySchema} from "../validation/matches.js";
import {db} from "../db/db.js";
import {matches} from "../db/schema.js";
import {getMatchStatus} from "../utils/match-status.js";
import {desc} from "drizzle-orm";

export const matchRouter = Router();

const MAX_LIMIT = 100;

matchRouter.get("/", async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid query", details: { message: parsed.error.message, issues: parsed.error.issues } });
    }

    const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);

    try {
        const data = await db
            .select()
            .from(matches)
            .orderBy((desc(matches.createdAt)))
            .limit(limit);

        return res.json({ data });
    } catch (err) {
        console.error(`Failed to list matches: ${err}, stack: ${err?.stack}`);
        return res.status(500).json({ error: "Failed to list matches", details: { message: err?.message } });
    }
})

matchRouter.post("/", async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid payload", details: { message: parsed.error.message, issues: parsed.error.issues } });
    }

    const { data: { startTime, endTime, homeScore, awayScore } } = parsed;

    try {
        const computedStatus = getMatchStatus(startTime, endTime);
        const statusSafe = computedStatus ?? 'scheduled';

        const [event] = await db.insert(matches).values({
            ...parsed.data,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status: statusSafe
        }).returning();

        if (res.app.locals.broadcastMatchCreated) {
            res.app.locals.broadcastMatchCreated(event);
        }

        return res.status(201).json({ data: event });
    } catch (err) {
        console.error(`Failed to create match: ${err}, stack: ${err?.stack}`);
        res.status(500).json({ error: "Failed to create match", details: { message: err?.message } });
    }
})