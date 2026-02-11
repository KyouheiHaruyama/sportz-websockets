import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Please set it in your .env file before starting the app.');
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
