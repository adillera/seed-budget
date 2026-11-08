import type { SQLiteDatabase } from 'expo-sqlite';

import { STARTING_BUDGET_NOTE } from './onboarding';
import type { BillFrequency, CategoryKind } from './schema';

/** What the Export card counts: entries leave the starting budget out. */
export type ExportCounts = { entries: number; bills: number; categories: number; startingBudgets: number };

export type ExportCategory = { name: string; kind: CategoryKind; description: string | null };

export type ExportBill = {
  name: string | null;
  category: string;
  kind: CategoryKind;
  amount_cents: number;
  frequency: BillFrequency;
  start_date: string;
  next_due_date: string;
};

export type ExportTransaction = {
  date: string;
  category: string;
  kind: CategoryKind;
  amount_cents: number;
  note: string | null;
};

export type ExportData = {
  categories: ExportCategory[];
  /** The onboarding starting budget row(s), by date. */
  starting: ExportTransaction[];
  bills: ExportBill[];
  entries: ExportTransaction[];
};

export async function loadExportCounts(db: SQLiteDatabase): Promise<ExportCounts> {
  const row = await db.getFirstAsync<ExportCounts>(
    `SELECT (SELECT COUNT(*) FROM transactions WHERE note IS NOT ?) AS entries,
            (SELECT COUNT(*) FROM bills) AS bills,
            (SELECT COUNT(*) FROM categories) AS categories,
            (SELECT COUNT(*) FROM transactions WHERE note IS ?) AS startingBudgets`,
    STARTING_BUDGET_NOTE,
    STARTING_BUDGET_NOTE,
  );
  return row ?? { entries: 0, bills: 0, categories: 0, startingBudgets: 0 };
}

/** Every row for the CSV (features/settings/csv.ts), in file order. Call postDueBills first. */
export async function loadExportData(db: SQLiteDatabase): Promise<ExportData> {
  const transactionsSql = (startingOnly: boolean) =>
    `SELECT t.date, c.name AS category, c.kind, t.amount_cents, t.note
       FROM transactions t JOIN categories c ON c.id = t.category_id
      WHERE t.note ${startingOnly ? 'IS' : 'IS NOT'} ?
      ORDER BY t.date, t.id`;

  const [categories, starting, bills, entries] = await Promise.all([
    db.getAllAsync<ExportCategory>('SELECT name, kind, description FROM categories ORDER BY sort_order, id'),
    db.getAllAsync<ExportTransaction>(transactionsSql(true), STARTING_BUDGET_NOTE),
    db.getAllAsync<ExportBill>(
      `SELECT b.name, c.name AS category, c.kind, b.amount_cents, b.frequency, b.start_date, b.next_due_date
         FROM bills b JOIN categories c ON c.id = b.category_id
        ORDER BY b.next_due_date, b.id`,
    ),
    db.getAllAsync<ExportTransaction>(transactionsSql(false), STARTING_BUDGET_NOTE),
  ]);
  return { categories, starting, bills, entries };
}
