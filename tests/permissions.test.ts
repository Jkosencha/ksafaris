// The role table from the project guide (4.1 and 9.1), checked line by line.
import { describe, expect, it } from 'vitest';
import { PERMISSIONS, allowed, can, homeFor, routeRule, type Permission } from '../src/lib/auth/permissions';
import type { Role } from '../src/lib/db/schema';

const owner = { role: 'owner' as Role };
const manager = { role: 'manager' as Role };
const agent = { role: 'booking_agent' as Role };
const editor = { role: 'content_editor' as Role };

describe('permission map', () => {
  it('lets only the Owner manage staff and site settings', () => {
    for (const p of ['users:manage', 'settings:manage'] as Permission[]) {
      expect([owner, manager, agent, editor].map((u) => can(u, p))).toEqual([true, false, false, false]);
    }
  });

  it('keeps Content Editors away from bookings, payments, inbox, reports and fleet', () => {
    const closed: Permission[] = ['bookings:view', 'bookings:manage', 'payments:view', 'payments:record', 'inbox:manage', 'reports:view', 'fleet:view', 'fleet:manage'];
    for (const p of closed) expect(can(editor, p)).toBe(false);
    expect(can(editor, 'content:edit')).toBe(true);
  });

  it('lets Booking Agents view content but not edit it, and handle bookings, payments and inbox', () => {
    expect(can(agent, 'content:view')).toBe(true);
    expect(can(agent, 'content:edit')).toBe(false);
    for (const p of ['bookings:manage', 'payments:view', 'payments:record', 'inbox:manage', 'fleet:view'] as Permission[]) expect(can(agent, p)).toBe(true);
    expect(can(agent, 'reports:view')).toBe(false);
    expect(can(agent, 'fleet:manage')).toBe(false);
  });

  it('gives Managers everything except staff and site settings', () => {
    for (const p of Object.keys(PERMISSIONS) as Permission[]) {
      expect(can(manager, p)).toBe(p !== 'users:manage' && p !== 'settings:manage');
    }
  });

  it('gives the Owner everything, and nobody anything when signed out', () => {
    for (const p of Object.keys(PERMISSIONS) as Permission[]) {
      expect(can(owner, p)).toBe(true);
      expect(can(null, p)).toBe(false);
    }
  });
});

describe('dashboard routes', () => {
  it('map each page to what it needs', () => {
    expect(routeRule('/office')).toBe('bookings:view');
    expect(routeRule('/office/')).toBe('bookings:view');
    expect(routeRule('/office/bookings')).toBe('bookings:view');
    expect(routeRule('/office/bookings/KS-2026-00001')).toBe('bookings:view');
    expect(routeRule('/office/bookings/new')).toBe('bookings:manage');
    expect(routeRule('/office/numbers')).toBe('reports:view');
    expect(routeRule('/office/users')).toBe('users:manage');
    expect(routeRule('/office/settings')).toBe('settings:manage');
    expect(routeRule('/office/fleet')).toBe('fleet:manage');
    expect(routeRule('/office/account')).toBe('signed-in');
  });

  it('treat any unlisted page as Owner-only, so nothing is left open by mistake', () => {
    expect(routeRule('/office/something-new')).toBe('users:manage');
    expect(allowed(manager, routeRule('/office/something-new'))).toBe(false);
    expect(allowed(owner, routeRule('/office/something-new'))).toBe(true);
  });

  it('do not let a look-alike path borrow another page\'s rule', () => {
    expect(routeRule('/office/usersx')).toBe('users:manage'); // unlisted, so Owner-only
    expect(routeRule('/office/bookingsx')).toBe('users:manage');
  });

  it('send Content Editors to the Website editor as their home', () => {
    expect(homeFor(editor)).toBe('/office/website');
    expect(homeFor(agent)).toBe('/office');
    expect(allowed(editor, routeRule('/office/website'))).toBe(true);
    expect(allowed(editor, routeRule('/office/guests'))).toBe(false);
  });
});
