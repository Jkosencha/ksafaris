// Helpers shared by the staff dashboard pages.
import type { ImageMetadata } from 'astro';
import elephant from '../assets/images/placeholders/amboseli-elephant.jpg';
import kilimanjaro from '../assets/images/placeholders/amboseli-kilimanjaro.jpg';
import lioness from '../assets/images/placeholders/mara-lioness-vehicle.jpg';
import mara from '../assets/images/placeholders/mara-plains.jpg';
import flamingos from '../assets/images/placeholders/nakuru-flamingos.jpg';
import ngorongoro from '../assets/images/placeholders/ngorongoro-nature.jpg';
import rwanda from '../assets/images/placeholders/rwanda-hills.jpg';
import lion from '../assets/images/placeholders/serengeti-lion.jpg';
import type { PhotoKey, Tone } from '../data/office-sample';

export const PHOTOS: Record<PhotoKey, ImageMetadata> = { elephant, kilimanjaro, lioness, mara, flamingos, ngorongoro, rwanda, lion };

/**
 * Tailwind class sets per colour meaning. Written out in full so Tailwind
 * finds every class when it scans the source.
 */
export const TONE: Record<Tone, { chip: string; card: string; solid: string; wash: string }> = {
  teal: { chip: 'bg-teal-soft text-teal-ink', card: 'bg-teal-soft text-teal-ink', solid: 'bg-teal text-[#0e1d1e]', wash: 'bg-teal-wash' },
  gold: { chip: 'bg-gold-soft text-gold-ink', card: 'bg-gold-soft text-gold-ink', solid: 'bg-gold text-[#2b2208]', wash: 'bg-gold-wash' },
  clay: { chip: 'bg-clay-soft text-clay-ink', card: 'bg-clay-soft text-clay-ink', solid: 'bg-clay text-[#2a1206]', wash: 'bg-clay-wash' },
  leaf: { chip: 'bg-leaf-soft text-leaf-ink', card: 'bg-leaf-soft text-leaf-ink', solid: 'bg-leaf text-[#10170d]', wash: 'bg-leaf-wash' },
};

/** Text in the dark shade of a meaning colour, for use on the page background. */
export const INK: Record<Tone, string> = {
  teal: 'text-teal-ink',
  gold: 'text-gold-ink',
  clay: 'text-clay-ink',
  leaf: 'text-leaf-ink',
};

export const OFFICE_NAV = [
  { href: '/office', label: 'Overview' },
  { href: '/office/bookings', label: 'Bookings', count: 5 },
  { href: '/office/trips', label: 'Trips' },
  { href: '/office/guests', label: 'Guests' },
  { href: '/office/website', label: 'Website' },
  { href: '/office/numbers', label: 'Numbers' },
] as const;
