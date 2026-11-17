// A clean test database for each test file. Runs only when TEST_DATABASE_URL
// is set, and refuses to touch the main database.
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../../src/lib/db/schema';
import type { Database } from '../../src/lib/db/types';

export const testDatabaseUrl = process.env.TEST_DATABASE_URL;

export async function freshTestDatabase(): Promise<{ db: Database; close: () => Promise<void> }> {
  if (!testDatabaseUrl) throw new Error('TEST_DATABASE_URL is not set');
  if ([process.env.DATABASE_URL, process.env.DATABASE_URL_DIRECT].includes(testDatabaseUrl)) {
    throw new Error('TEST_DATABASE_URL must be a separate test database (a Neon branch), never the main one');
  }
  const sql = postgres(testDatabaseUrl, { prepare: false, max: 1, onnotice: () => {} });
  // Wipe and rebuild from the committed migrations, exactly as production gets them.
  await sql.unsafe('drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;');
  const db = drizzle(sql, { schema });
  await migrate(db, { migrationsFolder: './drizzle' });
  return { db, close: () => sql.end() };
}
