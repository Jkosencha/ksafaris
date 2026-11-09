import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const destinations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/destinations' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      tagline: z.string(),
      /** One or two sentences, used for cards and meta descriptions. */
      summary: z.string(),
      heroImage: image(),
      heroAlt: z.string(),
      order: z.number().default(99),
      facts: z
        .object({
          capital: z.string().optional(),
          currency: z.string().optional(),
          languages: z.string().optional(),
          bestTime: z.string().optional(),
        })
        .optional(),
      highlights: z
        .array(z.object({ name: z.string(), description: z.string().optional() }))
        .default([]),
    }),
});

const itineraryDay = z.object({
  /** "1", or a range such as "4 & 5" when several days share an entry. */
  day: z.coerce.string(),
  title: z.string(),
  /** Paragraphs separated by blank lines. */
  description: z.string(),
  overnight: z.string().optional(),
  mealPlan: z.string().optional(),
});

const tours = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/tours' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      durationDays: z.number().int().positive(),
      /** Countries/regions visited. Must match a destinations entry id. */
      destinations: z.array(reference('destinations')).min(1),
      /** Stops along the route, in order (parks, lakes, towns). */
      route: z.array(z.string()).default([]),
      /** Lowest per-person price in USD. Leave out to show "Price on request". */
      priceFrom: z.number().positive().optional(),
      heroImage: image(),
      heroAlt: z.string(),
      featured: z.boolean().default(false),
      order: z.number().default(99),
      itinerary: z.array(itineraryDay).min(1),
      included: z.array(z.string()).default([]),
      excluded: z.array(z.string()).default([]),
    }),
});

/** Real guest reviews only. Copy them (with permission) from Tripadvisor / SafariBookings. */
const reviews = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/reviews' }),
  schema: z.object({
    author: z.string(),
    country: z.string().optional(),
    quote: z.string(),
    rating: z.number().int().min(1).max(5).optional(),
    source: z.enum(['Tripadvisor', 'SafariBookings', 'Google', 'Direct']),
    sourceUrl: z.url().optional(),
    date: z.coerce.date().optional(),
    tour: reference('tours').optional(),
  }),
});

export const collections = { destinations, tours, reviews };
