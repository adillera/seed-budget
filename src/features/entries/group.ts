import type { ListedEntry } from '@/db/entries';

export type MonthGroup = {
  /** YYYY-MM */
  month: string;
  entries: ListedEntry[];
};

/** Entries already sorted newest first → one group per calendar month, in the same order. */
export function groupByMonth(entries: readonly ListedEntry[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const e of entries) {
    const month = e.date.slice(0, 7);
    const last = groups.at(-1);
    if (last?.month === month) last.entries.push(e);
    else groups.push({ month, entries: [e] });
  }
  return groups;
}
