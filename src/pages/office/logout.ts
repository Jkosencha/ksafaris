// Ends the staff member's session (deletes it from the database) and returns to sign-in.
import type { APIRoute } from 'astro';
import { db, isDatabaseConfigured } from '../../lib/db/client';
import { SESSION_COOKIE, clearSessionCookie, deleteSession } from '../../lib/auth/session';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token && isDatabaseConfigured) await deleteSession(db(), token);
  clearSessionCookie(cookies, import.meta.env.PROD);
  return redirect('/office/login', 303);
};
