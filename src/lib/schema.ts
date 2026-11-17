import type { CollectionEntry } from 'astro:content';
import { SITE } from '../consts';
import type { SiteSettings } from './services/site-settings';

const ORG_ID = `${SITE.url}/#organization`;

export function travelAgency(s: SiteSettings, logoUrl?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': ORG_ID,
    name: s.agencyName,
    alternateName: SITE.shortName,
    url: SITE.url,
    logo: logoUrl,
    description: SITE.description,
    slogan: s.tagline ?? undefined,
    email: s.email,
    telephone: `+${s.phone.replace(/[^\d]/g, '')}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: s.address?.split(',')[0]?.trim() || undefined,
      addressCountry: 'KE',
    },
    areaServed: ['Kenya', 'Tanzania', 'Uganda', 'Rwanda', 'Zanzibar'],
    award: SITE.award,
    sameAs: [s.facebookUrl, s.instagramUrl, s.tiktokUrl, s.xUrl, s.tripadvisorUrl, s.safaribookingsUrl].filter(Boolean),
  };
}

export function touristTrip(
  tour: CollectionEntry<'tours'>,
  destinations: CollectionEntry<'destinations'>[],
  pageUrl: URL,
  imageUrl: URL,
  agencyName: string,
) {
  const { title, summary, durationDays, route, priceFrom } = tour.data;
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: title,
    description: summary,
    url: pageUrl.href,
    image: imageUrl.href,
    touristType: ['Wildlife safari', 'Tailor-made travel'],
    // ISO 8601 duration, e.g. P13D
    duration: `P${durationDays}D`,
    provider: { '@id': ORG_ID, '@type': 'TravelAgency', name: agencyName, url: SITE.url },
    itinerary: {
      '@type': 'ItemList',
      numberOfItems: route.length,
      itemListElement: route.map((stop, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: { '@type': 'TouristDestination', name: stop },
      })),
    },
    contentLocation: destinations.map((d) => ({ '@type': 'Country', name: d.data.name })),
    ...(priceFrom && {
      offers: {
        '@type': 'Offer',
        price: priceFrom,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: pageUrl.href,
        seller: { '@id': ORG_ID },
      },
    }),
  };
}
