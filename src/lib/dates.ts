import { CURRENCY } from './money';

/** Local calendar date as YYYY-MM-DD (not UTC: toISOString would shift it across midnight). */
export function toLocalISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parses YYYY-MM-DD as a local date at midnight. */
export function fromLocalISODate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Today at local midnight. */
export function today() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

const shortDate = new Intl.DateTimeFormat(CURRENCY.locale, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

/** "Dec 5, 2026" */
export function formatShortDate(date: Date | string) {
  return shortDate.format(typeof date === 'string' ? fromLocalISODate(date) : date);
}
