// Single source of truth for business details used across the site.

export const SITE = {
  name: 'KSafaris & African Expeditions',
  shortName: 'KSafaris',
  url: 'https://ksafaris-africanexpeditions.com',
  description:
    'Locally owned Kenyan tour operator crafting tailor-made safaris across Kenya, Tanzania, Uganda, Rwanda and Zanzibar. Best Tour Agency of the Year 2022.',
  motto: 'Say where, we’ll take you there',
  mission: 'Creating lasting memories through sustainable travel',
  foundedYearsAgo: 12,
  award: 'Best Tour Agency of the Year 2022 — People’s Choice Awards',
  locale: 'en_GB',
};

export const CONTACT = {
  email: 'info@ksafaris-africanexpeditions.com',
  phoneDisplay: '+254 736 112 673',
  phoneE164: '+254736112673',
  whatsapp: '254736112673',
  city: 'Nairobi',
  country: 'Kenya',
};

export const SOCIAL = {
  facebook: 'https://www.facebook.com/KsafarisAfrica',
  instagram: 'https://www.instagram.com/ksafarisafrica/',
  x: 'https://x.com/KSafarisKE',
  xHandle: '@KSafarisKE',
  tripadvisor:
    'https://www.tripadvisor.com/Attraction_Review-g294207-d25039887-Reviews-KSafaris_African_Expeditions-Nairobi.html',
  safaribookings: 'https://www.safaribookings.com/p3271',
};

export const COMING_SOON = ['South Africa', 'Botswana', 'Zambia'];

export const TRAVELLER_TYPES = ['FIT', 'Individual', 'Corporate', 'Group', 'MICE'];

export const NAV = [
  { href: '/tours', label: 'Tours' },
  { href: '/destinations', label: 'Destinations' },
  { href: '/about', label: 'About' },
  { href: '/csr', label: 'CSR' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/contact', label: 'Contact' },
];

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${CONTACT.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
