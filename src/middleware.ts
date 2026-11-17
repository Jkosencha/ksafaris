// Locks the staff dashboard (/office) behind our own sign-in.
import { defineMiddleware } from 'astro:middleware';
import { db, isDatabaseConfigured } from './lib/db/client';
import { SESSION_COOKIE, clearSessionCookie, setSessionCookie, validateSession } from './lib/auth/session';

const LOGIN = '/office/login';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isOffice = pathname === '/office' || pathname.startsWith('/office/');
  if (!isOffice || context.isPrerendered || pathname.startsWith(LOGIN)) return next();

  if (!isDatabaseConfigured) {
    // On this computer, while building it, show the sample dashboard with a notice.
    // A published site without a database stays locked.
    if (import.meta.env.DEV) {
      context.locals.officePreview = true;
      return next();
    }
    return context.redirect(`${LOGIN}?error=setup`);
  }

  const secure = import.meta.env.PROD;
  const token = context.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await validateSession(db(), token) : null;
  if (!session) {
    if (token) clearSessionCookie(context.cookies, secure);
    return context.redirect(`${LOGIN}?next=${encodeURIComponent(pathname)}`);
  }

  if (session.renewedUntil && token) setSessionCookie(context.cookies, token, session.renewedUntil, secure);
  context.locals.user = session.user;
  return next();
});
