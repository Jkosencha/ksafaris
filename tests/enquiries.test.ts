// Website form input checks (no database) and saving (test database only).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { enquiryInput, saveWebsiteEnquiry } from '../src/lib/services/enquiries';
import { freshTestDatabase, testDatabaseUrl } from './helpers/test-db';
import type { Database } from '../src/lib/db/types';
import { bookingMessages, bookings, guests } from '../src/lib/db/schema';

describe('enquiry form input', () => {
  it('needs a name and a valid email, and tidies the email', () => {
    expect(enquiryInput.safeParse({ name: '', email: 'a@b.co' }).success).toBe(false);
    expect(enquiryInput.safeParse({ name: 'A', email: 'not-an-email' }).success).toBe(false);
    const ok = enquiryInput.parse({ name: ' Sarah ', email: ' Sarah@Example.COM ' });
    expect(ok).toMatchObject({ name: 'Sarah', email: 'sarah@example.com', adults: 2, children: 0 });
  });

  it('turns empty fields into nothing and ignores nonsense numbers and dates', () => {
    const v = enquiryInput.parse({ name: 'A', email: 'a@b.co', phone: '  ', adults: '-3', children: 'lots', start_date: '14/02/2027' });
    expect(v.phone).toBeNull();
    expect(v.adults).toBe(2);
    expect(v.children).toBe(0);
    expect(v.start_date).toBeUndefined();
    expect(enquiryInput.parse({ name: 'A', email: 'a@b.co', start_date: '2027-02-14' }).start_date).toBe('2027-02-14');
  });

  it('caps very long text', () => {
    expect(enquiryInput.safeParse({ name: 'x'.repeat(121), email: 'a@b.co' }).success).toBe(false);
  });
});

describe.skipIf(!testDatabaseUrl)('saving website forms', () => {
  let db: Database;
  let close: () => Promise<void>;
  beforeAll(async () => ({ db, close } = await freshTestDatabase()));
  afterAll(async () => close?.());

  const slugFor = (title: string) => (title === '17 Days Best of Kenya Safaris' ? '17-days-best-of-kenya-safaris' : null);

  it('saves a booking request with its guest and first message', async () => {
    const input = enquiryInput.parse({
      name: 'Sarah Mitchell', email: 'sarah@example.com', stage: 'Ready to book',
      tour: '17 Days Best of Kenya Safaris', start_date: '2027-02-14', adults: '2', message: 'Vegetarian please',
    });
    const { reference } = await saveWebsiteEnquiry(db, input, slugFor);
    const [b] = await db.select().from(bookings).where(eq(bookings.reference, reference));
    expect(b).toMatchObject({ kind: 'booking', stage: 'new', tourSlug: '17-days-best-of-kenya-safaris', startDate: '2027-02-14', specialRequests: 'Vegetarian please', source: 'website' });
    const messages = await db.select().from(bookingMessages).where(eq(bookingMessages.bookingId, b.id));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ kind: 'guest', body: 'Vegetarian please' });
  });

  it('does not merge guests by email: each request gets its own guest', async () => {
    const input = enquiryInput.parse({ name: 'Sarah M', email: 'SARAH@example.com' });
    await saveWebsiteEnquiry(db, input, slugFor);
    const sarahs = await db.select().from(guests).where(eq(guests.email, 'sarah@example.com'));
    expect(sarahs).toHaveLength(2);
  });
});
