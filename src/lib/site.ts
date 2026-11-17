// The agency's details for the page being rendered: from Site settings (loaded
// by the middleware, cached for a minute), or the defaults if not available.
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from './services/site-settings';
export { telHref, whatsappHref, xHandle } from './services/site-settings';

export function siteOf(locals: App.Locals): SiteSettings {
  return locals.settings ?? DEFAULT_SITE_SETTINGS;
}
