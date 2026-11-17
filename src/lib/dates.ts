// One place to format dates for people: stored in UTC, shown in Nairobi time.
const TZ = 'Africa/Nairobi';

/** "17 Nov 2026, 14:05" */
export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

/** "17 Nov 2026" */
export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}
