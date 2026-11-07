/** Row types for seed.db. Schema and migrations: ./migrate.ts. Money is integer cents. */

export type CategoryKind = 'income' | 'expense';

/**
 * Stored values for bills.frequency, in picker order. The CHECK constraint in migrate.ts is built
 * from this list; adding a value needs a new migration step (SQLite can't alter a CHECK).
 */
export const BILL_FREQUENCIES = [
  'once',
  'daily',
  'weekly',
  'biweekly',
  'semimonthly',
  'monthly',
  'bimonthly',
  'quarterly',
  'semiannually',
  'yearly',
] as const;

export type BillFrequency = (typeof BILL_FREQUENCIES)[number];

export type CategoryRow = {
  id: number;
  name: string;
  description: string | null;
  kind: CategoryKind;
  sort_order: number;
  created_at: string;
};

export type BillRow = {
  id: number;
  category_id: number;
  name: string | null;
  amount_cents: number;
  frequency: BillFrequency;
  /** Local date, YYYY-MM-DD. */
  next_due_date: string;
  created_at: string;
};

export type TransactionRow = {
  id: number;
  category_id: number;
  /** Always positive; income or expense comes from the category. */
  amount_cents: number;
  /** Local date, YYYY-MM-DD. */
  date: string;
  note: string | null;
  created_at: string;
};
