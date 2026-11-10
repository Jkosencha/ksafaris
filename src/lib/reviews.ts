import { getCollection, getEntry } from 'astro:content';

/** Reviews, newest first, with the title of any linked tour. Warns at build time while samples remain. */
export async function getReviews() {
  const reviews = (await getCollection('reviews')).sort(
    (a, b) => (b.data.date?.getTime() ?? 0) - (a.data.date?.getTime() ?? 0),
  );
  const samples = reviews.filter((r) => r.data.sample);
  if (samples.length && import.meta.env.PROD) {
    console.warn(`\n[reviews] ${samples.length} SAMPLE reviews are on the site. Delete them before launch: ${samples.map((r) => r.id).join(', ')}\n`);
  }
  const tourTitles = new Map<string, string>();
  for (const r of reviews) {
    if (r.data.tour && !tourTitles.has(r.data.tour.id)) {
      const t = await getEntry(r.data.tour);
      if (t) tourTitles.set(t.id, t.data.title);
    }
  }
  return reviews.map((review) => ({ review, tourTitle: review.data.tour ? tourTitles.get(review.data.tour.id) : undefined }));
}
