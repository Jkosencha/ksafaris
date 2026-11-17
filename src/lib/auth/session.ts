// Sign-in sessions: create, look up (with sliding renewal) and end.
import { and, eq, gt, lt } from 'drizzle-orm';
import type { AstroCookies } from 'astro';
import type { Database } from '../db/types';
import { sessions, users, type Role } from '../db/schema';
import { generateToken, hashToken } from './tokens';

export const SESSION_COOKIE = 'ks_session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Renew when less than this is left, so active staff stay signed in. */
const RENEW_WHEN_LEFT_MS = 6 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export async function createSession(
  database: Database,
  userId: string,
  meta: { ipAddress?: string; userAgent?: string },
  now = new Date(),
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await database.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
    ipAddress: meta.ipAddress ?? null,
    userAgent: meta.userAgent?.slice(0, 300) ?? null,
  });
  // Tidy this person's expired sessions while we're here.
  await database.delete(sessions).where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, now)));
  return { token, expiresAt };
}

/**
 * The signed-in user for a cookie token, or null. Expired sessions and
 * deactivated users never count. Returns a new expiry when the session was renewed.
 */
export async function validateSession(
  database: Database,
  token: string,
  now = new Date(),
): Promise<{ user: SessionUser; renewedUntil?: Date } | null> {
  const tokenHash = hashToken(token);
  const [row] = await database
    .select({ sessionId: sessions.id, expiresAt: sessions.expiresAt, id: users.id, email: users.email, name: users.name, role: users.role, isActive: users.isActive })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)))
    .limit(1);
  if (!row || !row.isActive) return null;

  const user: SessionUser = { id: row.id, email: row.email, name: row.name, role: row.role };
  if (row.expiresAt.getTime() - now.getTime() < RENEW_WHEN_LEFT_MS) {
    const renewedUntil = new Date(now.getTime() + SESSION_TTL_MS);
    await database.update(sessions).set({ expiresAt: renewedUntil }).where(eq(sessions.id, row.sessionId));
    return { user, renewedUntil };
  }
  return { user };
}

export async function deleteSession(database: Database, token: string): Promise<void> {
  await database.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}

/** httpOnly, sameSite=lax, path /, and secure outside local development. */
export function sessionCookieOptions(expires: Date, secure: boolean) {
  return { httpOnly: true, secure, sameSite: 'lax' as const, path: '/', expires };
}

export function setSessionCookie(cookies: AstroCookies, token: string, expires: Date, secure: boolean) {
  cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expires, secure));
}

export function clearSessionCookie(cookies: AstroCookies, secure: boolean) {
  cookies.delete(SESSION_COOKIE, { path: '/', httpOnly: true, secure, sameSite: 'lax' });
}
