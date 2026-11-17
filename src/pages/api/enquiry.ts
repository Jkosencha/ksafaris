// Saves a website enquiry or booking request into the dashboard database.
// Runs on the site's own server with the secret key, so the database itself
// stays closed to the public. The form falls back to email if this fails.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Trimmed text, capped so nobody can post a novel. Empty becomes null. */
const text = (form: FormData, key: string, max = 500) => {
  const value = String(form.get(key) ?? '').trim().slice(0, max);
  return value || null;
};
const count = (form: FormData, key: string, fallback: number) => {
  const n = Number.parseInt(String(form.get(key) ?? ''), 10);
  return Number.isFinite(n) && n >= 0 && n <= 50 ? n : fallback;
};
const isDate = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

export const POST: APIRoute = async ({ request }) => {
  if (!url || !serviceKey) return json({ ok: false, error: 'not-configured' }, 503);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'bad-request' }, 400);
  }

  // Honeypot: real people never fill this hidden field. Pretend it worked.
  if (text(form, 'website')) return json({ ok: true });

  const name = text(form, 'name', 120);
  const email = text(form, 'email', 200)?.toLowerCase() ?? null;
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'missing-details' }, 422);
  }

  const kind = text(form, 'stage') === 'Ready to book' ? 'booking' : 'enquiry';
  const tourTitle = text(form, 'tour', 200) ?? 'Not decided yet';
  const tours = await getCollection('tours');
  const tourSlug = tours.find((t) => t.data.title === tourTitle)?.id ?? null;
  const message = text(form, 'message', 4000);

  const db = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Reuse the guest if this email has been in touch before.
  // Case-insensitive match; % and _ in the address are literal, not wildcards.
  const pattern = email.replace(/[%_\\]/g, '\\$&');
  const { data: existing, error: findError } = await db.from('guests').select('id').ilike('email', pattern).limit(1).maybeSingle();
  if (findError) return json({ ok: false, error: 'save-failed' }, 500);

  let guestId = existing?.id as string | undefined;
  if (!guestId) {
    const { data: guest, error } = await db
      .from('guests')
      .insert({ name, email, phone: text(form, 'phone', 60), country: text(form, 'country', 80), nationality: text(form, 'nationality', 80) })
      .select('id')
      .single();
    if (error || !guest) return json({ ok: false, error: 'save-failed' }, 500);
    guestId = guest.id;
  }

  const { data: booking, error: bookingError } = await db
    .from('bookings')
    .insert({
      guest_id: guestId,
      kind,
      tour_slug: tourSlug,
      tour_title: tourTitle,
      start_date: isDate(text(form, 'start_date')),
      travel_month: text(form, 'travel_month', 20),
      date_flexibility: text(form, 'date_flexibility', 80),
      adults: count(form, 'adults', 2),
      children: count(form, 'children', 0),
      children_ages: text(form, 'children_ages', 80),
      rooms: text(form, 'rooms', 120),
      accommodation: text(form, 'accommodation', 80),
      flights: text(form, 'flights', 300),
      travel_type: text(form, 'travel_type', 80),
      special_requests: kind === 'booking' ? message : null,
      heard_from: text(form, 'heard_from', 80),
      source: 'website',
    })
    .select('id, ref')
    .single();
  if (bookingError || !booking) return json({ ok: false, error: 'save-failed' }, 500);

  // The guest's own words start the booking's message history.
  if (message) {
    await db.from('booking_messages').insert({ booking_id: booking.id, kind: 'guest', body: message });
  }

  return json({ ok: true, ref: booking.ref });
};
