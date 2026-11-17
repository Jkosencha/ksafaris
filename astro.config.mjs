// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://ksafaris-africanexpeditions.com',
  // Pages are pre-built; only the staff dashboard (/office) runs on request,
  // behind its sign-in. The host is not chosen yet: Node works anywhere, and
  // swapping to the Netlify or Vercel adapter later is a one-line change.
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'ignore',
  integrations: [sitemap({ filter: (page) => !page.includes('/credits') && !page.endsWith('/book/') && !page.includes('/office') })],
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
