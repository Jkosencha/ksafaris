// Signs the staff member out and returns to the sign-in page.
import type { APIRoute } from 'astro';
import { isSupabaseConfigured, supabaseForRequest } from '../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (isSupabaseConfigured) await supabaseForRequest(request, cookies).auth.signOut();
  return redirect('/office/login', 303);
};
