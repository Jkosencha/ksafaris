// Who may do what. The single source of truth for roles (project guide 4.1 and 9.1).
// Checked on the server for every dashboard request; hiding a menu item is not security.
import type { Role } from '../db/schema';

export const PERMISSIONS = {
  'users:manage': ['owner'],
  'settings:manage': ['owner'],
  'content:view': ['owner', 'manager', 'content_editor', 'booking_agent'],
  'content:edit': ['owner', 'manager', 'content_editor'],
  'bookings:view': ['owner', 'manager', 'booking_agent'],
  'bookings:manage': ['owner', 'manager', 'booking_agent'],
  'payments:view': ['owner', 'manager', 'booking_agent'],
  'payments:record': ['owner', 'manager', 'booking_agent'],
  'inbox:manage': ['owner', 'manager', 'booking_agent'],
  'reports:view': ['owner', 'manager'],
  'fleet:view': ['owner', 'manager', 'booking_agent'],
  'fleet:manage': ['owner', 'manager'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  manager: 'Manager',
  booking_agent: 'Booking agent',
  content_editor: 'Content editor',
};

export function can(user: { role: Role } | undefined | null, permission: Permission): boolean {
  return Boolean(user && (PERMISSIONS[permission] as readonly Role[]).includes(user.role));
}

/** Any signed-in, active staff member. */
export const SIGNED_IN = 'signed-in' as const;
type RouteRule = Permission | typeof SIGNED_IN;

/** Dashboard routes and what they need. More specific prefixes come first. */
const ROUTES: [prefix: string, rule: RouteRule][] = [
  ['/office/bookings/new', 'bookings:manage'],
  ['/office/bookings', 'bookings:view'],
  ['/office/trips', 'bookings:view'],
  ['/office/guests', 'bookings:view'],
  ['/office/website', 'content:view'],
  ['/office/numbers', 'reports:view'],
  ['/office/users', 'users:manage'],
  ['/office/settings', 'settings:manage'],
  ['/office/fleet', 'fleet:manage'],
  ['/office/admin', 'fleet:manage'], // the Admin hub: Owners and Managers
  ['/office/account', SIGNED_IN],
  ['/office/logout', SIGNED_IN],
  ['/office/forbidden', SIGNED_IN],
];

/**
 * What a dashboard path needs. The home page needs bookings access; any path
 * not listed falls back to Owner-only, so a new page is never left open by mistake.
 */
export function routeRule(pathname: string): RouteRule {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/office') return 'bookings:view';
  const match = ROUTES.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`));
  return match ? match[1] : 'users:manage';
}

export function allowed(user: { role: Role }, rule: RouteRule): boolean {
  return rule === SIGNED_IN || can(user, rule);
}

/** Where to send someone after sign-in, or when they open a page their role can't see. */
export function homeFor(user: { role: Role }): string {
  return can(user, 'bookings:view') ? '/office' : '/office/website';
}
