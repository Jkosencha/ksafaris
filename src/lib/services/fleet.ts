// Team & fleet: the guides and vehicles lists (project guide 9.1).
// Nothing is deleted; switching off keeps past trips correct.
// Assigning them to trips, availability and clash warnings come in Phase 4.
import { z } from 'astro/zod';
import { asc, desc, eq } from 'drizzle-orm';
import type { Database } from '../db/types';
import { guides, vehicles } from '../db/schema';

const optionalText = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);

export const guideInput = z.object({
  name: z.string().trim().min(1, 'Enter the guide’s name').max(120),
  phone: optionalText(60),
  languages: optionalText(200),
  notes: optionalText(1000),
});

export const vehicleInput = z.object({
  name: z.string().trim().min(1, 'Give the vehicle a name, for example Land Cruiser 1').max(120),
  registration: z.string().trim().toUpperCase().max(20).optional().transform((v) => v || null),
  seats: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .pipe(z.number().int('Seats must be a whole number').min(1, 'At least 1 seat').max(60, 'At most 60 seats').nullable()),
  nextService: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null)
    .pipe(z.iso.date('Use a date like 2026-12-15').nullable()),
  notes: optionalText(1000),
});

export const listGuides = (database: Database) => database.select().from(guides).orderBy(desc(guides.isActive), asc(guides.name));
export const listVehicles = (database: Database) => database.select().from(vehicles).orderBy(desc(vehicles.isActive), asc(vehicles.name));

export async function saveGuide(database: Database, input: z.infer<typeof guideInput>, id?: string): Promise<void> {
  if (id) await database.update(guides).set(input).where(eq(guides.id, id));
  else await database.insert(guides).values(input);
}

export async function saveVehicle(database: Database, input: z.infer<typeof vehicleInput>, id?: string): Promise<void> {
  if (id) await database.update(vehicles).set(input).where(eq(vehicles.id, id));
  else await database.insert(vehicles).values(input);
}

export async function setGuideActive(database: Database, id: string, isActive: boolean): Promise<void> {
  await database.update(guides).set({ isActive }).where(eq(guides.id, id));
}

export async function setVehicleActive(database: Database, id: string, isActive: boolean): Promise<void> {
  await database.update(vehicles).set({ isActive }).where(eq(vehicles.id, id));
}

/** "overdue", "soon" (within 30 days) or null, for the service-date reminder. */
export function serviceStatus(nextService: string | null, today = new Date()): 'overdue' | 'soon' | null {
  if (!nextService) return null;
  const days = (new Date(`${nextService}T00:00:00Z`).getTime() - Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) / 86_400_000;
  if (days < 0) return 'overdue';
  if (days <= 30) return 'soon';
  return null;
}
