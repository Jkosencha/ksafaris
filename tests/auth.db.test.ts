// Real sign-in against a test database (skipped until TEST_DATABASE_URL is set).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { freshTestDatabase, testDatabaseUrl } from './helpers/test-db';
import type { Database } from '../src/lib/db/types';
import { bookings, guests, loginAttempts, sessions, users } from '../src/lib/db/schema';
import { hashPassword } from '../src/lib/auth/password';
import { attemptLogin } from '../src/lib/auth/login';
import { deleteSession, validateSession } from '../src/lib/auth/session';
import { hashToken } from '../src/lib/auth/tokens';

describe.skipIf(!testDatabaseUrl)('sign-in with a real database', () => {
  let db: Database;
  let close: () => Promise<void>;
  const ip = '203.0.113.7';
  const password = 'a-long-test-password';

  beforeAll(async () => {
    ({ db, close } = await freshTestDatabase());
    await db.insert(users).values([
      { email: 'owner@example.com', name: 'Owner', passwordHash: await hashPassword(password), role: 'owner' },
      { email: 'gone@example.com', name: 'Former staff', passwordHash: await hashPassword(password), role: 'manager', isActive: false },
    ]);
  });
  afterAll(async () => close?.());
  beforeEach(async () => {
    await db.delete(loginAttempts);
    await db.delete(sessions);
  });

  it('signs in with the right password and stores only a hash of the token', async () => {
    const result = await attemptLogin(db, { email: ' Owner@Example.com ', password, ipAddress: ip });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [row] = await db.select().from(sessions);
    expect(row.tokenHash).toBe(hashToken(result.token));
    expect(row.tokenHash).not.toBe(result.token);
    expect((await validateSession(db, result.token))?.user.email).toBe('owner@example.com');
  });

  it('gives the same answer for a wrong password and an unknown email', async () => {
    expect(await attemptLogin(db, { email: 'owner@example.com', password: 'wrong-password!', ipAddress: ip })).toEqual({ ok: false, reason: 'invalid' });
    expect(await attemptLogin(db, { email: 'nobody@example.com', password, ipAddress: ip })).toEqual({ ok: false, reason: 'invalid' });
  });

  it('refuses a switched-off account even with the right password', async () => {
    expect(await attemptLogin(db, { email: 'gone@example.com', password, ipAddress: ip })).toEqual({ ok: false, reason: 'invalid' });
  });

  it('blocks after 5 failures, even for the right password, then counts from zero after a success elsewhere', async () => {
    for (let i = 0; i < 5; i++) await attemptLogin(db, { email: 'owner@example.com', password: 'wrong-password!', ipAddress: ip });
    expect(await attemptLogin(db, { email: 'owner@example.com', password, ipAddress: ip })).toEqual({ ok: false, reason: 'limited' });
    // A different address is not blocked by those 5 (the per-email cap is 10).
    expect((await attemptLogin(db, { email: 'owner@example.com', password, ipAddress: '198.51.100.1' })).ok).toBe(true);
  });

  it('rejects expired sessions and sessions of switched-off users', async () => {
    const result = await attemptLogin(db, { email: 'owner@example.com', password, ipAddress: ip });
    if (!result.ok) throw new Error('login failed');
    const later = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
    expect(await validateSession(db, result.token, later)).toBeNull();

    await db.update(users).set({ isActive: false }).where(eq(users.email, 'owner@example.com'));
    expect(await validateSession(db, result.token)).toBeNull();
    await db.update(users).set({ isActive: true }).where(eq(users.email, 'owner@example.com'));
  });

  it('renews a session that is more than a day old', async () => {
    const result = await attemptLogin(db, { email: 'owner@example.com', password, ipAddress: ip });
    if (!result.ok) throw new Error('login failed');
    const twoDaysLater = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const checked = await validateSession(db, result.token, twoDaysLater);
    expect(checked?.renewedUntil?.getTime()).toBeGreaterThan(result.expiresAt.getTime());
  });

  it('signs out by deleting the session', async () => {
    const result = await attemptLogin(db, { email: 'owner@example.com', password, ipAddress: ip });
    if (!result.ok) throw new Error('login failed');
    await deleteSession(db, result.token);
    expect(await validateSession(db, result.token)).toBeNull();
  });

  it('numbers bookings KS-<year>-00001, KS-<year>-00002 in order', async () => {
    const [guest] = await db.insert(guests).values({ name: 'Test Guest' }).returning();
    const made = await db
      .insert(bookings)
      .values([
        { guestId: guest.id, kind: 'booking', tourTitle: 'A' },
        { guestId: guest.id, kind: 'enquiry', tourTitle: 'B' },
      ])
      .returning({ reference: bookings.reference });
    const year = new Intl.DateTimeFormat('en', { timeZone: 'Africa/Nairobi', year: 'numeric' }).format(new Date());
    expect(made.map((b) => b.reference)).toEqual([`KS-${year}-00001`, `KS-${year}-00002`]);
  });
});
