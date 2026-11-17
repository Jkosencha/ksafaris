// Login rate limiting, stored in the database so it survives restarts and
// works the same on every server.
import { and, eq, gte, or, sql } from 'drizzle-orm';
import type { Database } from '../db/types';
import { loginAttempts } from '../db/schema';

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
/** Failed attempts allowed for one email from one address in the window. */
export const MAX_PER_EMAIL_AND_IP = 5;
/** Failed attempts allowed for one email from anywhere (IP addresses can be faked or rotated). */
export const MAX_PER_EMAIL = 10;
/** Failed attempts allowed from one address across all emails (stops guessing many accounts). */
export const MAX_PER_IP = 20;

export interface FailureCounts {
  forEmailAndIp: number;
  forEmail: number;
  forIp: number;
}

export function isLimited(c: FailureCounts): boolean {
  return c.forEmailAndIp >= MAX_PER_EMAIL_AND_IP || c.forEmail >= MAX_PER_EMAIL || c.forIp >= MAX_PER_IP;
}

export async function loginIsLimited(database: Database, email: string, ipAddress: string, now = new Date()): Promise<boolean> {
  const since = new Date(now.getTime() - LOGIN_WINDOW_MS);
  const isEmail = sql`${loginAttempts.email} = ${email}`;
  const isIp = sql`${loginAttempts.ipAddress} = ${ipAddress}`;
  const [row] = await database
    .select({
      forEmailAndIp: sql<number>`count(*) filter (where ${isEmail} and ${isIp})`.mapWith(Number),
      forEmail: sql<number>`count(*) filter (where ${isEmail})`.mapWith(Number),
      forIp: sql<number>`count(*) filter (where ${isIp})`.mapWith(Number),
    })
    .from(loginAttempts)
    .where(and(gte(loginAttempts.createdAt, since), or(eq(loginAttempts.email, email), eq(loginAttempts.ipAddress, ipAddress))));
  return isLimited({ forEmailAndIp: row?.forEmailAndIp ?? 0, forEmail: row?.forEmail ?? 0, forIp: row?.forIp ?? 0 });
}

export async function recordFailedLogin(database: Database, email: string, ipAddress: string): Promise<void> {
  await database.insert(loginAttempts).values({ email, ipAddress });
}

/** After a successful sign-in, that person's earlier failures from this address stop counting. */
export async function clearFailedLogins(database: Database, email: string, ipAddress: string): Promise<void> {
  await database.delete(loginAttempts).where(and(eq(loginAttempts.email, email), eq(loginAttempts.ipAddress, ipAddress)));
}
