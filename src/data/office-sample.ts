// SAMPLE DATA for the staff dashboard while it is being designed and built.
// Every name, booking and figure here is made up. It is replaced by the real
// database (bookings, guests, trips) once that is connected.

export type Tone = 'teal' | 'gold' | 'clay' | 'leaf';
export type Stage = 'new' | 'quoted' | 'awaiting' | 'confirmed' | 'paid' | 'completed';
export type PhotoKey = 'elephant' | 'ngorongoro' | 'flamingos' | 'lion' | 'lioness' | 'rwanda' | 'mara' | 'kilimanjaro';

export const STAGES: Record<Stage, { label: string; tone: Tone }> = {
  new: { label: 'New', tone: 'teal' },
  quoted: { label: 'Quoted', tone: 'gold' },
  awaiting: { label: 'Awaiting payment', tone: 'clay' },
  confirmed: { label: 'Confirmed', tone: 'leaf' },
  paid: { label: 'Paid', tone: 'leaf' },
  completed: { label: 'Completed', tone: 'leaf' },
};

export const STAFF = { name: 'Kevin', role: 'Reservations' };

export interface Booking {
  id: string;
  guest: string;
  country: string;
  tour: string;
  photo: PhotoKey;
  start: string;
  pax: string;
  stage: Stage;
  kind: 'Booking' | 'Enquiry';
  value: string;
  owner: string;
  received: string;
}

export const BOOKINGS: Booking[] = [
  { id: 'KS-2611-0142', guest: 'Sarah Mitchell', country: 'United Kingdom', tour: '17 Days Best of Kenya', photo: 'elephant', start: '14 Feb', pax: '2 adults', stage: 'new', kind: 'Booking', value: '$11,400', owner: 'Unassigned', received: '25 min ago' },
  { id: 'KS-2611-0141', guest: 'Daniel Roy', country: 'Canada', tour: '13 Days Kenya Tanzania', photo: 'ngorongoro', start: '3 Mar', pax: '4 adults', stage: 'new', kind: 'Booking', value: '$38,000', owner: 'Unassigned', received: '2 h ago' },
  { id: 'KS-2611-0140', guest: 'Mei Lin', country: 'Singapore', tour: 'Not decided yet', photo: 'mara', start: 'Jun', pax: '2 adults', stage: 'new', kind: 'Enquiry', value: 'To quote', owner: 'Kevin', received: '5 h ago' },
  { id: 'KS-2611-0137', guest: 'Grace Wanjiru', country: 'Kenya', tour: 'Tailor-made: Amboseli', photo: 'lion', start: '28 Nov', pax: '3 adults', stage: 'quoted', kind: 'Enquiry', value: '$1,950', owner: 'Kevin', received: 'Yesterday' },
  { id: 'KS-2611-0136', guest: 'Thomas Becker', country: 'Germany', tour: '10 Days Bush & Beach', photo: 'flamingos', start: '9 Jan', pax: '2 adults', stage: 'quoted', kind: 'Booking', value: '$7,800', owner: 'Amina', received: 'Yesterday' },
  { id: 'KS-2611-0131', guest: 'Okoro family', country: 'Nigeria', tour: '10 Days Bush & Beach', photo: 'flamingos', start: '22 Dec', pax: '2 + 2 kids', stage: 'awaiting', kind: 'Booking', value: '$12,600', owner: 'Amina', received: '7 Nov' },
  { id: 'KS-2611-0128', guest: 'Laura Price', country: 'United States', tour: '17 Days Best of Kenya', photo: 'elephant', start: '12 Dec', pax: '2 + 3 kids', stage: 'confirmed', kind: 'Booking', value: '$21,500', owner: 'Kevin', received: '6 Nov' },
  { id: 'KS-2611-0125', guest: 'Aiko Tanaka', country: 'Japan', tour: 'Tailor-made: Rwanda', photo: 'rwanda', start: '20 Jan', pax: '1 adult', stage: 'paid', kind: 'Booking', value: '$4,900', owner: 'Amina', received: '4 Nov' },
];

export interface Departure {
  day: string;
  month: string;
  guest: string;
  tour: string;
  photo: PhotoKey;
  guide: string | null;
  vehicle: string;
}

export const DEPARTURES: Departure[] = [
  { day: '14', month: 'Nov', guest: 'Okafor family (4)', tour: '10 Days Bush & Beach', photo: 'flamingos', guide: 'Joseph', vehicle: 'Land Cruiser 2' },
  { day: '18', month: 'Nov', guest: 'Müller couple (2)', tour: '13 Days Kenya Tanzania', photo: 'ngorongoro', guide: 'Peter', vehicle: 'Fly-in' },
  { day: '28', month: 'Nov', guest: 'Grace Wanjiru (3)', tour: 'Amboseli weekend', photo: 'lion', guide: 'Joseph', vehicle: 'Land Cruiser 1' },
  { day: '12', month: 'Dec', guest: 'Price family (5)', tour: '17 Days Best of Kenya', photo: 'mara', guide: null, vehicle: 'Land Cruiser 3' },
];

export const HEADLINES: { label: string; value: string; note: string; tone: Tone; photo: PhotoKey }[] = [
  { label: 'New enquiries this week', value: '14', note: '+3 on last week', tone: 'teal', photo: 'flamingos' },
  { label: 'Waiting for a reply', value: '5', note: 'Oldest: 2 hours', tone: 'gold', photo: 'lion' },
  { label: 'Trips in the next 30 days', value: '7', note: '1 needs a guide', tone: 'clay', photo: 'lioness' },
  { label: 'Confirmed this month', value: '$48,200', note: '9 bookings', tone: 'leaf', photo: 'mara' },
];

/** Enquiries per week, last 12 weeks, oldest first. */
export const ENQUIRIES_PER_WEEK = [6, 7, 5, 8, 9, 8, 10, 11, 9, 12, 13, 14];

export const WEBSITE_COUNTS = [
  { label: 'Tours', value: '3' },
  { label: 'Destinations', value: '5' },
  { label: 'Reviews', value: '6 samples' },
  { label: 'Photos', value: '48' },
];

export const TODOS: { text: string; meta: string; tone?: Tone; href?: string }[] = [
  { text: 'Reply to Sarah Mitchell', meta: 'Booking request · 25 min ago', tone: 'teal', href: '/office/bookings/KS-2611-0142' },
  { text: 'Send quote to Daniel Roy', meta: 'Check Serengeti camp space for March', href: '/office/bookings/KS-2611-0141' },
  { text: 'Chase deposit: Okoro family', meta: 'Invoice sent 3 days ago', tone: 'clay', href: '/office/bookings/KS-2611-0131' },
  { text: 'Assign a guide to the Price family', meta: 'Departs 12 Dec', href: '/office/trips' },
  { text: 'Approve new Tripadvisor review', meta: 'Website › Reviews', href: '/office/website' },
];

export const MONTH_SUMMARY = [
  { value: '9', label: 'Bookings confirmed' },
  { value: '$48.2k', label: 'Value confirmed' },
  { value: '21%', label: 'Enquiries that booked' },
  { value: '3 h', label: 'Average first reply' },
];
