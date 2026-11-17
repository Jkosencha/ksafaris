// Website enquiries and booking requests: check the input, then save it.
import { z } from 'astro/zod';
import type { Database } from '../db/types';
import { bookingMessages, bookings, guests } from '../db/schema';

/** Text that is trimmed, length-capped, and null when empty. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);
const people = (fallback: number) => z.coerce.number().int().min(0).max(50).catch(fallback);

export const enquiryInput = z.object({
  name: z.string().trim().min(1, 'Your name is needed').max(120),
  // Trim and lowercase first, then check, so a stray space from a phone keyboard is fine.
  email: z.string().trim().toLowerCase().max(200).pipe(z.email('Enter a valid email address')),
  phone: optionalText(60),
  country: optionalText(80),
  nationality: optionalText(80),
  stage: z.string().optional(),
  tour: optionalText(200),
  start_date: z.iso.date().optional().or(z.literal('').transform(() => undefined)).catch(undefined),
  travel_month: optionalText(20),
  date_flexibility: optionalText(80),
  adults: people(2),
  children: people(0),
  children_ages: optionalText(80),
  rooms: optionalText(120),
  accommodation: optionalText(80),
  flights: optionalText(300),
  travel_type: optionalText(80),
  heard_from: optionalText(80),
  message: optionalText(4000),
});
export type EnquiryInput = z.infer<typeof enquiryInput>;

/**
 * Saves a website enquiry or booking request: a new guest (never merged with
 * an existing one by email; staff merge by hand), the booking, and the
 * guest's own words as the first message. All in one transaction.
 */
export async function saveWebsiteEnquiry(
  database: Database,
  input: EnquiryInput,
  tourSlugFor: (title: string) => string | null,
): Promise<{ reference: string }> {
  const kind = input.stage === 'Ready to book' ? 'booking' : 'enquiry';
  const tourTitle = input.tour ?? 'Not decided yet';

  return database.transaction(async (tx) => {
    const [guest] = await tx
      .insert(guests)
      .values({ name: input.name, email: input.email, phone: input.phone, country: input.country, nationality: input.nationality })
      .returning({ id: guests.id });

    const [booking] = await tx
      .insert(bookings)
      .values({
        guestId: guest.id,
        kind,
        tourSlug: tourSlugFor(tourTitle),
        tourTitle,
        startDate: input.start_date ?? null,
        travelMonth: input.travel_month,
        dateFlexibility: input.date_flexibility,
        adults: input.adults,
        children: input.children,
        childrenAges: input.children_ages,
        rooms: input.rooms,
        accommodation: input.accommodation,
        flights: input.flights,
        travelType: input.travel_type,
        specialRequests: kind === 'booking' ? input.message : null,
        heardFrom: input.heard_from,
        source: 'website',
      })
      .returning({ id: bookings.id, reference: bookings.reference });

    if (input.message) {
      await tx.insert(bookingMessages).values({ bookingId: booking.id, kind: 'guest', body: input.message });
    }
    return { reference: booking.reference };
  });
}
