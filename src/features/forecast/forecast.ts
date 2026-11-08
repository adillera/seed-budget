import type { ForecastData } from '@/db/forecast';
import {
  addDays,
  addMonthsClamped,
  daysBetween,
  formatMonthYear,
  formatShortDate,
  fromLocalISODate,
  monthBounds,
} from '@/lib/dates';
import { occurrencesBetween } from '@/lib/recurrence';

/** Ranges up to this many months after day one get a node per day; longer ones a node per month. */
export const DAILY_MAX_MONTHS = 3;
/** How far ahead the To date can go. */
export const MAX_YEARS_AHEAD = 10;

export type ForecastPoint = {
  /** Local YYYY-MM-DD the balance is taken at (end of that day). */
  date: string;
  /** Readout label: "Dec 8, 2026", or "November 2026" for a full month node. */
  label: string;
  balanceCents: number;
};

export type Forecast = {
  /** Inclusive day count from day one to To. */
  days: number;
  granularity: 'day' | 'month';
  /** The starting budget, when it falls inside the range. */
  startingCents: number;
  /** Income in the range, starting budget left out. */
  incomeCents: number;
  expenseCents: number;
  /** Balance at the end of the To date. */
  endBalanceCents: number;
  points: ForecastPoint[];
};

/** Day one: the earliest transaction (starting budget included), never later than today. */
export function dayOne(data: ForecastData, today: string) {
  return data.firstDate !== null && data.firstDate < today ? data.firstDate : today;
}

export const defaultTo = (today: string) => addMonthsClamped(today, 1);
export const maxTo = (today: string) => addMonthsClamped(today, MAX_YEARS_AHEAD * 12);

/**
 * Running balance from `from` to `to` (inclusive, YYYY-MM-DD): every transaction in the range plus
 * each bill's occurrences from its next_due_date (posted ones are transactions already).
 */
export function buildForecast(data: ForecastData, from: string, to: string): Forecast {
  const delta = new Map<string, number>();
  const add = (date: string, cents: number) => delta.set(date, (delta.get(date) ?? 0) + cents);

  let incomeCents = 0;
  let expenseCents = 0;
  for (const d of data.dailySums) {
    if (d.date < from || d.date > to) continue;
    add(d.date, d.incomeCents - d.expenseCents);
    incomeCents += d.incomeCents;
    expenseCents += d.expenseCents;
  }

  for (const b of data.bills) {
    const start = b.next_due_date > from ? b.next_due_date : from;
    const dates = occurrencesBetween(b.start_date, b.frequency, start, to);
    const sign = b.kind === 'income' ? 1 : -1;
    for (const date of dates) add(date, sign * b.amount_cents);
    if (b.kind === 'income') incomeCents += dates.length * b.amount_cents;
    else expenseCents += dates.length * b.amount_cents;
  }

  let startingCents = 0;
  if (data.starting && data.starting.date >= from && data.starting.date <= to) {
    startingCents = data.starting.cents;
    add(data.starting.date, startingCents);
  }

  const granularity = to <= addMonthsClamped(from, DAILY_MAX_MONTHS) ? 'day' : 'month';
  const points: ForecastPoint[] = [];
  let balance = 0;
  for (let date = from; date <= to; date = addDays(date, 1)) {
    balance += delta.get(date) ?? 0;
    if (granularity === 'day') {
      points.push({ date, label: formatShortDate(date), balanceCents: balance });
    } else if (date === to) {
      points.push({ date, label: formatShortDate(date), balanceCents: balance });
    } else if (monthBounds(fromLocalISODate(date)).end === date) {
      points.push({ date, label: formatMonthYear(fromLocalISODate(date)), balanceCents: balance });
    }
  }

  return {
    days: daysBetween(from, to) + 1,
    granularity,
    startingCents,
    incomeCents,
    expenseCents,
    endBalanceCents: balance,
    points,
  };
}
