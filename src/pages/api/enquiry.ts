// Website enquiry and booking request form: check, save, reply.
// The form opens a pre-filled email instead when this answers 503 (no database yet).
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { db, isDatabaseConfigured } from '../../lib/db/client';
import { enquiryInput, saveWebsiteEnquiry } from '../../lib/services/enquiries';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  if (!isDatabaseConfigured) return json({ ok: false, error: 'not-configured' }, 503);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'bad-request' }, 400);
  }

  // Hidden spam trap: real people never fill it. Pretend it worked.
  if (String(form.get('website') ?? '').trim()) return json({ ok: true });

  const parsed = enquiryInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return json({ ok: false, error: 'invalid', fields }, 422);
  }

  const tours = await getCollection('tours');
  const slugFor = (title: string) => tours.find((t) => t.data.title === title)?.id ?? null;

  try {
    const { reference } = await saveWebsiteEnquiry(db(), parsed.data, slugFor);
    return json({ ok: true, reference });
  } catch (error) {
    // Log the details on the server only; the visitor gets a plain message.
    console.error('[enquiry] save failed', error);
    return json({ ok: false, error: 'save-failed' }, 500);
  }
};
