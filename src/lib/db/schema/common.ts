// Shared column helpers and enums used across the schema.
import { pgEnum, timestamp } from 'drizzle-orm/pg-core';

/** createdAt / updatedAt on every table (UTC, shown in Nairobi time). */
export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** Every money amount carries its currency. Amounts are integers in minor units (cents). */
export const currency = pgEnum('currency', ['USD', 'KES']);
