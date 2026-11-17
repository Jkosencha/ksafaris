// Supabase connection for the staff dashboard (sign-in and data).
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

/** True once the project URL and public key are set in .env / the host's settings. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * A Supabase client for one request. It reads and refreshes the staff
 * member's sign-in from cookies, and acts with their permissions only.
 */
export function supabaseForRequest(request: Request, cookies: AstroCookies) {
  if (!url || !anonKey) throw new Error('Supabase is not configured');
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('Cookie') ?? '').map(({ name, value }) => ({ name, value: value ?? '' }));
      },
      setAll(list) {
        list.forEach(({ name, value, options }) => cookies.set(name, value, { ...options, path: options?.path ?? '/' }));
      },
    },
  });
}
