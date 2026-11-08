/** Locale for date labels ("Dec 5, 2026"); independent of the chosen currency. */
const DATE_LOCALE = 'en-PH';

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

const shortDate = new Intl.DateTimeFormat(DATE_LOCALE, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

/** "Dec 5, 2026" */
export function formatShortDate(date: Date | string) {
  return shortDate.format(typeof date === 'string' ? fromLocalISODate(date) : date);
}

/** First and last local day of the month containing `date`, as YYYY-MM-DD. */
export function monthBounds(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start: toLocalISODate(start), end: toLocalISODate(end) };
}

const monthYear = new Intl.DateTimeFormat(DATE_LOCALE, { month: 'long', year: 'numeric' });

/** "November 2026" */
export function formatMonthYear(date: Date) {
  return monthYear.format(date);
}

/** `iso` + n days (n may be negative), as YYYY-MM-DD. Local dates, so DST never shifts the day. */
export function addDays(iso: string, n: number) {
  const d = fromLocalISODate(iso);
  return toLocalISODate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
}

/** `iso` + n months, keeping its day but clamped to the target month's last day (Jan 31 + 1 → Feb 28). */
export function addMonthsClamped(iso: string, n: number) {
  const d = fromLocalISODate(iso);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
  return toLocalISODate(new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), lastDay)));
}

/** Whole days from `from` to `to` (YYYY-MM-DD), negative when `to` is earlier. Counted in UTC, so DST can't skew it. */
export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}
