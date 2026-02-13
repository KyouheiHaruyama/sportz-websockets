import express from 'express';
import 'dotenv/config';
import { db } from './db/db.js';
import { eq } from 'drizzle-orm';
import {matchRouter} from "./routes/matches.js";
import {commentaryRouter} from "./routes/commentary.js";
import { users } from './db/schema.js';
import http from 'http';
import {attachWebSocketServer} from "./ws/server.js";
import {securityMiddleware} from "./arcjet.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app);

// JSONミドルウェア
app.use(express.json());

const { broadcastMatchCreated, broadcastCommentary } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastCommentary;

// ルートGET: 稼働確認
app.get('/', (_req, res) => {
  res.send('Neon + Drizzle + Express API is running.');
});

app.use(securityMiddleware());

// Create: ユーザー作成
app.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body ?? {};
    if (!name || !email) {
      return res.status(400).json({ error: 'name と email は必須です' });
    }
    const inserted = await db.insert(users).values({ name, email }).returning();
    res.status(201).json(inserted[0]);
  } catch (err) {
    console.error('Failed to create user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Read: 全ユーザー取得
app.get('/users', async (_req, res) => {
  try {
    const all = await db.select().from(users);
    res.json(all);
  } catch (err) {
    console.error('Failed to list users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Read: 単一ユーザー取得
app.get('/users/:id', async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'id は数値です' });

    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: 'ユーザーが見つかりません' });
    res.json(row);
  } catch (err) {
    console.error('Failed to get user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update: ユーザー更新（部分更新対応）
app.put('/users/:id', async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'id は数値です' });

    const updates = {};
    if (typeof req.body?.name === 'string') updates.name = req.body.name;
    if (typeof req.body?.email === 'string') updates.email = req.body.email;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: '更新するフィールドがありません' });
    }

    const updated = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    if (updated.length === 0) return res.status(404).json({ error: 'ユーザーが見つかりません' });
    res.json(updated[0]);
  } catch (err) {
    console.error('Failed to update user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete: ユーザー削除
app.delete('/users/:id', async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'id は数値です' });

    const deleted = await db.delete(users).where(eq(users.id, id)).returning();
    if (deleted.length === 0) return res.status(404).json({ error: 'ユーザーが見つかりません' });
    res.json({ deleted: deleted[0] });
  } catch (err) {
    console.error('Failed to delete user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/matches', matchRouter);
app.use('/matches', commentaryRouter);

// const { broadcastMatchCreated, broadcastCommentary } = attachWebSocketServer(server);
// app.locals.broadcastMatchCreated = broadcastMatchCreated;
// app.locals.broadcastCommentary = broadcastCommentary;

// サーバー起動
server.listen(PORT, HOST, () => {
    const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;

    console.log(`Server is running on ${baseUrl}`);
    console.log(`WebSocket Server is running on ${baseUrl.replace('http', 'ws')}/ws`);
});