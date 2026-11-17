// Staff account rules against the test database (skipped until TEST_DATABASE_URL is set).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { freshTestDatabase, testDatabaseUrl } from './helpers/test-db';
import type { Database } from '../src/lib/db/types';
import { sessions, users } from '../src/lib/db/schema';
import { attemptLogin } from '../src/lib/auth/login';
import { validateSession } from '../src/lib/auth/session';
import { changeOwnPassword, changeRole, createStaffUser, newStaffInput, resetPassword, setActive } from '../src/lib/services/users';

describe.skipIf(!testDatabaseUrl)('staff accounts', () => {
  let db: Database;
  let close: () => Promise<void>;
  const pw = 'owner-password-123';
  let ownerId: string;
  const idOf = async (email: string) => (await db.select({ id: users.id }).from(users).where(eq(users.email, email)))[0].id;
  const login = (email: string, password: string, ip = '203.0.113.9') => attemptLogin(db, { email, password, ipAddress: ip });

  beforeAll(async () => {
    ({ db, close } = await freshTestDatabase());
    await createStaffUser(db, newStaffInput.parse({ name: 'Owner', email: 'owner@example.com', role: 'owner', password: pw }));
    ownerId = await idOf('owner@example.com');
  });
  afterAll(async () => close?.());

  it('creates staff with a hashed password and refuses a second account with the same email', async () => {
    const input = newStaffInput.parse({ name: 'Amina', email: ' Amina@Example.com ', role: 'booking_agent', password: 'agent-password-123' });
    expect(await createStaffUser(db, input)).toEqual({ ok: true });
    expect(await createStaffUser(db, input)).toEqual({ ok: false, error: 'email-taken' });
    expect((await login('amina@example.com', 'agent-password-123')).ok).toBe(true);
  });

  it('rejects short passwords and bad emails before saving', () => {
    expect(newStaffInput.safeParse({ name: 'X', email: 'x@y.co', role: 'manager', password: 'short' }).success).toBe(false);
    expect(newStaffInput.safeParse({ name: 'X', email: 'nope', role: 'manager', password: 'long-enough-pass' }).success).toBe(false);
  });

  it('never leaves the business without an active Owner, and nobody can demote or switch off themselves', async () => {
    expect(await changeRole(db, ownerId, ownerId, 'manager')).toEqual({ ok: false, error: 'self' });
    expect(await setActive(db, ownerId, ownerId, false)).toEqual({ ok: false, error: 'self' });
    const amina = await idOf('amina@example.com');
    // Amina (if she were Owner) could not remove the only other Owner either.
    expect(await changeRole(db, amina, ownerId, 'manager')).toEqual({ ok: false, error: 'last-owner' });
    expect(await setActive(db, amina, ownerId, false)).toEqual({ ok: false, error: 'last-owner' });
    // With a second Owner, the first can be changed.
    expect(await changeRole(db, ownerId, amina, 'owner')).toEqual({ ok: true });
    expect(await changeRole(db, amina, ownerId, 'manager')).toEqual({ ok: true });
    expect(await changeRole(db, amina, ownerId, 'owner')).toEqual({ ok: true });
    expect(await changeRole(db, ownerId, amina, 'booking_agent')).toEqual({ ok: true });
  });

  it('signs a switched-off person out everywhere and refuses their sign-in', async () => {
    const amina = await idOf('amina@example.com');
    const s = await login('amina@example.com', 'agent-password-123');
    if (!s.ok) throw new Error('login failed');
    expect(await setActive(db, ownerId, amina, false)).toEqual({ ok: true });
    expect(await validateSession(db, s.token)).toBeNull();
    expect((await db.select().from(sessions).where(eq(sessions.userId, amina))).length).toBe(0);
    expect((await login('amina@example.com', 'agent-password-123', '198.51.100.20')).ok).toBe(false);
    expect(await setActive(db, ownerId, amina, true)).toEqual({ ok: true });
  });

  it('resets a password: the old one stops working and they are signed out', async () => {
    const amina = await idOf('amina@example.com');
    const s = await login('amina@example.com', 'agent-password-123', '198.51.100.30');
    if (!s.ok) throw new Error('login failed');
    expect(await resetPassword(db, ownerId, amina, 'brand-new-temp-pass')).toEqual({ ok: true });
    expect(await validateSession(db, s.token)).toBeNull();
    expect((await login('amina@example.com', 'agent-password-123', '198.51.100.31')).ok).toBe(false);
    expect((await login('amina@example.com', 'brand-new-temp-pass', '198.51.100.32')).ok).toBe(true);
  });

  it('changes your own password only with the current one, keeping this device signed in', async () => {
    const here = await login('owner@example.com', pw, '198.51.100.40');
    const other = await login('owner@example.com', pw, '198.51.100.41');
    if (!here.ok || !other.ok) throw new Error('login failed');
    const wrong = await changeOwnPassword(db, ownerId, here.token, { current: 'not-it', next: 'another-long-pass', confirm: 'another-long-pass' });
    expect(wrong).toEqual({ ok: false, error: 'wrong-password' });
    const ok = await changeOwnPassword(db, ownerId, here.token, { current: pw, next: 'another-long-pass', confirm: 'another-long-pass' });
    expect(ok).toEqual({ ok: true });
    expect(await validateSession(db, here.token)).not.toBeNull();
    expect(await validateSession(db, other.token)).toBeNull();
  });
});
