// Site settings: input rules (no database) and saving (test database only).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { freshTestDatabase, testDatabaseUrl } from './helpers/test-db';
import type { Database } from '../src/lib/db/types';
import { siteSettings } from '../src/lib/db/schema';
import { DEFAULT_SITE_SETTINGS, getSiteSettings, saveSiteSettings, siteSettingsInput, telHref, whatsappHref, xHandle } from '../src/lib/services/site-settings';

const valid = {
  agencyName: 'KSafaris & African Expeditions',
  email: ' Info@KSafaris.com ',
  phone: '+254 736 112 673',
  whatsappNumber: '+254 736-112-673',
  facebookUrl: 'https://facebook.com/KsafarisAfrica',
  tiktokUrl: '',
  defaultCurrency: 'USD',
  depositPercentage: '30',
};

describe('site settings input', () => {
  it('tidies values: lowercase email, digits-only WhatsApp, empty links become nothing', () => {
    const v = siteSettingsInput.parse(valid);
    expect(v.email).toBe('info@ksafaris.com');
    expect(v.whatsappNumber).toBe('254736112673');
    expect(v.tiktokUrl).toBeNull();
    expect(v.depositPercentage).toBe(30);
  });

  it('refuses links that are not https, deposits outside 0 to 100, and short WhatsApp numbers', () => {
    expect(siteSettingsInput.safeParse({ ...valid, facebookUrl: 'http://facebook.com/x' }).success).toBe(false);
    expect(siteSettingsInput.safeParse({ ...valid, facebookUrl: 'javascript:alert(1)' }).success).toBe(false);
    expect(siteSettingsInput.safeParse({ ...valid, depositPercentage: '120' }).success).toBe(false);
    expect(siteSettingsInput.safeParse({ ...valid, depositPercentage: '12.5' }).success).toBe(false);
    expect(siteSettingsInput.safeParse({ ...valid, whatsappNumber: '0736' }).success).toBe(false);
  });

  it('builds phone, WhatsApp and X links from the settings', () => {
    expect(telHref(DEFAULT_SITE_SETTINGS)).toBe('tel:+254736112673');
    expect(whatsappHref(DEFAULT_SITE_SETTINGS, 'Hi there')).toBe('https://wa.me/254736112673?text=Hi%20there');
    expect(xHandle(DEFAULT_SITE_SETTINGS)).toBe('@KSafarisKE');
    expect(xHandle({ ...DEFAULT_SITE_SETTINGS, xUrl: null })).toBeNull();
  });
});

describe.skipIf(!testDatabaseUrl)('saving site settings', () => {
  let db: Database;
  let close: () => Promise<void>;
  beforeAll(async () => ({ db, close } = await freshTestDatabase()));
  afterAll(async () => close?.());

  it('uses the defaults until the first save', async () => {
    expect(await getSiteSettings(db)).toEqual(DEFAULT_SITE_SETTINGS);
  });

  it('keeps exactly one row: saving twice updates it', async () => {
    await saveSiteSettings(db, siteSettingsInput.parse(valid), null);
    await saveSiteSettings(db, siteSettingsInput.parse({ ...valid, agencyName: 'KSafaris', depositPercentage: '40' }), null);
    expect(await db.select().from(siteSettings)).toHaveLength(1);
    const s = await getSiteSettings(db);
    expect(s.agencyName).toBe('KSafaris');
    expect(s.depositPercentage).toBe(40);
    expect(s.email).toBe('info@ksafaris.com');
  });

  it('cannot be given a second row even by hand', async () => {
    await expect(db.insert(siteSettings).values({ id: false, agencyName: 'X', email: 'x@y.co', phone: '123456', whatsappNumber: '254700000000' })).rejects.toThrow();
  });
});
