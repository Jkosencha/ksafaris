// The single database client. All database access goes through here.
import { setDefaultAutoSelectFamilyAttemptTimeout } from 'node:net';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../../env';
import * as schema from './schema';

/** True once DATABASE_URL is set (in .env locally, or in the host's settings). */
export const isDatabaseConfigured = Boolean(env.DATABASE_URL);

// Node gives each of a host's addresses only 250 ms before trying the next.
// From Kenya to Neon (Europe) a connection takes longer, so every attempt was
// cut off. Allow 2.5 s per address.
setDefaultAutoSelectFamilyAttemptTimeout(2500);

type Db = ReturnType<typeof drizzle<typeof schema>>;
let instance: Db | undefined;

/**
 * The Drizzle client, created on first use. Uses Neon's pooled URL, which runs
 * PgBouncer in transaction mode, so prepared statements are turned off.
 */
export function db(): Db {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  if (!instance) {
    const sql = postgres(env.DATABASE_URL, { prepare: false, max: 5, idle_timeout: 20, connect_timeout: 15 });
    instance = drizzle(sql, { schema });
  }
  return instance;
}
