// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import { readdirSync } from 'node:fs';

const SITE = 'https://ksafaris-africanexpeditions.com';
// Pages render on each request, so the sitemap lists them explicitly. Phase 3
// builds it from the database instead of the content files.
/** @param {string} dir @param {string} ext */
const slugs = (dir, ext) => readdirSync(new URL(dir, import.meta.url)).filter((f) => f.endsWith(ext)).map((f) => f.slice(0, -ext.length));
const sitemapPages = [
  '/', '/tours', '/destinations', '/about', '/csr', '/reviews', '/contact',
  ...slugs('./src/content/tours/', '.yaml').map((s) => `/tours/${s}`),
  ...slugs('./src/content/destinations/', '.md').map((s) => `/destinations/${s}`),
].map((path) => new URL(path, SITE).href);

// https://astro.build/config
export default defineConfig({
  site: SITE,
  // Every page renders on request, so Site settings (and, from Phase 3, content)
  // edited in the dashboard show at once. The host is not chosen yet: Node works
  // anywhere, and swapping to another adapter later is a one-line change.
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'ignore',
  // Server settings, checked by Astro and read when the server runs (never baked into the build).
  env: {
    schema: {
      // Neon pooled connection string. Optional so the site still builds and runs
      // without it; the dashboard stays locked (or in local preview) until it is set.
      DATABASE_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      SITE_URL: envField.string({ context: 'server', access: 'public', default: 'http://localhost:4321' }),
    },
  },
  integrations: [
    sitemap({
      customPages: sitemapPages,
      // One address per page (no trailing-slash duplicates), and no private or utility pages.
      filter: (page) =>
        (page === `${SITE}/` || !page.endsWith('/')) && !page.includes('/credits') && !page.includes('/book') && !page.includes('/office'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  // Keep links and search rankings from the old WordPress site working.
  redirects: {
    '/about-us': '/about',
    '/destinations-2': '/destinations',
    '/our-products': '/tours',
    '/contact-us': '/contact',
    '/kenya': '/destinations/kenya',
    '/tanzania': '/destinations/tanzania',
    '/uganda': '/destinations/uganda',
    '/destinations/kenya1': '/destinations/kenya',
    '/zanzibar-safaris': '/destinations/zanzibar',
    '/things-to-do-in-zanzibar': '/destinations/zanzibar',
    '/13-days-kenya-tanzania-expedition': '/tours/13-days-kenya-tanzania-expedition',
    '/17-days-best-of-kenya-safaris': '/tours/17-days-best-of-kenya-safaris',
    '/10-days-bush-beach-kenya-expeditions': '/tours/10-days-bush-beach-kenya-expeditions',
  },
});
