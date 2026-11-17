// Locks the staff dashboard (/office) behind a Supabase sign-in.
import { defineMiddleware } from 'astro:middleware';
import { isSupabaseConfigured, supabaseForRequest } from './lib/supabase';

const LOGIN = '/office/login';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isOffice = pathname === '/office' || pathname.startsWith('/office/');
  if (!isOffice || context.isPrerendered || pathname.startsWith(LOGIN)) return next();

  if (!isSupabaseConfigured) {
    // On this computer, while building it, show the sample dashboard with a notice.
    // A published site without keys stays locked.
    if (import.meta.env.DEV) {
      context.locals.officePreview = true;
      return next();
    }
    return context.redirect(`${LOGIN}?error=setup`);
  }

  const supabase = supabaseForRequest(context.request, context.cookies);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return context.redirect(`${LOGIN}?next=${encodeURIComponent(pathname)}`);

  // Signed in is not enough: they must be on the staff list.
  const { data: staff } = await supabase.from('staff').select('id, name, role').eq('id', user.id).maybeSingle();
  if (!staff) {
    await supabase.auth.signOut();
    return context.redirect(`${LOGIN}?error=notstaff`);
  }

  context.locals.staff = staff as App.Locals['staff'];
  return next();
});
