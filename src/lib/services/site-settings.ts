// Site settings: the agency's details used across the website, edited by the Owner.
import { z } from 'astro/zod';
import { eq } from 'drizzle-orm';
import type { Database } from '../db/types';
import { currency, siteSettings } from '../db/schema';

export interface SiteSettings {
  agencyName: string;
  tagline: string | null;
  logoUrl: string | null;
  email: string;
  phone: string;
  whatsappNumber: string;
  address: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  xUrl: string | null;
  tripadvisorUrl: string | null;
  safaribookingsUrl: string | null;
  defaultCurrency: (typeof currency.enumValues)[number];
  depositPercentage: number;
  bookingTerms: string | null;
  cancellationPolicy: string | null;
}

/** Used until the Owner first saves the settings (and when there is no database). */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  agencyName: 'KSafaris & African Expeditions',
  tagline: 'Say where, we’ll take you there',
  logoUrl: null,
  email: 'info@ksafaris-africanexpeditions.com',
  phone: '+254 736 112 673',
  whatsappNumber: '254736112673',
  address: 'Nairobi, Kenya',
  facebookUrl: 'https://www.facebook.com/KsafarisAfrica',
  instagramUrl: 'https://www.instagram.com/ksafarisafrica/',
  tiktokUrl: null,
  xUrl: 'https://x.com/KSafarisKE',
  tripadvisorUrl: 'https://www.tripadvisor.com/Attraction_Review-g294207-d25039887-Reviews-KSafaris_African_Expeditions-Nairobi.html',
  safaribookingsUrl: 'https://www.safaribookings.com/p3271',
  defaultCurrency: 'USD',
  depositPercentage: 30,
  bookingTerms: null,
  cancellationPolicy: null,
};

const optionalText = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => v || null)
  .pipe(z.url({ protocol: /^https$/, message: 'Links must start with https://' }).nullable());

export const siteSettingsInput = z.object({
  agencyName: z.string().trim().min(1, 'The agency needs a name').max(120),
  tagline: optionalText(160),
  email: z.string().trim().toLowerCase().max(200).pipe(z.email('Enter a valid email address')),
  phone: z.string().trim().min(6, 'Enter the phone number').max(40),
  whatsappNumber: z
    .string()
    .transform((v) => v.replace(/[^\d]/g, ''))
    .pipe(z.string().regex(/^\d{10,15}$/, 'Enter the WhatsApp number with country code, e.g. 254736112673')),
  address: optionalText(200),
  facebookUrl: optionalUrl,
  instagramUrl: optionalUrl,
  tiktokUrl: optionalUrl,
  xUrl: optionalUrl,
  tripadvisorUrl: optionalUrl,
  safaribookingsUrl: optionalUrl,
  defaultCurrency: z.enum(currency.enumValues),
  depositPercentage: z.coerce.number().int('Use a whole number').min(0, 'Between 0 and 100').max(100, 'Between 0 and 100'),
  bookingTerms: optionalText(10000),
  cancellationPolicy: optionalText(10000),
});
export type SiteSettingsInput = z.infer<typeof siteSettingsInput>;

export async function getSiteSettings(database: Database): Promise<SiteSettings> {
  const [row] = await database.select().from(siteSettings).where(eq(siteSettings.id, true)).limit(1);
  if (!row) return DEFAULT_SITE_SETTINGS;
  const { id: _id, updatedByUserId: _by, createdAt: _c, updatedAt: _u, ...settings } = row;
  return settings;
}

/** Creates the one settings row the first time, then updates it. */
export async function saveSiteSettings(database: Database, input: SiteSettingsInput, userId: string | null): Promise<void> {
  const values = { ...input, logoUrl: undefined, updatedByUserId: userId };
  await database
    .insert(siteSettings)
    .values({ id: true, ...values })
    .onConflictDoUpdate({ target: siteSettings.id, set: { ...values, updatedAt: new Date() } });
}

// Helpers for building links from the settings.

export function telHref(s: SiteSettings): string {
  return `tel:+${s.phone.replace(/[^\d]/g, '')}`;
}

export function whatsappHref(s: SiteSettings, message?: string): string {
  const base = `https://wa.me/${s.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** "@KSafarisKE" from the X link, for social sharing tags. */
export function xHandle(s: SiteSettings): string | null {
  const name = s.xUrl?.match(/(?:x|twitter)\.com\/([A-Za-z0-9_]+)/)?.[1];
  return name ? `@${name}` : null;
}

/** When the settings were last saved, or null if they never have been (defaults in use). */
export async function siteSettingsUpdatedAt(database: Database): Promise<Date | null> {
  const [row] = await database.select({ updatedAt: siteSettings.updatedAt }).from(siteSettings).where(eq(siteSettings.id, true)).limit(1);
  return row?.updatedAt ?? null;
}
