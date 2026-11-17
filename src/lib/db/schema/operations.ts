// Guides, vehicles, trips and payments. Phase 5 reworks payments with
// methods, statuses and gateway transaction logs.
import { sql } from 'drizzle-orm';
import { boolean, check, date, index, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { currency, timestamps } from './common';
import { bookings } from './bookings';

export const guides = pgTable('guides', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  phone: text('phone'),
  /** For example "English, Swahili, German". */
  languages: text('languages'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
});

export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  /** Number plate, for example "KDA 123A". */
  registration: text('registration'),
  seats: integer('seats'),
  nextService: date('next_service'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
});

export const trips = pgTable(
  'trips',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bookingId: uuid('booking_id')
      .notNull()
      .unique()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    guideId: uuid('guide_id').references(() => guides.id, { onDelete: 'set null' }),
    vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
    notes: text('notes'),
    ...timestamps,
  },
  (t) => [
    index('trips_dates_idx').on(t.startDate, t.endDate),
    index('trips_guide_idx').on(t.guideId),
    index('trips_vehicle_idx').on(t.vehicleId),
    check('trips_dates_check', sql`${t.endDate} >= ${t.startDate}`),
  ],
);

export const paymentKind = pgEnum('payment_kind', ['deposit', 'balance', 'other']);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    kind: paymentKind('kind').notNull(),
    amountMinor: integer('amount_minor').notNull(),
    currency: currency('currency').notNull().default('USD'),
    dueDate: date('due_date'),
    receivedAt: timestamp('received_at', { withTimezone: true }),
    method: text('method'),
    reference: text('reference'),
    ...timestamps,
  },
  (t) => [
    index('payments_booking_idx').on(t.bookingId),
    index('payments_due_idx').on(t.dueDate).where(sql`${t.receivedAt} is null`),
    check('payments_amount_check', sql`${t.amountMinor} >= 0`),
  ],
);
