// Locks the staff dashboard (/office) behind our own sign-in and checks each
// person's role against the page they ask for.
import { defineMiddleware } from 'astro:middleware';
import { db, isDatabaseConfigured } from './lib/db/client';
import { SESSION_COOKIE, clearSessionCookie, setSessionCookie, validateSession } from './lib/auth/session';
import { allowed, homeFor, routeRule } from './lib/auth/permissions';

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
  const { user } = session;
  context.locals.user = user;

  // Role check for this page.
  const rule = routeRule(pathname);
  if (!allowed(user, rule)) {
    // Content editors land on the home page by default: send them to their own home instead of an error.
    const home = homeFor(user);
    if ((pathname === '/office' || pathname === '/office/') && home !== '/office') return context.redirect(home);
    const page = await context.rewrite('/office/forbidden');
    return new Response(page.body, { status: 403, headers: page.headers });
  }
  return next();
});
