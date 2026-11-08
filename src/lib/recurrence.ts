import type { BillFrequency } from '@/db/schema';

import { addDays, addMonthsClamped } from './dates';

/**
 * When a bill falls due. Every occurrence is computed from the bill's `start_date` anchor (not
 * from the previous one), so a month-end start stays on month end: Jan 31 → Feb 28 → Mar 31.
 * Dates are local YYYY-MM-DD strings, which compare correctly as text.
 */

const DAYS: Partial<Record<BillFrequency, number>> = { daily: 1, weekly: 7, biweekly: 14 };
const MONTHS: Partial<Record<BillFrequency, number>> = {
  monthly: 1,
  bimonthly: 2,
  quarterly: 3,
  semiannually: 6,
  yearly: 12,
};

/** Occurrence k (0-based) of a bill starting on `start`; null when there's none (`once`, k > 0). */
export function occurrence(start: string, frequency: BillFrequency, k: number): string | null {
  if (frequency === 'once') return k === 0 ? start : null;
  const days = DAYS[frequency];
  if (days) return addDays(start, k * days);
  const months = MONTHS[frequency];
  if (months) return addMonthsClamped(start, k * months);
  // semimonthly: the start's day, and 15 days after it, every month.
  const base = addMonthsClamped(start, Math.floor(k / 2));
  return k % 2 === 0 ? base : addDays(base, 15);
}

/** First k whose occurrence is on or after `date` (a cheap estimate, then stepped exactly). */
function firstIndexOnOrAfter(start: string, frequency: BillFrequency, date: string) {
  if (date <= start) return 0;
  const days = DAYS[frequency];
  let k = 0;
  if (days) {
    const span = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000);
    k = Math.max(0, Math.floor(span / days) - 1);
  }
  for (;;) {
    const d = occurrence(start, frequency, k);
    if (d === null || d >= date) return k;
    k += 1;
  }
}

/** Every occurrence in [from, to], inclusive, in order. */
export function occurrencesBetween(start: string, frequency: BillFrequency, from: string, to: string) {
  const dates: string[] = [];
  for (let k = firstIndexOnOrAfter(start, frequency, from); ; k += 1) {
    const d = occurrence(start, frequency, k);
    if (d === null || d > to) return dates;
    dates.push(d);
  }
}

/** The first occurrence strictly after `date`, or null when there's none (a `once` bill already past). */
export function nextOccurrenceAfter(start: string, frequency: BillFrequency, date: string) {
  return occurrence(start, frequency, firstIndexOnOrAfter(start, frequency, addDays(date, 1)));
}
