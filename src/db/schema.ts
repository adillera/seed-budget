/** Row types for seed.db. Schema and migrations: ./migrate.ts. Money is integer cents. */

export type CategoryKind = 'income' | 'expense';

export type BillFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly';

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
