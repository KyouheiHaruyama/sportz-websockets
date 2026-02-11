import express from 'express';
import 'dotenv/config';
import { db } from './db/db.js';
import { eq } from 'drizzle-orm';
import {matchRouter} from "./routes/matches.js";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 8000;

// JSONミドルウェア
app.use(express.json());

// ルートGET: 稼働確認
app.get('/', (_req, res) => {
  res.send('Neon + Drizzle + Express API is running.');
});

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
    res.status(500).json({ error: err.message });
  }
});

// Read: 全ユーザー取得
app.get('/users', async (_req, res) => {
  try {
    const all = await db.select().from(users);
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
});

app.use('/matches', matchRouter);
// app.use('/matches/:id/commentary', commentaryRouter);

// const { broadcastMatchCreated, broadcastCommentary } = attachWebSocketServer(server);
// app.locals.broadcastMatchCreated = broadcastMatchCreated;
// app.locals.broadcastCommentary = broadcastCommentary;

// サーバー起動
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});