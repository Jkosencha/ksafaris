// Website content managed from the dashboard. Phase 2: site settings.
// Phase 3 adds pages, FAQs, testimonials, destinations and tours here.
import { sql } from 'drizzle-orm';
import { boolean, check, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { currency, timestamps } from './common';
import { users } from './auth';

/** The agency's details, used across the website. Exactly one row (id is always true). */
export const siteSettings = pgTable(
  'site_settings',
  {
    id: boolean('id').primaryKey().default(true),
    agencyName: text('agency_name').notNull(),
    tagline: text('tagline'),
    logoUrl: text('logo_url'),
    email: text('email').notNull(),
    /** As shown to people, e.g. "+254 736 112 673". */
    phone: text('phone').notNull(),
    /** Digits only with country code, e.g. "254736112673". */
    whatsappNumber: text('whatsapp_number').notNull(),
    address: text('address'),
    facebookUrl: text('facebook_url'),
    instagramUrl: text('instagram_url'),
    tiktokUrl: text('tiktok_url'),
    xUrl: text('x_url'),
    tripadvisorUrl: text('tripadvisor_url'),
    safaribookingsUrl: text('safaribookings_url'),
    defaultCurrency: currency('default_currency').notNull().default('USD'),
    depositPercentage: integer('deposit_percentage').notNull().default(30),
    bookingTerms: text('booking_terms'),
    cancellationPolicy: text('cancellation_policy'),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [
    check('site_settings_single_row', sql`${t.id}`),
    check('site_settings_deposit_range', sql`${t.depositPercentage} between 0 and 100`),
  ],
);

export type SiteSettingsRow = typeof siteSettings.$inferSelect;
