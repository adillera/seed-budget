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
export type RecentEntry = {
  id: number;
  amount_cents: number;
  date: string;
  note: string | null;
  category_name: string;
  kind: CategoryKind;
};

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
    db.getAllAsync<RecentEntry>(
      `SELECT t.id, t.amount_cents, t.date, t.note, c.name AS category_name, c.kind
         FROM transactions t JOIN categories c ON c.id = t.category_id
        ORDER BY t.date DESC, t.id DESC
        LIMIT ?`,
      RECENT_LIMIT,
    ),
  ]);
  return { categories, bills, entrySums, recent };
}
