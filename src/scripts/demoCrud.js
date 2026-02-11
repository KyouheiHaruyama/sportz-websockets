import 'dotenv/config';
import { db } from '../db/db.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Please set it in your .env file.');
    process.exit(1);
  }

  console.log('--- Drizzle + Neon CRUD demo ---');

  // CREATE
  console.log('\n[CREATE] Inserting a user...');
  const name = 'Alice';
  const email = `alice_${Date.now()}@example.com`;
  const inserted = await db.insert(users).values({ name, email }).returning();
  const created = inserted[0];
  console.log('Created:', created);

  // READ ALL
  console.log('\n[READ] Selecting all users...');
  const all = await db.select().from(users);
  console.log('All users count:', all.length);

  // READ ONE
  console.log('\n[READ ONE] Selecting the created user by id...');
  const fetched = await db.select().from(users).where(eq(users.id, created.id)).limit(1);
  console.log('Fetched:', fetched[0]);

  // UPDATE
  console.log('\n[UPDATE] Updating the user name...');
  const updatedName = 'Alice Updated';
  const updated = await db
    .update(users)
    .set({ name: updatedName })
    .where(eq(users.id, created.id))
    .returning();
  console.log('Updated:', updated[0]);

  // DELETE
  console.log('\n[DELETE] Deleting the user...');
  const deleted = await db.delete(users).where(eq(users.id, created.id)).returning();
  console.log('Deleted:', deleted[0]);

  // VERIFY DELETION
  console.log('\n[VERIFY] Ensure user no longer exists...');
  const after = await db.select().from(users).where(eq(users.id, created.id)).limit(1);
  console.log('Exists after delete?', after.length > 0);

  console.log('\n--- Done ---');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
