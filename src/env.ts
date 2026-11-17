// Server settings, validated. Astro's env schema (astro.config.mjs) reads them
// at runtime; this adds the rules that a type check alone cannot express.
import { z } from 'astro/zod';
import { DATABASE_URL, SITE_URL } from 'astro:env/server';

const databaseUrl = z
  .url()
  .refine((u) => /^postgres(ql)?:\/\//.test(u), 'DATABASE_URL must be a postgres:// connection string')
  .refine((u) => {
    const { hostname, searchParams } = new URL(u);
    const local = hostname === 'localhost' || hostname === '127.0.0.1';
    return local || searchParams.get('sslmode') === 'require';
  }, 'DATABASE_URL must include sslmode=require (Neon)');

const schema = z.object({
  DATABASE_URL: databaseUrl.optional(),
  SITE_URL: z.url(),
});

// An empty value (as copied from .env.example) means "not set".
const parsed = schema.safeParse({ DATABASE_URL: DATABASE_URL || undefined, SITE_URL });
if (!parsed.success) {
  // Fail fast with a readable message; never print the values themselves.
  const problems = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
  throw new Error(`Invalid server settings: ${problems}`);
}

export const env = parsed.data;
