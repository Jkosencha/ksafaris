// Guests, bookings and enquiries, their messages and quote lines.
// Recreates the existing dashboard design; Phase 4 reshapes it into
// customers, bookings with status history, and a separate Inbox.
import { sql } from 'drizzle-orm';
import { check, date, index, integer, jsonb, pgEnum, pgSequence, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { currency, timestamps } from './common';
import { users } from './auth';

export const bookingStage = pgEnum('booking_stage', ['new', 'quoted', 'awaiting', 'confirmed', 'paid', 'completed', 'cancelled']);
export const bookingKind = pgEnum('booking_kind', ['booking', 'enquiry']);
export const messageKind = pgEnum('message_kind', ['guest', 'email', 'note']);

export const guests = pgTable(
  'guests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    country: text('country'),
    nationality: text('nationality'),
    /** "Good to know": food, rooms, loves, favourite guide, special dates. */
    preferences: jsonb('preferences').notNull().default({}),
    notes: text('notes'),
    ...timestamps,
  },
  (t) => [index('guests_email_idx').on(sql`lower(${t.email})`)],
);

/** Numbers booking references in order: KS-2026-00001, KS-2026-00002, ... */
export const bookingRefSeq = pgSequence('booking_ref_seq');

export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reference: text('reference')
      .notNull()
      .unique()
      .default(sql`'KS-' || to_char(now() at time zone 'Africa/Nairobi', 'YYYY') || '-' || lpad(nextval('booking_ref_seq')::text, 5, '0')`),
    guestId: uuid('guest_id')
      .notNull()
      .references(() => guests.id, { onDelete: 'restrict' }),
    kind: bookingKind('kind').notNull(),
    stage: bookingStage('stage').notNull().default('new'),
    tourSlug: text('tour_slug'),
    tourTitle: text('tour_title').notNull(),
    startDate: date('start_date'),
    travelMonth: text('travel_month'),
    dateFlexibility: text('date_flexibility'),
    adults: integer('adults').notNull().default(2),
    children: integer('children').notNull().default(0),
    childrenAges: text('children_ages'),
    rooms: text('rooms'),
    accommodation: text('accommodation'),
    flights: text('flights'),
    travelType: text('travel_type'),
    specialRequests: text('special_requests'),
    source: text('source').notNull().default('website'),
    heardFrom: text('heard_from'),
    assignedToUserId: uuid('assigned_to_user_id').references(() => users.id, { onDelete: 'set null' }),
    quoteTotalMinor: integer('quote_total_minor'),
    currency: currency('currency').notNull().default('USD'),
    ...timestamps,
  },
  (t) => [
    index('bookings_stage_idx').on(t.stage),
    index('bookings_guest_idx').on(t.guestId),
    index('bookings_assigned_idx').on(t.assignedToUserId),
    index('bookings_start_idx').on(t.startDate),
    check('bookings_people_check', sql`${t.adults} >= 0 and ${t.children} >= 0`),
  ],
);

/** Messages to and from the guest, and notes for the team. */
export const bookingMessages = pgTable(
  'booking_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    /** Null when the message came from the guest. */
    authorUserId: uuid('author_user_id').references(() => users.id, { onDelete: 'set null' }),
    kind: messageKind('kind').notNull(),
    body: text('body').notNull(),
    ...timestamps,
  },
  (t) => [index('booking_messages_booking_idx').on(t.bookingId, t.createdAt)],
);

export const quoteItems = pgTable(
  'quote_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
    item: text('item').notNull(),
    note: text('note'),
    qty: integer('qty').notNull().default(1),
    unitPriceMinor: integer('unit_price_minor').notNull().default(0),
    currency: currency('currency').notNull().default('USD'),
    ...timestamps,
  },
  (t) => [index('quote_items_booking_idx').on(t.bookingId), check('quote_items_qty_check', sql`${t.qty} > 0`)],
);
