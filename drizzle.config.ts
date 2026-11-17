// drizzle-kit settings. Migrations run against Neon's DIRECT (unpooled) URL.
// Generate: npm run db:generate   Apply: npm run db:migrate
// Never use `drizzle-kit push` on the production database.
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL_DIRECT ?? '' },
  strict: true,
  verbose: true,
});
