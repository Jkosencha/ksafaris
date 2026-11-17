// Team & fleet: input rules and service reminders (no database), saving (test database only).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { freshTestDatabase, testDatabaseUrl } from './helpers/test-db';
import type { Database } from '../src/lib/db/types';
import { guideInput, listGuides, listVehicles, saveGuide, saveVehicle, serviceStatus, setGuideActive, vehicleInput } from '../src/lib/services/fleet';

describe('team & fleet input', () => {
  it('needs a name, tidies the number plate, and keeps seats sensible', () => {
    expect(guideInput.safeParse({ name: ' ' }).success).toBe(false);
    const v = vehicleInput.parse({ name: 'Land Cruiser 1', registration: ' kda 123a ', seats: '7', nextService: '2026-12-15' });
    expect(v).toMatchObject({ registration: 'KDA 123A', seats: 7, nextService: '2026-12-15' });
    expect(vehicleInput.parse({ name: 'LC', seats: '', nextService: '' })).toMatchObject({ seats: null, nextService: null });
    expect(vehicleInput.safeParse({ name: 'LC', seats: '0' }).success).toBe(false);
    expect(vehicleInput.safeParse({ name: 'LC', seats: '6.5' }).success).toBe(false);
    expect(vehicleInput.safeParse({ name: 'LC', nextService: '15/12/2026' }).success).toBe(false);
  });

  it('flags a service that is overdue or due within 30 days', () => {
    const today = new Date('2026-11-17T09:00:00Z');
    expect(serviceStatus('2026-11-10', today)).toBe('overdue');
    expect(serviceStatus('2026-11-17', today)).toBe('soon');
    expect(serviceStatus('2026-12-17', today)).toBe('soon');
    expect(serviceStatus('2026-12-18', today)).toBeNull();
    expect(serviceStatus(null, today)).toBeNull();
  });
});

describe.skipIf(!testDatabaseUrl)('saving team & fleet', () => {
  let db: Database;
  let close: () => Promise<void>;
  beforeAll(async () => ({ db, close } = await freshTestDatabase()));
  afterAll(async () => close?.());

  it('adds, edits and switches off a guide without deleting them, active first', async () => {
    await saveGuide(db, guideInput.parse({ name: 'Joseph', languages: 'English, Swahili' }));
    await saveGuide(db, guideInput.parse({ name: 'Amani' }));
    const [joseph] = (await listGuides(db)).filter((g) => g.name === 'Joseph');
    await saveGuide(db, guideInput.parse({ name: 'Joseph K.', languages: 'English, Swahili, German' }), joseph.id);
    await setGuideActive(db, joseph.id, false);
    const list = await listGuides(db);
    expect(list.map((g) => [g.name, g.isActive])).toEqual([['Amani', true], ['Joseph K.', false]]);
    expect(list[1].languages).toBe('English, Swahili, German');
  });

  it('adds a vehicle with its plate, seats and service date', async () => {
    await saveVehicle(db, vehicleInput.parse({ name: 'Land Cruiser 1', registration: 'kda 123a', seats: '7', nextService: '2026-12-15' }));
    const [v] = await listVehicles(db);
    expect(v).toMatchObject({ name: 'Land Cruiser 1', registration: 'KDA 123A', seats: 7, nextService: '2026-12-15', isActive: true });
  });
});
