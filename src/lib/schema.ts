import type { CollectionEntry } from 'astro:content';
import { CONTACT, SITE, SOCIAL } from '../consts';

const ORG_ID = `${SITE.url}/#organization`;

export function travelAgency(logoUrl?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': ORG_ID,
    name: SITE.name,
    alternateName: SITE.shortName,
    url: SITE.url,
    logo: logoUrl,
    description: SITE.description,
    slogan: SITE.motto,
    email: CONTACT.email,
    telephone: CONTACT.phoneE164,
    address: {
      '@type': 'PostalAddress',
      addressLocality: CONTACT.city,
      addressCountry: 'KE',
    },
    areaServed: ['Kenya', 'Tanzania', 'Uganda', 'Rwanda', 'Zanzibar'],
    award: SITE.award,
    sameAs: [SOCIAL.facebook, SOCIAL.instagram, SOCIAL.x, SOCIAL.tripadvisor, SOCIAL.safaribookings],
  };
}

export function touristTrip(
  tour: CollectionEntry<'tours'>,
  destinations: CollectionEntry<'destinations'>[],
  pageUrl: URL,
  imageUrl: URL,
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
    provider: { '@id': ORG_ID, '@type': 'TravelAgency', name: SITE.name, url: SITE.url },
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
