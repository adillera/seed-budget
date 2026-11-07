import type { SQLiteDatabase } from 'expo-sqlite';

import { STARTING_BUDGET_NOTE } from './onboarding';
import type { BillFrequency, CategoryKind } from './schema';

export type HomeCategory = { id: number; name: string; description: string | null; kind: CategoryKind };
export type HomeBill = {
  category_id: number;
  kind: CategoryKind;
  amount_cents: number;
  frequency: BillFrequency;
  next_due_date: string;
};
export type HomeEntrySum = { category_id: number; kind: CategoryKind; cents: number };
type RecentBase = {
  /** Unique across both shapes: `e-<id>` for transactions, `b-<id>` for bills. */
  key: string;
  amount_cents: number;
  category_name: string;
  kind: CategoryKind;
  /** Local YYYY-MM-DD the list sorts by: a transaction's date, a bill's created date. */
  sort_date: string;
};
export type RecentEntry =
  | (RecentBase & { type: 'entry'; id: number; date: string; note: string | null })
  | (RecentBase & { type: 'bill'; id: number; name: string | null; frequency: BillFrequency; next_due_date: string });

export type HomeData = {
  categories: HomeCategory[];
  bills: HomeBill[];
  /** Entry totals per category for the month, without the starting budget row. */
  entrySums: HomeEntrySum[];
  recent: RecentEntry[];
};

export const RECENT_LIMIT = 5;

/** Raw rows for Home for one month (YYYY-MM-DD bounds, inclusive). Totals: features/home/summary.ts. */
export async function loadHomeData(db: SQLiteDatabase, monthStart: string, monthEnd: string): Promise<HomeData> {
  const [categories, bills, entrySums, recent] = await Promise.all([
    db.getAllAsync<HomeCategory>(
      'SELECT id, name, description, kind FROM categories ORDER BY sort_order, id',
    ),
    db.getAllAsync<HomeBill>(
      `SELECT b.category_id, c.kind, b.amount_cents, b.frequency, b.next_due_date
         FROM bills b JOIN categories c ON c.id = b.category_id`,
    ),
    // The starting budget is capital, not income: leave it out of monthly totals.
    db.getAllAsync<HomeEntrySum>(
      `SELECT t.category_id, c.kind, SUM(t.amount_cents) AS cents
         FROM transactions t JOIN categories c ON c.id = t.category_id
        WHERE t.date BETWEEN ? AND ? AND t.note IS NOT ?
        GROUP BY t.category_id`,
      monthStart,
      monthEnd,
      STARTING_BUDGET_NOTE,
    ),
    loadRecent(db),
  ]);
  return { categories, bills, entrySums, recent };
}

type RecentEntryRow = { id: number; amount_cents: number; date: string; note: string | null; category_name: string; kind: CategoryKind };
type RecentBillRow = {
  id: number;
  amount_cents: number;
  name: string | null;
  frequency: BillFrequency;
  next_due_date: string;
  category_name: string;
  kind: CategoryKind;
  /** created_at (UTC) as a local date. */
  created_on: string;
  created_at: string;
};

/**
 * The latest transactions and bills, merged newest first. Transactions sort by their date, bills
 * by the local day they were added; ties go to the most recently created row.
 */
async function loadRecent(db: SQLiteDatabase): Promise<RecentEntry[]> {
  const [entries, bills] = await Promise.all([
    db.getAllAsync<RecentEntryRow & { created_at: string }>(
      `SELECT t.id, t.amount_cents, t.date, t.note, t.created_at, c.name AS category_name, c.kind
         FROM transactions t JOIN categories c ON c.id = t.category_id
        ORDER BY t.date DESC, t.id DESC
        LIMIT ?`,
      RECENT_LIMIT,
    ),
    db.getAllAsync<RecentBillRow>(
      `SELECT b.id, b.amount_cents, b.name, b.frequency, b.next_due_date, b.created_at,
              date(b.created_at, 'localtime') AS created_on, c.name AS category_name, c.kind
         FROM bills b JOIN categories c ON c.id = b.category_id
        ORDER BY b.created_at DESC, b.id DESC
        LIMIT ?`,
      RECENT_LIMIT,
    ),
  ]);

  const merged = [
    ...entries.map(({ created_at, ...e }) => ({
      created_at,
      row: { ...e, type: 'entry' as const, key: `e-${e.id}`, sort_date: e.date },
    })),
    ...bills.map(({ created_at, created_on, ...b }) => ({
      created_at,
      row: { ...b, type: 'bill' as const, key: `b-${b.id}`, sort_date: created_on },
    })),
  ];
  merged.sort(
    (a, b) =>
      b.row.sort_date.localeCompare(a.row.sort_date) ||
      b.created_at.localeCompare(a.created_at) ||
      b.row.id - a.row.id,
  );
  return merged.slice(0, RECENT_LIMIT).map((m) => m.row);
}
