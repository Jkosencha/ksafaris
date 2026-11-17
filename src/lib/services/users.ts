// Staff accounts: create, change role, switch off and on, reset and change passwords.
// The Owner runs these from Staff accounts; everyone can change their own password.
import { and, asc, count, desc, eq, ne } from 'drizzle-orm';
import { z } from 'astro/zod';
import type { Database } from '../db/types';
import { sessions, userRole, users, type Role } from '../db/schema';
import { MIN_PASSWORD_LENGTH, hashPassword, verifyPassword } from '../auth/password';
import { hashToken } from '../auth/tokens';

const password = z.string().min(MIN_PASSWORD_LENGTH, `Passwords need at least ${MIN_PASSWORD_LENGTH} characters`).max(200);

export const newStaffInput = z.object({
  name: z.string().trim().min(1, 'Enter their name').max(120),
  email: z.string().trim().toLowerCase().max(200).pipe(z.email('Enter a valid email address')),
  phone: z.string().trim().max(60).optional().transform((v) => v || null),
  role: z.enum(userRole.enumValues),
  password,
});

export type UserError = 'email-taken' | 'not-found' | 'last-owner' | 'self' | 'wrong-password';
type Result = { ok: true } | { ok: false; error: UserError };
const fail = (error: UserError): Result => ({ ok: false, error });

export function listUsers(database: Database) {
  return database
    .select({ id: users.id, name: users.name, email: users.email, phone: users.phone, role: users.role, isActive: users.isActive, lastLoginAt: users.lastLoginAt, createdAt: users.createdAt })
    .from(users)
    .orderBy(desc(users.isActive), asc(users.name)); // active staff first, then by name
}

export async function createStaffUser(database: Database, input: z.infer<typeof newStaffInput>): Promise<Result> {
  const [existing] = await database.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
  if (existing) return fail('email-taken');
  await database.insert(users).values({ name: input.name, email: input.email, phone: input.phone, role: input.role, passwordHash: await hashPassword(input.password) });
  return { ok: true };
}

/** Other active owners besides this user (there must always be one left). */
async function otherActiveOwners(database: Database, userId: string): Promise<number> {
  const [row] = await database.select({ n: count() }).from(users).where(and(eq(users.role, 'owner'), eq(users.isActive, true), ne(users.id, userId)));
  return row?.n ?? 0;
}

async function find(database: Database, userId: string) {
  const [u] = await database.select({ id: users.id, role: users.role, isActive: users.isActive }).from(users).where(eq(users.id, userId)).limit(1);
  return u;
}

export async function changeRole(database: Database, actorId: string, userId: string, role: Role): Promise<Result> {
  if (actorId === userId) return fail('self');
  const target = await find(database, userId);
  if (!target) return fail('not-found');
  if (target.role === 'owner' && role !== 'owner' && target.isActive && (await otherActiveOwners(database, userId)) === 0) return fail('last-owner');
  await database.update(users).set({ role }).where(eq(users.id, userId));
  return { ok: true };
}

/** Switching someone off also signs them out everywhere at once. */
export async function setActive(database: Database, actorId: string, userId: string, active: boolean): Promise<Result> {
  if (actorId === userId) return fail('self');
  const target = await find(database, userId);
  if (!target) return fail('not-found');
  if (!active && target.role === 'owner' && (await otherActiveOwners(database, userId)) === 0) return fail('last-owner');
  await database.transaction(async (tx) => {
    await tx.update(users).set({ isActive: active }).where(eq(users.id, userId));
    if (!active) await tx.delete(sessions).where(eq(sessions.userId, userId));
  });
  return { ok: true };
}

/** The Owner sets a new temporary password for someone; they are signed out everywhere. */
export async function resetPassword(database: Database, actorId: string, userId: string, newPassword: string): Promise<Result> {
  if (actorId === userId) return fail('self'); // use My account instead
  if (!(await find(database, userId))) return fail('not-found');
  password.parse(newPassword);
  const passwordHash = await hashPassword(newPassword);
  await database.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash }).where(eq(users.id, userId));
    await tx.delete(sessions).where(eq(sessions.userId, userId));
  });
  return { ok: true };
}

export const changePasswordInput = z
  .object({ current: z.string().min(1, 'Enter your current password').max(200), next: password, confirm: z.string() })
  .refine((v) => v.next === v.confirm, { message: 'The new passwords do not match', path: ['confirm'] });

/**
 * Changes your own password after checking the current one. Signs out your
 * other devices but keeps this one signed in.
 */
export async function changeOwnPassword(database: Database, userId: string, currentToken: string, input: z.infer<typeof changePasswordInput>): Promise<Result> {
  const [u] = await database.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return fail('not-found');
  if (!(await verifyPassword(u.passwordHash, input.current))) return fail('wrong-password');
  const passwordHash = await hashPassword(input.next);
  await database.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash }).where(eq(users.id, userId));
    await tx.delete(sessions).where(and(eq(sessions.userId, userId), ne(sessions.tokenHash, hashToken(currentToken))));
  });
  return { ok: true };
}

export const USER_ERRORS: Record<UserError, string> = {
  'email-taken': 'There is already an account with that email.',
  'not-found': 'That account no longer exists.',
  'last-owner': 'There must always be at least one active Owner. Make someone else an Owner first.',
  self: 'You can’t do that to your own account here. Use My account for your own password.',
  'wrong-password': 'Your current password is not right.',
};
