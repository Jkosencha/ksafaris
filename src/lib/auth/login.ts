// The sign-in process: rate limit, check the password, start a session.
import { eq, sql } from 'drizzle-orm';
import type { Database } from '../db/types';
import { users } from '../db/schema';
import { verifyDecoy, verifyPassword } from './password';
import { clearFailedLogins, loginIsLimited, recordFailedLogin } from './rate-limit';
import { createSession } from './session';

export type LoginResult =
  | { ok: true; token: string; expiresAt: Date }
  /** "invalid" covers wrong email, wrong password and deactivated accounts alike. */
  | { ok: false; reason: 'invalid' | 'limited' };

export async function attemptLogin(
  database: Database,
  input: { email: string; password: string; ipAddress: string; userAgent?: string },
): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();
  if (await loginIsLimited(database, email, input.ipAddress)) return { ok: false, reason: 'limited' };

  const [user] = await database
    .select({ id: users.id, passwordHash: users.passwordHash, isActive: users.isActive })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const passwordOk = user ? await verifyPassword(user.passwordHash, input.password) : await verifyDecoy(input.password);
  if (!user || !passwordOk || !user.isActive) {
    await recordFailedLogin(database, email, input.ipAddress);
    return { ok: false, reason: 'invalid' };
  }

  await clearFailedLogins(database, email, input.ipAddress);
  await database.update(users).set({ lastLoginAt: sql`now()` }).where(eq(users.id, user.id));
  const session = await createSession(database, user.id, { ipAddress: input.ipAddress, userAgent: input.userAgent });
  return { ok: true, ...session };
}
