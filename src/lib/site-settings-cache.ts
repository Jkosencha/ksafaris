// Site settings for page rendering, kept in memory for a minute so the website
// doesn't ask the database on every page view. Saving clears it at once.
import { db, isDatabaseConfigured } from './db/client';
import { DEFAULT_SITE_SETTINGS, getSiteSettings, type SiteSettings } from './services/site-settings';

const TTL_MS = 60_000;
let cached: { value: SiteSettings; at: number } | undefined;
let pending: Promise<SiteSettings> | undefined;

export async function loadSiteSettings(): Promise<SiteSettings> {
  if (!isDatabaseConfigured) return DEFAULT_SITE_SETTINGS;
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  pending ??= getSiteSettings(db())
    .then((value) => {
      cached = { value, at: Date.now() };
      return value;
    })
    .catch((error) => {
      // If the database is briefly unreachable, keep the site up with the last known details.
      console.error('[site settings] could not load, using last known', error);
      return cached?.value ?? DEFAULT_SITE_SETTINGS;
    })
    .finally(() => {
      pending = undefined;
    });
  return pending;
}

export function forgetSiteSettings(): void {
  cached = undefined;
}
