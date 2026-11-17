// Staff accounts, sign-in sessions and login rate limiting.
import { boolean, index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './common';

/** The four roles from the project guide (permission map arrives in Phase 2). */
export const userRole = pgEnum('user_role', ['owner', 'manager', 'booking_agent', 'content_editor']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Always stored lowercase. */
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  /** argon2id hash. The plain password is never stored or logged. */
  passwordHash: text('password_hash').notNull(),
  role: userRole('role').notNull().default('manager'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  ...timestamps,
});

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** SHA-256 of the random cookie token. The token itself is never stored. */
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    ...timestamps,
  },
  (t) => [index('sessions_user_idx').on(t.userId), index('sessions_expires_idx').on(t.expiresAt)],
);

/** One row per failed sign-in, used to slow down password guessing. */
export const loginAttempts = pgTable(
  'login_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    ipAddress: text('ip_address').notNull(),
    ...timestamps,
  },
  (t) => [index('login_attempts_email_idx').on(t.email, t.createdAt), index('login_attempts_ip_idx').on(t.ipAddress, t.createdAt)],
);

export type User = typeof users.$inferSelect;
export type Role = (typeof userRole.enumValues)[number];
