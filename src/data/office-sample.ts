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

/** First day shown on the trips calendar (sample data is set around this date). */
export const CALENDAR_START = '2026-11-10';

export interface Trip {
  guest: string;
  tour: string;
  photo: PhotoKey;
  /** Day offset from CALENDAR_START, and length in days. */
  start: number;
  days: number;
  status: 'paid' | 'awaiting' | 'noguide';
  label: string;
}

export const TRIPS: Trip[] = [
  { guest: 'Hassan couple (2)', tour: '17 Days Best of Kenya', photo: 'elephant', start: 0, days: 9, status: 'paid', label: 'Samuel · Land Cruiser 3 · on safari now' },
  { guest: 'Okafor family (4)', tour: '10 Days Bush & Beach', photo: 'flamingos', start: 4, days: 10, status: 'paid', label: 'Joseph · Land Cruiser 2' },
  { guest: 'Müller couple (2)', tour: '13 Days Kenya Tanzania', photo: 'ngorongoro', start: 8, days: 13, status: 'paid', label: 'Peter · fly-in' },
  { guest: 'Grace Wanjiru (3)', tour: 'Amboseli weekend', photo: 'lion', start: 18, days: 3, status: 'awaiting', label: 'Joseph · LC 1' },
  { guest: 'Lindqvist group (6)', tour: 'Tailor-made: Maasai Mara', photo: 'mara', start: 21, days: 5, status: 'noguide', label: 'Guide needed · balance due' },
];

export const TRIP_STATS: { value: string; label: string; tone: Tone }[] = [
  { value: '1 trip', label: 'On safari now, 2 guests', tone: 'leaf' },
  { value: '2', label: 'Departing in the next 10 days', tone: 'teal' },
  { value: '$18,080', label: 'Payments due this month', tone: 'clay' },
  { value: '2 of 4', label: 'Guides free today', tone: 'gold' },
];

/** Status lines for the guides, vehicles and payments panels. `tone` marks the ones to notice. */
export const RESOURCES: { title: string; tone: Tone; rows: { name: string; status: string; tone?: Tone }[] }[] = [
  {
    title: 'Guides',
    tone: 'teal',
    rows: [
      { name: 'Joseph', status: 'Free until 14 Nov', tone: 'leaf' },
      { name: 'Peter', status: 'Free until 18 Nov', tone: 'leaf' },
      { name: 'Samuel', status: 'On safari to 18 Nov' },
      { name: 'Mary', status: 'On leave to 1 Dec' },
    ],
  },
  {
    title: 'Vehicles',
    tone: 'gold',
    rows: [
      { name: 'Land Cruiser 1', status: 'Free', tone: 'leaf' },
      { name: 'Land Cruiser 2', status: 'Booked from 14 Nov' },
      { name: 'Land Cruiser 3', status: 'On safari to 18 Nov' },
      { name: 'Land Cruiser 4', status: 'Service due 15 Nov', tone: 'clay' },
    ],
  },
  {
    title: 'Payments due',
    tone: 'clay',
    rows: [
      { name: 'Grace Wanjiru', status: '$1,950 by 21 Nov', tone: 'gold' },
      { name: 'Lindqvist group', status: '$12,350 by 24 Nov', tone: 'gold' },
      { name: 'Okoro family', status: 'Deposit $3,780 now', tone: 'clay' },
    ],
  },
];

export interface Guest {
  name: string;
  country: string;
  trips: number;
  trip: string;
  when: string;
  spent: string;
  tags: { label: string; tone: Tone }[];
  /** Which filter buttons this guest matches. */
  groups: ('soon' | 'repeat' | 'never' | 'reviewed')[];
}

export const GUESTS: Guest[] = [
  { name: 'Laura Price', country: 'United States', trips: 3, trip: '17 Days Best of Kenya', when: 'Departs 12 Dec', spent: '$38,900', tags: [{ label: 'Repeat', tone: 'leaf' }, { label: 'Family', tone: 'teal' }], groups: ['soon', 'repeat', 'reviewed'] },
  { name: 'Sarah Mitchell', country: 'United Kingdom', trips: 0, trip: '17 Days Best of Kenya', when: 'Requested for 14 Feb', spent: '$0', tags: [{ label: 'New', tone: 'teal' }], groups: ['never'] },
  { name: 'Hassan couple', country: 'United Arab Emirates', trips: 2, trip: '17 Days Best of Kenya', when: 'On safari now', spent: '$24,600', tags: [{ label: 'Repeat', tone: 'leaf' }, { label: 'Honeymoon', tone: 'gold' }], groups: ['repeat', 'reviewed'] },
  { name: 'Okafor family', country: 'Nigeria', trips: 1, trip: '10 Days Bush & Beach', when: 'Departs 14 Nov', spent: '$12,600', tags: [{ label: 'Family', tone: 'teal' }], groups: ['soon'] },
  { name: 'Aiko Tanaka', country: 'Japan', trips: 1, trip: 'Tailor-made: Rwanda', when: 'Departs 20 Jan', spent: '$4,900', tags: [{ label: 'Solo', tone: 'gold' }], groups: [] },
  { name: 'Grace Wanjiru', country: 'Kenya', trips: 4, trip: 'Amboseli weekend', when: 'Departs 28 Nov', spent: '$7,300', tags: [{ label: 'Repeat', tone: 'leaf' }, { label: 'Resident rate', tone: 'clay' }], groups: ['soon', 'repeat', 'reviewed'] },
  { name: 'Thomas Becker', country: 'Germany', trips: 0, trip: '10 Days Bush & Beach', when: 'Quoted 9 Nov', spent: '$0', tags: [{ label: 'Quoted', tone: 'gold' }], groups: ['never'] },
  { name: 'Müller couple', country: 'Germany', trips: 1, trip: '13 Days Kenya Tanzania', when: 'Departs 18 Nov', spent: '$19,800', tags: [{ label: 'Fly-in', tone: 'teal' }], groups: ['soon'] },
];

export const GUEST_PROFILE = {
  name: 'Laura Price',
  since: 'United States · guest since 2023',
  stats: [
    { value: '3', label: 'Trips' },
    { value: '$38.9k', label: 'Spent' },
    { value: '5★', label: 'Review' },
  ],
  prefs: [
    { k: 'Food', v: 'One child is vegetarian; no nuts for her son' },
    { k: 'Rooms', v: 'Family tent or two connecting rooms' },
    { k: 'Loves', v: 'Big cats, photography, sundowners' },
    { k: 'Guide', v: 'Asked for Joseph again' },
    { k: 'Dates', v: 'Wedding anniversary 18 Dec' },
  ],
  history: [
    { tour: '17 Days Best of Kenya Safaris', when: '12 to 28 Dec 2026 · 5 guests', status: 'Confirmed', tone: 'teal' as Tone, photo: 'elephant' as PhotoKey },
    { tour: 'Tailor-made: Maasai Mara & Diani', when: 'Aug 2025 · 4 guests', status: 'Completed', tone: 'leaf' as Tone, photo: 'mara' as PhotoKey },
    { tour: 'Amboseli & Tsavo', when: 'Mar 2023 · 2 guests', status: 'Completed', tone: 'leaf' as Tone, photo: 'lion' as PhotoKey },
  ],
};
